import { IStorageService } from "../../domain/services/IStorageService";
import { auth } from "../../app/lib/firebase";

export class LocalStorageService implements IStorageService {
  private readonly READ_CHAPTERS_SUFFIX = 'read_chapters';
  private readonly CURRENTLY_READING_SUFFIX = 'currently_reading';

  private getPrefix(): string {
    return auth.currentUser?.uid || 'guest';
  }

  private getKey(suffix: string): string {
    return `${this.getPrefix()}_${suffix}`;
  }

  getReadChapters(): string[] {
    try {
      const saved = localStorage.getItem(this.getKey(this.READ_CHAPTERS_SUFFIX));
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  markChapterAsRead(chapterId: string): void {
    if (!chapterId) return;
    try {
      const read = this.getReadChapters();
      if (!read.includes(chapterId)) {
        read.push(chapterId);
        localStorage.setItem(this.getKey(this.READ_CHAPTERS_SUFFIX), JSON.stringify(read));

        // Quando marca como lido, remove do "lendo"
        this.removeCurrentlyReadingByChapter(chapterId);

        window.dispatchEvent(new Event('chapters_updated'));
      }
    } catch (err) { /* ignore */ }
  }

  getCurrentlyReading(mangaId: string): string | null {
    try {
      const reading = JSON.parse(localStorage.getItem(this.getKey(this.CURRENTLY_READING_SUFFIX)) || '{}');
      return reading[mangaId] || null;
    } catch (e) {
      return null;
    }
  }

  setCurrentlyReading(mangaId: string, chapterId: string): void {
    if (!mangaId || !chapterId) return;
    try {
      // Se já estiver lido, não marca como lendo
      if (this.getReadChapters().includes(chapterId)) return;

      const reading = JSON.parse(localStorage.getItem(this.getKey(this.CURRENTLY_READING_SUFFIX)) || '{}');
      if (reading[mangaId] !== chapterId) {
        reading[mangaId] = chapterId;
        localStorage.setItem(this.getKey(this.CURRENTLY_READING_SUFFIX), JSON.stringify(reading));
        window.dispatchEvent(new Event('chapters_updated'));
      }
    } catch (e) { /* ignore */ }
  }

  removeCurrentlyReading(mangaId: string): void {
    try {
      const reading = JSON.parse(localStorage.getItem(this.getKey(this.CURRENTLY_READING_SUFFIX)) || '{}');
      delete reading[mangaId];
      localStorage.setItem(this.getKey(this.CURRENTLY_READING_SUFFIX), JSON.stringify(reading));
      window.dispatchEvent(new Event('chapters_updated'));
    } catch (e) { /* ignore */ }
  }

  private removeCurrentlyReadingByChapter(chapterId: string): void {
    try {
      const key = this.getKey(this.CURRENTLY_READING_SUFFIX);
      const reading = JSON.parse(localStorage.getItem(key) || '{}');
      let changed = false;
      for (const mId in reading) {
        if (reading[mId] === chapterId) {
          delete reading[mId];
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(key, JSON.stringify(reading));
      }
    } catch (e) { /* ignore */ }
  }
}
