import { useState, useEffect, useCallback } from "react";
import { Manga } from "../../domain/models/Manga";
import { SearchParams } from "../../domain/repositories/IMangaRepository";
import { mangaRepository } from "../../app/di";

export function useSearchViewModel(initialQuery: string = "") {
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [tagSelection, setTagSelection] = useState<Record<string, 'include' | 'exclude' | 'neutral'>>({});
  const [sortBy, setSortBy] = useState("relevance");
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentRating, setContentRating] = useState<string[]>(["safe", "suggestive"]);
  const [status, setStatus] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 30;

  useEffect(() => {
    mangaRepository.getTags().then(setTags);
  }, []);

  const handleSearch = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const includedTags = Object.entries(tagSelection)
        .filter(([_, state]) => state === 'include')
        .map(([id]) => id);

      const excludedTags = Object.entries(tagSelection)
        .filter(([_, state]) => state === 'exclude')
        .map(([id]) => id);

      const order: Record<string, 'asc' | 'desc'> = {};
      if (sortBy === 'relevance') order.relevance = 'desc';
      else if (sortBy === 'latest') order.latestUploadedChapter = 'desc';
      else if (sortBy === 'oldest') order.latestUploadedChapter = 'asc';
      else if (sortBy === 'title') order.title = 'asc';
      else if (sortBy === 'rating') order.rating = 'desc';
      else if (sortBy === 'followedCount') order.followedCount = 'desc';

      const offset = (page - 1) * limit;

      const params: SearchParams = {
        query: query || undefined,
        limit: limit,
        offset: offset,
        includedTags: includedTags.length > 0 ? includedTags : undefined,
        excludedTags: excludedTags.length > 0 ? excludedTags : undefined,
        contentRating: contentRating.length > 0 ? contentRating : ['safe', 'suggestive'],
        status: status.length > 0 ? status : undefined,
        order
      };

      const { data, total } = await mangaRepository.searchWithTotal(params);
      setResults(data);
      setTotalResults(total);
      setCurrentPage(page);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Erro ao realizar a busca.");
    } finally {
      setLoading(false);
    }
  }, [query, tagSelection, sortBy, contentRating, status]);

  const toggleTag = (id: string) => {
    setTagSelection(prev => {
      const current = prev[id] || 'neutral';
      let next: 'include' | 'exclude' | 'neutral' = 'neutral';
      if (current === 'neutral') next = 'include';
      else if (current === 'include') next = 'exclude';
      else next = 'neutral';

      if (next === 'neutral') {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const clearFilters = () => {
    setTagSelection({});
    setQuery("");
    setSortBy("relevance");
    setContentRating(["safe", "suggestive"]);
    setStatus([]);
    setCurrentPage(1);
  };

  return {
    tags,
    query,
    setQuery,
    tagSelection,
    toggleTag,
    sortBy,
    setSortBy,
    results,
    loading,
    error,
    contentRating,
    setContentRating,
    status,
    setStatus,
    handleSearch,
    clearFilters,
    currentPage,
    totalResults,
    limit,
    totalPages: Math.ceil(totalResults / limit)
  };
}
