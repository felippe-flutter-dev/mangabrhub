import { Manga } from "../models/Manga";

export interface SearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  includedTags?: string[];
  excludedTags?: string[];
  status?: string[];
  contentRating?: string[];
  order?: Record<string, 'asc' | 'desc'>;
}

export interface IMangaRepository {
  getPopularMangas(limit: number): Promise<Manga[]>;
  getLatestMangas(limit: number): Promise<Manga[]>;
  getTopRatedMangas(limit: number): Promise<Manga[]>;
  searchMangas(params: SearchParams): Promise<Manga[]>;
  searchWithTotal(params: SearchParams): Promise<{ data: Manga[], total: number }>;
  getMangaById(id: string): Promise<Manga | null>;
  getTags(): Promise<{ id: string; name: string }[]>;
}
