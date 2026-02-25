import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageService } from './LocalStorageService';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = new LocalStorageService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return empty array for read chapters when storage is empty', () => {
    const chapters = service.getReadChapters();
    expect(chapters).toEqual([]);
  });

  it('should mark a chapter as read', () => {
    service.markChapterAsRead('chap-123');
    const chapters = service.getReadChapters();
    expect(chapters).toContain('chap-123');
    expect(localStorage.getItem('read_chapters')).toContain('chap-123');
  });

  it('should not add duplicate chapters to read list', () => {
    service.markChapterAsRead('chap-1');
    service.markChapterAsRead('chap-1');
    const chapters = service.getReadChapters();
    expect(chapters).toHaveLength(1);
  });

  it('should set and get currently reading chapter', () => {
    service.setCurrentlyReading('manga-1', 'chap-5');
    const current = service.getCurrentlyReading('manga-1');
    expect(current).toBe('chap-5');
  });

  it('should remove currently reading chapter', () => {
    service.setCurrentlyReading('manga-1', 'chap-5');
    service.removeCurrentlyReading('manga-1');
    const current = service.getCurrentlyReading('manga-1');
    expect(current).toBeNull();
  });
});
