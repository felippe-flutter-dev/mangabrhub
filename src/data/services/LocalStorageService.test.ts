import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageService } from './LocalStorageService';
import { auth } from "../../app/lib/firebase";

// Mock do Firebase Auth
vi.mock("../../app/lib/firebase", () => ({
  auth: {
    currentUser: null
  }
}));

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    service = new LocalStorageService();
    localStorage.clear();
    vi.clearAllMocks();
    (auth as any).currentUser = null; // Default to guest
  });

  it('should return empty array for read chapters when storage is empty', () => {
    const chapters = service.getReadChapters();
    expect(chapters).toEqual([]);
  });

  it('should mark a chapter as read with guest prefix', () => {
    service.markChapterAsRead('chap-123');
    const chapters = service.getReadChapters();
    expect(chapters).toContain('chap-123');

    // Verifica se a chave no localStorage tem o prefixo 'guest_'
    expect(localStorage.getItem('guest_read_chapters')).toContain('chap-123');
  });

  it('should mark a chapter as read with user prefix when logged in', () => {
    (auth as any).currentUser = { uid: 'user-456' };

    service.markChapterAsRead('chap-abc');
    const chapters = service.getReadChapters();

    expect(chapters).toContain('chap-abc');
    expect(localStorage.getItem('user-456_read_chapters')).toContain('chap-abc');
    // Não deve existir na chave de guest
    expect(localStorage.getItem('guest_read_chapters')).toBeNull();
  });

  it('should not add duplicate chapters to read list', () => {
    service.markChapterAsRead('chap-1');
    service.markChapterAsRead('chap-1');
    const chapters = service.getReadChapters();
    expect(chapters).toHaveLength(1);
  });

  it('should set and get currently reading chapter isolated by user', () => {
    // Guest set
    service.setCurrentlyReading('manga-1', 'chap-5');
    expect(service.getCurrentlyReading('manga-1')).toBe('chap-5');

    // User log in
    (auth as any).currentUser = { uid: 'user-1' };
    expect(service.getCurrentlyReading('manga-1')).toBeNull(); // Diferente usuário, lista vazia

    service.setCurrentlyReading('manga-1', 'chap-10');
    expect(service.getCurrentlyReading('manga-1')).toBe('chap-10');
  });

  it('should remove currently reading chapter', () => {
    service.setCurrentlyReading('manga-1', 'chap-5');
    service.removeCurrentlyReading('manga-1');
    const current = service.getCurrentlyReading('manga-1');
    expect(current).toBeNull();
  });
});
