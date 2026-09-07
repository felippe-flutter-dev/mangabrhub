import { useState, useEffect, useCallback, useRef } from "react";
import { Chapter } from "../../domain/models/Chapter";
import { Manga } from "../../domain/models/Manga";
import { chapterRepository, mangaRepository, storageService } from "../../app/di";
import { findAdjacentChapter } from "./readerNavigation";

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
    if (!force && now - lastRefreshTime.current < 10000) return;

    setRefreshingServer(true);
    try {
      const pageData = await chapterRepository.getChapterPages(chapterId);
      setBaseUrl(pageData.baseUrl);
      setHash(pageData.hash);
      setPages(pageData.pages);
      setDataSaverPages(pageData.dataSaver);
      setServerVersion(v => v + 1);
      lastRefreshTime.current = Date.now();
    } catch (err) {
      console.error("[Reader] Erro ao trocar servidor:", err);
    } finally {
      setRefreshingServer(false);
    }
  }, [chapterId, refreshingServer]);

  const loadChapterData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setNextChapterId(null);
    setPrevChapterId(null);
    hasMarkedAsReadThisSession.current = false;

    try {
      const chapData = await chapterRepository.getChapter(id);
      setChapter(chapData);

      if (chapData.externalUrl) {
         setError(`Este capítulo é servido externamente. Leia no site oficial.`);
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

      const mId = chapData.mangaId;
      if (mId) {
        const mangaData = await mangaRepository.getMangaById(mId);
        setManga(mangaData);
        storageService.setCurrentlyReading(mId, id);

        try {
          // A navegação do leitor usa somente PT-BR e mantém a scan atual
          // enquanto ela ainda tiver capítulos disponíveis.
          const { data: allChapters } = await chapterRepository.getMangaChapters(
            mId,
            500,
            0,
            'asc',
            ['pt-br'],
          );
          const next = findAdjacentChapter(allChapters, chapData, 'next');
          const previous = findAdjacentChapter(allChapters, chapData, 'previous');
          setNextChapterId(next?.id || null);
          setPrevChapterId(previous?.id || null);
        } catch (e) {
          // O capítulo continua legível mesmo se o feed não responder.
          console.warn("[Reader] Não foi possível carregar a sequência de capítulos.");
        }
      }
    } catch (err: any) {
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

  const constructPageUrl = useCallback((p: string, forceQuality?: 'data' | 'data-saver') => {
    if (!baseUrl || !hash || !p) return "";
    const type = forceQuality || (quality === 'data-saver' ? 'data-saver' : 'data');
    const rawUrl = `${baseUrl}/${type}/${hash}/${p}`;

    if (isProd) {
      return `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
    }

    const cacheBuster = serverVersion > 0 ? `v=${serverVersion}` : '';
    return `${rawUrl}${cacheBuster ? '?' + cacheBuster : ''}`;
  }, [baseUrl, hash, quality, serverVersion]);

  return {
    chapter, manga, pages: quality === 'data-saver' ? dataSaverPages : pages, loading, error,
    mode, setMode: updateMode,
    quality, setQuality: updateQuality,
    currentPage, setCurrentPage, nextChapterId, prevChapterId,
    constructPageUrl,
    refreshImageServer,
    serverVersion,
    markAsRead: () => chapterId && storageService.markChapterAsRead(chapterId),
    reload: () => chapterId && loadChapterData(chapterId)
  };
}
