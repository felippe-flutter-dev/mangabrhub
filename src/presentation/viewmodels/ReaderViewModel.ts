import { useState, useEffect, useCallback, useRef } from "react";
import { Chapter } from "../../domain/models/Chapter";
import { Manga } from "../../domain/models/Manga";
import { chapterRepository, mangaRepository, storageService } from "../../app/di";

const isProd = import.meta.env.PROD;

export function useReaderViewModel(chapterId: string | undefined, _userUid: string = 'guest') {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [manga, setManga] = useState<Manga | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [hash, setHash] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'paged' | 'scroll'>(() =>
    (localStorage.getItem('reader_mode') as any) || 'paged'
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);
  const [prevChapterId, setPrevChapterId] = useState<string | null>(null);

  const hasMarkedAsReadThisSession = useRef(false);

  const loadChapterData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    hasMarkedAsReadThisSession.current = false;

    try {
      const [chapData, pageData] = await Promise.all([
        chapterRepository.getChapter(id),
        chapterRepository.getChapterPages(id)
      ]);

      setChapter(chapData);
      setBaseUrl(pageData.baseUrl);
      setHash(pageData.hash);
      setPages(pageData.pages);
      setCurrentPage(0);

      const proxyPath = `chapter/${id}?includes[]=manga&includes[]=scanlation_group`;
      const url = isProd ? `/api/proxy?path=${proxyPath}` : `https://api.mangadex.org/${proxyPath}`;

      const response = await fetch(url);
      const json = await response.json();

      const mangaRel = json.data.relationships.find((r: any) => r.type === 'manga');
      if (mangaRel) {
        const mId = mangaRel.id;
        const mangaData = await mangaRepository.getMangaById(mId);
        setManga(mangaData);
        storageService.setCurrentlyReading(mId, id);

        const feedPath = `manga/${mId}/feed?translatedLanguage[]=pt-br&translatedLanguage[]=pt&order[chapter]=asc&limit=500&includes[]=scanlation_group`;
        const feedUrl = isProd ? `/api/proxy?path=${encodeURIComponent(feedPath)}` : `https://api.mangadex.org/${feedPath}`;
        const feedRes = await fetch(feedUrl);
        const feedJson = await feedRes.json();
        const allChapters = feedJson.data;
        const currentNum = parseFloat(json.data.attributes.chapter);

        const next = allChapters.find((c: any) => parseFloat(c.attributes.chapter) > currentNum);
        setNextChapterId(next?.id || null);

        const prev = allChapters.reverse().find((c: any) => parseFloat(c.attributes.chapter) < currentNum);
        setPrevChapterId(prev?.id || null);
      }
    } catch (_err) {
      setError("Falha ao carregar capítulo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (chapterId) loadChapterData(chapterId);
  }, [chapterId, loadChapterData]);

  const handleMarkAsRead = useCallback(() => {
    if (chapterId && !hasMarkedAsReadThisSession.current) {
       storageService.markChapterAsRead(chapterId);
       hasMarkedAsReadThisSession.current = true;
    }
  }, [chapterId]);

  return {
    chapter, manga, pages, loading, error, mode, setMode,
    currentPage, setCurrentPage, nextChapterId, prevChapterId,
    constructPageUrl: (p: string) => `${baseUrl}/data/${hash}/${p}`,
    markAsRead: handleMarkAsRead,
    reload: () => chapterId && loadChapterData(chapterId)
  };
}
