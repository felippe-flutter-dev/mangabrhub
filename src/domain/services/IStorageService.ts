export interface IStorageService {
  getReadChapters(): string[];
  markChapterAsRead(chapterId: string): void;
  getCurrentlyReading(mangaId: string): string | null;
  setCurrentlyReading(mangaId: string, chapterId: string): void;
  removeCurrentlyReading(mangaId: string): void;
}
