import { Chapter } from "../models/Chapter";

export interface IChapterRepository {
  getChapter(id: string): Promise<Chapter>;
  getChapterPages(id: string): Promise<{ baseUrl: string, hash: string, pages: string[], dataSaver: string[] }>;
  getMangaChapters(mangaId: string, limit?: number, offset?: number, order?: 'asc' | 'desc'): Promise<{ data: Chapter[], total: number }>;
}
