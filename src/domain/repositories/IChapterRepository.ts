import { Chapter } from "../models/Chapter";

export interface IChapterRepository {
  getChapter(id: string): Promise<Chapter>;
  getChapterPages(id: string): Promise<{ baseUrl: string, hash: string, pages: string[] }>;
  getMangaChapters(mangaId: string): Promise<Chapter[]>;
}
