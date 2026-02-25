import { useState, useEffect, useCallback, useMemo } from "react";
import { Chapter } from "../../domain/models/Chapter";
import { chapterRepository } from "../../app/di";

// Funções para LocalStorage
const getReadChapters = (): string[] => {
  try {
    const saved = localStorage.getItem('read_chapters');
    return saved ? JSON.parse(saved) : [];
  } catch (e) { return []; }
};

const getCurrentlyReading = (mangaId: string): string | null => {
  try {
    const reading = JSON.parse(localStorage.getItem('currently_reading') || '{}');
    return reading[mangaId] || null;
  } catch (e) { return null; }
};

export interface GroupedChapter {
  chapterNumber: string;
  versions: Chapter[];
}

export function useChapterListViewModel(mangaId: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readChapters, setReadChapters] = useState<string[]>(getReadChapters());
  const [currentReadId, setCurrentReadId] = useState<string | null>(getCurrentlyReading(mangaId));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const limit = 100;

  const fetchChapters = useCallback(async (page: number = 1, order: 'asc' | 'desc' = sortOrder) => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const { data } = await chapterRepository.getMangaChapters(mangaId, limit, offset, order);
      setChapters(data);
      setLoading(false);
    } catch (err) { setError("Erro."); setLoading(false); }
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
    const handleUpdate = () => {
      setReadChapters(getReadChapters());
      setCurrentReadId(getCurrentlyReading(mangaId));
    };
    window.addEventListener('chapters_updated', handleUpdate);
    return () => window.removeEventListener('chapters_updated', handleUpdate);
  }, [mangaId, fetchChapters, sortOrder]);

  return {
    groupedChapters, loading, error, sortOrder,
    toggleSortOrder: () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'),
    isRead: (id: string) => readChapters.includes(id),
    isCurrentlyReading: (id: string) => currentReadId === id,
    totalChapters: chapters.length
  };
}
