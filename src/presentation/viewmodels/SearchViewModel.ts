import { useState, useEffect, useCallback } from "react";
import { Manga } from "../../domain/models/Manga";
import { SearchParams } from "../../domain/repositories/IMangaRepository";
import { mangaRepository } from "../../app/di";
import { auth, onAuthStateChanged } from "../../app/lib/firebase";

const BASE_CACHE_KEY = 'search_filters_cache';
const CACHE_EXPIRATION_MS = 15 * 60 * 1000;

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const getCacheKey = useCallback(() => {
    return `${BASE_CACHE_KEY}_${user?.uid || 'guest'}`;
  }, [user]);

  const [query, setQuery] = useState(initialQuery);
  const [tagSelection, setTagSelection] = useState<Record<string, 'include' | 'exclude' | 'neutral'>>({});
  const [sortBy, setSortBy] = useState("relevance");
  const [contentRating, setContentRating] = useState<string[]>(["safe", "suggestive", "erotica"]);
  const [status, setStatus] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const limit = 30;

  const performSearch = useCallback(async (page: number, currentFilters: Partial<CachedFilters>) => {
    setLoading(true);
    setError(null);
    try {
      const {
        tagSelection: tagsSel = tagSelection,
        sortBy: sort = sortBy,
        contentRating: rating = contentRating,
        status: stat = status,
        query: q = query
      } = currentFilters;

      const includedTags = Object.entries(tagsSel).filter(([_t, s]) => s === 'include').map(([id]) => id);
      const excludedTags = Object.entries(tagsSel).filter(([_t, s]) => s === 'exclude').map(([id]) => id);

      const order: Record<string, 'asc' | 'desc'> = {};
      if (sort === 'relevance') order.relevance = 'desc';
      else if (sort === 'latest') order.latestUploadedChapter = 'desc';
      else if (sort === 'oldest') order.latestUploadedChapter = 'asc';
      else if (sort === 'title') order.title = 'asc';
      else if (sort === 'rating') order.rating = 'desc';
      else if (sort === 'followedCount') order.followedCount = 'desc';

      const params: SearchParams = {
        query: q || undefined,
        limit,
        offset: (page - 1) * limit,
        includedTags: includedTags.length > 0 ? includedTags : undefined,
        excludedTags: excludedTags.length > 0 ? excludedTags : undefined,
        contentRating: rating.length > 0 ? rating : ['safe', 'suggestive'],
        status: stat.length > 0 ? stat : undefined,
        order
      };

      const { data, total } = await mangaRepository.searchWithTotal(params);
      setResults(data);
      setTotalResults(total);
      setCurrentPage(page);

      // Salva no cache com os filtros usados na busca real
      const cacheData: CachedFilters = {
        query: q,
        tagSelection: tagsSel,
        sortBy: sort,
        contentRating: rating,
        status: stat,
        currentPage: page,
        timestamp: Date.now()
      };
      localStorage.setItem(getCacheKey(), JSON.stringify(cacheData));
    } catch (_err) {
      setError("Erro ao realizar a busca.");
    } finally {
      setLoading(false);
    }
  }, [query, tagSelection, sortBy, contentRating, status, getCacheKey]);

  // Carregar Cache Inicial e DISPARAR busca com os dados do cache
  useEffect(() => {
    const cached = localStorage.getItem(getCacheKey());
    if (cached) {
      try {
        const data: CachedFilters = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_EXPIRATION_MS) {
          setQuery(data.query);
          setTagSelection(data.tagSelection);
          setSortBy(data.sortBy);
          setContentRating(data.contentRating);
          setStatus(data.status);
          setCurrentPage(data.currentPage);

          // Dispara a busca imediatamente com os dados recuperados
          performSearch(data.currentPage, data);
        } else {
          localStorage.removeItem(getCacheKey());
          performSearch(1, {});
        }
      } catch (_e) {
        localStorage.removeItem(getCacheKey());
        performSearch(1, {});
      }
    } else {
      performSearch(1, {});
    }
    mangaRepository.getTags().then(setTags);
  }, [user, getCacheKey]); // Somente no mount ou troca de user

  const toggleTag = (id: string) => {
    setTagSelection(prev => {
      const current = prev[id] || 'neutral';
      let next: 'include' | 'exclude' | 'neutral' = 'neutral';
      if (current === 'neutral') next = 'include';
      else if (current === 'include') next = 'exclude';
      else next = 'neutral';
      if (next === 'neutral') {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  return {
    tags, query, setQuery, tagSelection, toggleTag, sortBy, setSortBy,
    results, loading, error, contentRating, setContentRating, status, setStatus,
    handleSearch: (page: number) => performSearch(page, { query, tagSelection, sortBy, contentRating, status }),
    clearFilters: () => {
      const defaultFilters = {
        query: "",
        tagSelection: {},
        sortBy: "relevance",
        contentRating: ["safe", "suggestive", "erotica"],
        status: []
      };
      setTagSelection(defaultFilters.tagSelection);
      setQuery(defaultFilters.query);
      setSortBy(defaultFilters.sortBy);
      setContentRating(defaultFilters.contentRating);
      setStatus(defaultFilters.status);
      setCurrentPage(1);
      localStorage.removeItem(getCacheKey());
      performSearch(1, defaultFilters);
    },
    currentPage, totalResults, limit,
    totalPages: Math.ceil(totalResults / limit)
  };
}
