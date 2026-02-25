import { IStorageService } from "../../domain/services/IStorageService";

export class LocalStorageService implements IStorageService {
  private readonly READ_CHAPTERS_KEY = 'read_chapters';
  private readonly CURRENTLY_READING_KEY = 'currently_reading';

  getReadChapters(): string[] {
    try {
      const saved = localStorage.getItem(this.READ_CHAPTERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  markChapterAsRead(chapterId: string): void {
    try {
      const read = this.getReadChapters();
      if (!read.includes(chapterId)) {
        read.push(chapterId);
        localStorage.setItem(this.READ_CHAPTERS_KEY, JSON.stringify(read));
        window.dispatchEvent(new Event('chapters_updated'));
      }
    } catch (err) {
      console.error("LocalStorageService: Error saving read chapter", err);
    }
  }

  getCurrentlyReading(mangaId: string): string | null {
    try {
      const reading = JSON.parse(localStorage.getItem(this.CURRENTLY_READING_KEY) || '{}');
      return reading[mangaId] || null;
    } catch (e) {
      return null;
    }
  }

  setCurrentlyReading(mangaId: string, chapterId: string): void {
    try {
      const reading = JSON.parse(localStorage.getItem(this.CURRENTLY_READING_KEY) || '{}');
      reading[mangaId] = chapterId;
      localStorage.setItem(this.CURRENTLY_READING_KEY, JSON.stringify(reading));
      window.dispatchEvent(new Event('chapters_updated'));
    } catch (e) {
      console.error("LocalStorageService: Error saving currently reading", e);
    }
  }

  removeCurrentlyReading(mangaId: string): void {
    try {
      const reading = JSON.parse(localStorage.getItem(this.CURRENTLY_READING_KEY) || '{}');
      delete reading[mangaId];
      localStorage.setItem(this.CURRENTLY_READING_KEY, JSON.stringify(reading));
      window.dispatchEvent(new Event('chapters_updated'));
    } catch (e) {
      console.error("LocalStorageService: Error removing currently reading", e);
    }
  }
}
