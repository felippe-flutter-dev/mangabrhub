import { useState, useEffect, useCallback } from "react";
import { Manga } from "../../domain/models/Manga";
import { SearchParams } from "../../domain/repositories/IMangaRepository";
import { mangaRepository } from "../../app/di";
import { auth, onAuthStateChanged } from "../../app/lib/firebase";

const BASE_CACHE_KEY = 'search_filters_cache';
const CACHE_EXPIRATION_MS = 30 * 60 * 1000; // Aumentado para 30 min para melhor UX

interface CachedFilters {
  query: string;
  tagSelection: Record<string, 'include' | 'exclude' | 'neutral'>;
  sortBy: string;
  contentRating: string[];
  status: string[];
  currentPage: number;
  timestamp: number;
}

export function useSearchViewModel(initialQuery: string = "") {
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [user, setUser] = useState<any>(auth.currentUser);

  const getCacheKey = useCallback(() => {
    const uid = user?.uid || auth.currentUser?.uid || 'guest';
    return `${BASE_CACHE_KEY}_${uid}`;
  }, [user]);

  // Função auxiliar para ler o cache de forma síncrona
  const loadInitialCache = () => {
    const key = `${BASE_CACHE_KEY}_${auth.currentUser?.uid || 'guest'}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const data: CachedFilters = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_EXPIRATION_MS) {
          return data;
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  };

  const initialCache = loadInitialCache();

  // Estados inicializados diretamente do cache para evitar "flicker"
  const [query, setQuery] = useState(initialCache?.query ?? initialQuery);
  const [tagSelection, setTagSelection] = useState<Record<string, 'include' | 'exclude' | 'neutral'>>(initialCache?.tagSelection ?? {});
  const [sortBy, setSortBy] = useState(initialCache?.sortBy ?? "relevance");
  const [contentRating, setContentRating] = useState<string[]>(initialCache?.contentRating ?? ["safe", "suggestive", "erotica"]);
  const [status, setStatus] = useState<string[]>(initialCache?.status ?? []);
  const [currentPage, setCurrentPage] = useState(initialCache?.currentPage ?? 1);

  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const limit = 30;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    mangaRepository.getTags().then(setTags);
    return () => unsubscribe();
  }, []);

  const performSearch = useCallback(async (page: number, currentFilters: any) => {
    setLoading(true);
    setError(null);
    try {
      const {
        tagSelection: ts,
        sortBy: sb,
        contentRating: cr,
        status: st,
        query: q
      } = currentFilters;

      const includedTags = Object.entries(ts).filter(([, s]) => s === 'include').map(([id]) => id);
      const excludedTags = Object.entries(ts).filter(([, s]) => s === 'exclude').map(([id]) => id);

      const order: Record<string, 'asc' | 'desc'> = {};
      if (sb === 'relevance') order.relevance = 'desc';
      else if (sb === 'latest') order.latestUploadedChapter = 'desc';
      else if (sb === 'oldest') order.latestUploadedChapter = 'asc';
      else if (sb === 'title') order.title = 'asc';
      else if (sb === 'rating') order.rating = 'desc';
      else if (sb === 'followedCount') order.followedCount = 'desc';

      const params: SearchParams = {
        query: q || undefined,
        limit,
        offset: (page - 1) * limit,
        includedTags: includedTags.length > 0 ? includedTags : undefined,
        excludedTags: excludedTags.length > 0 ? excludedTags : undefined,
        contentRating: cr.length > 0 ? cr : ['safe', 'suggestive'],
        status: st.length > 0 ? st : undefined,
        order
      };

      const { data, total } = await mangaRepository.searchWithTotal(params);
      setResults(data);
      setTotalResults(total);
      setCurrentPage(page);

      // Persistência imediata após sucesso
      const cacheData: CachedFilters = {
        query: q,
        tagSelection: ts,
        sortBy: sb,
        contentRating: cr,
        status: st,
        currentPage: page,
        timestamp: Date.now()
      };
      localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    } catch (e) {
      setError("Erro ao realizar a busca.");
    } finally {
      setLoading(false);
    }
  }, [getCacheKey]);

  // Busca inicial baseada no que foi carregado no estado (seja cache ou inicial)
  useEffect(() => {
    performSearch(currentPage, { query, tagSelection, sortBy, contentRating, status });
     
  }, [user]);

  const toggleTag = (id: string) => {
    setTagSelection(prev => {
      const current = prev[id] || 'neutral';
      let next: 'include' | 'exclude' | 'neutral' = 'neutral';
      if (current === 'neutral') next = 'include';
      else if (current === 'include') next = 'exclude';
      else next = 'neutral';

      const newSelection = { ...prev };
      if (next === 'neutral') delete newSelection[id];
      else newSelection[id] = next;

      return newSelection;
    });
  };

  return {
    tags, query, setQuery, tagSelection, toggleTag, sortBy, setSortBy,
    results, loading, error, contentRating, setContentRating, status, setStatus,
    handleSearch: (page: number) => performSearch(page, { query, tagSelection, sortBy, contentRating, status }),
    clearFilters: () => {
      const defaults = { query: "", tagSelection: {}, sortBy: "relevance", contentRating: ["safe", "suggestive", "erotica"], status: [] };
      setQuery(defaults.query); setTagSelection(defaults.tagSelection); setSortBy(defaults.sortBy);
      setContentRating(defaults.contentRating); setStatus(defaults.status);
      setCurrentPage(1);
      localStorage.removeItem(getCacheKey());
      performSearch(1, defaults);
    },
    currentPage, totalResults, limit,
    totalPages: Math.ceil(totalResults / limit)
  };
}
