import { useState, useEffect, useCallback, useMemo } from "react";
import { Chapter } from "../../domain/models/Chapter";
import { chapterRepository, storageService } from "../../app/di";

export interface GroupedChapter {
  chapterNumber: string;
  versions: Chapter[];
}

export function useChapterListViewModel(mangaId: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const [currentReadId, setCurrentReadId] = useState<string | null>(null);
  const [sortOrder, setSortBy] = useState<'asc' | 'desc'>('desc');

  const limit = 100;

  const refreshStorageData = useCallback(() => {
    setReadChapters(storageService.getReadChapters());
    setCurrentReadId(storageService.getCurrentlyReading(mangaId));
  }, [mangaId]);

  const fetchChapters = useCallback(async (page: number = 1, order: 'asc' | 'desc' = sortOrder) => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const { data } = await chapterRepository.getMangaChapters(mangaId, limit, offset, order);
      setChapters(data);
      setLoading(false);
    } catch (err) {
      setError("Erro ao carregar capítulos.");
      setLoading(false);
    }
  }, [mangaId, sortOrder]);

  const groupedChapters = useMemo(() => {
    const groups: Record<string, Chapter[]> = {};
    chapters.forEach(chap => {
      const num = chap.chapter || "Oneshot";
      if (!groups[num]) groups[num] = [];
      groups[num].push(chap);
    });

    return Object.entries(groups).map(([num, versions]) => ({
      chapterNumber: num,
      versions: versions.sort((a, b) => (a.scanlationGroup || "").localeCompare(b.scanlationGroup || ""))
    })).sort((a, b) => {
      const numA = parseFloat(a.chapterNumber) || 0;
      const numB = parseFloat(b.chapterNumber) || 0;
      return sortOrder === 'desc' ? numB - numA : numA - numB;
    });
  }, [chapters, sortOrder]);

  useEffect(() => {
    fetchChapters(1, sortOrder);
    refreshStorageData();

    const handleUpdate = () => {
      refreshStorageData();
    };

    window.addEventListener('chapters_updated', handleUpdate);
    return () => window.removeEventListener('chapters_updated', handleUpdate);
  }, [mangaId, fetchChapters, sortOrder, refreshStorageData]);

  return {
    groupedChapters,
    loading,
    error,
    sortOrder,
    toggleSortOrder: () => setSortBy(prev => prev === 'desc' ? 'asc' : 'desc'),
    isRead: (id: string) => readChapters.includes(id),
    isCurrentlyReading: (id: string) => currentReadId === id,
    totalChapters: chapters.length
  };
}
