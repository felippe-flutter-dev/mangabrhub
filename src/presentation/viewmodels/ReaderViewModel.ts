import { useState, useEffect, useCallback, useRef } from "react";
import { Chapter } from "../../domain/models/Chapter";
import { Manga } from "../../domain/models/Manga";
import { chapterRepository, mangaRepository, storageService } from "../../app/di";

const isProd = import.meta.env.PROD;

export function useReaderViewModel(chapterId: string | undefined, _userUid: string = 'guest') {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [manga, setManga] = useState<Manga | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [dataSaverPages, setDataSaverPages] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [hash, setHash] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingServer, setRefreshingServer] = useState(false);

  const [serverVersion, setServerVersion] = useState(0);

  const [mode, setMode] = useState<'paged' | 'scroll'>(() =>
    (localStorage.getItem('reader_mode') as any) || 'paged'
  );

  const [quality, setQuality] = useState<'original' | 'data-saver'>(() =>
    (localStorage.getItem('reader_quality') as any) || 'original'
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [nextChapterId, setNextChapterId] = useState<string | null>(null);
  const [prevChapterId, setPrevChapterId] = useState<string | null>(null);

  const hasMarkedAsReadThisSession = useRef(false);
  const lastRefreshTime = useRef(0);

  const refreshImageServer = useCallback(async (force = false) => {
    if (!chapterId || refreshingServer) return;

    const now = Date.now();
    if (!force && now - lastRefreshTime.current < 5000) return;

    setRefreshingServer(true);
    try {
      const pageData = await chapterRepository.getChapterPages(chapterId);
      setBaseUrl(pageData.baseUrl);
      setHash(pageData.hash);
      setPages(pageData.pages);
      setDataSaverPages(pageData.dataSaver);
      setServerVersion(v => v + 1);
      lastRefreshTime.current = Date.now();
      console.log(`MangaDex image server refreshed (v${serverVersion + 1})`);
    } catch (err) {
      console.error("Failed to refresh MangaDex image server:", err);
    } finally {
      setRefreshingServer(false);
    }
  }, [chapterId, refreshingServer, serverVersion]);

  const loadChapterData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    hasMarkedAsReadThisSession.current = false;

    try {
      const chapData = await chapterRepository.getChapter(id);
      setChapter(chapData);

      // Verifica se é um capítulo externo
      if (chapData.externalUrl) {
         setError(`Este capítulo é servido externamente (${new URL(chapData.externalUrl).hostname}). Por favor, leia no site oficial.`);
         setLoading(false);
         return;
      }

      const pageData = await chapterRepository.getChapterPages(id);
      setBaseUrl(pageData.baseUrl);
      setHash(pageData.hash);
      setPages(pageData.pages);
      setDataSaverPages(pageData.dataSaver);
      setServerVersion(0);
      setCurrentPage(0);

      const mId = (chapData as any).relationships?.find((r: any) => r.type === 'manga')?.id;

      if (mId) {
        const mangaData = await mangaRepository.getMangaById(mId);
        setManga(mangaData);
        storageService.setCurrentlyReading(mId, id);

        const feedPath = `manga/${mId}/feed?translatedLanguage[]=pt-br&translatedLanguage[]=pt&order[chapter]=asc&limit=500&includes[]=scanlation_group`;
        const feedUrl = isProd ? `/api/proxy?path=${encodeURIComponent(feedPath)}` : `https://api.mangadex.org/${feedPath}`;
        const feedRes = await fetch(feedUrl);
        const feedJson = await feedRes.json();

        if (feedJson.data) {
          const allChapters = feedJson.data;
          const currentNum = parseFloat(chapData.chapter);

          const next = allChapters.find((c: any) => parseFloat(c.attributes.chapter) > currentNum);
          setNextChapterId(next?.id || null);

          const prev = [...allChapters].reverse().find((c: any) => parseFloat(c.attributes.chapter) < currentNum);
          setPrevChapterId(prev?.id || null);
        }
      }
    } catch (err: any) {
      console.error("Reader Error:", err);
      setError(err.message || "Falha ao carregar capítulo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (chapterId) loadChapterData(chapterId);
  }, [chapterId, loadChapterData]);

  const updateMode = (newMode: 'paged' | 'scroll') => {
    setMode(newMode);
    localStorage.setItem('reader_mode', newMode);
  };

  const updateQuality = (newQuality: 'original' | 'data-saver') => {
    setQuality(newQuality);
    localStorage.setItem('reader_quality', newQuality);
  };

  const handleMarkAsRead = useCallback(() => {
    if (chapterId && !hasMarkedAsReadThisSession.current) {
       storageService.markChapterAsRead(chapterId);
       hasMarkedAsReadThisSession.current = true;
    }
  }, [chapterId]);

  const constructPageUrl = (p: string, forceQuality?: 'data' | 'data-saver') => {
    if (!baseUrl || !hash || !p) return "";
    const type = forceQuality || (quality === 'data-saver' ? 'data-saver' : 'data');
    const cacheBuster = serverVersion > 0 ? `&v=${serverVersion}` : '';
    // MangaDex requer o uso do baseUrl retornado pelo /at-home/server
    return `${baseUrl}/${type}/${hash}/${p}?t=${Date.now()}${cacheBuster}`;
  };

  return {
    chapter, manga, pages: quality === 'data-saver' ? dataSaverPages : pages, loading, error,
    mode, setMode: updateMode,
    quality, setQuality: updateQuality,
    currentPage, setCurrentPage, nextChapterId, prevChapterId,
    constructPageUrl,
    refreshImageServer,
    serverVersion,
    markAsRead: handleMarkAsRead,
    reload: () => chapterId && loadChapterData(chapterId)
  };
}
