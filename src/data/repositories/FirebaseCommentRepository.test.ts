import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseCommentRepository } from './FirebaseCommentRepository';
import { getDocs, addDoc } from 'firebase/firestore';

// Mock do Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

vi.mock('../../app/lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'user-123',
      displayName: 'Test User',
      photoURL: 'https://test.com/photo.jpg',
    },
  },
}));

describe('FirebaseCommentRepository', () => {
  let repository: FirebaseCommentRepository;

  beforeEach(() => {
    repository = new FirebaseCommentRepository();
    vi.clearAllMocks();
  });

  it('should fetch comments correctly', async () => {
    const mockDocs = [
      {
        id: 'comment-1',
        data: () => ({
          content: 'Great manga!',
          userId: 'user-1',
          userName: 'User 1',
          createdAt: { seconds: 1000 },
        }),
      },
    ];

    (getDocs as any).mockResolvedValue({
      docs: mockDocs,
    });

    const result = await repository.getComments('manga', 'manga-123');

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Great manga!');
    expect(result[0].id).toBe('comment-1');
  });

  it('should post a comment correctly', async () => {
    (addDoc as any).mockResolvedValue({ id: 'new-comment-id' });

    const result = await repository.postComment('manga', 'manga-123', 'New comment content');

    expect(result.id).toBe('new-comment-id');
    expect(addDoc).toHaveBeenCalled();
  });

  it('should throw error when posting comment without user', async () => {
    // Importamos dinamicamente para alterar o mock do auth se necessário,
    // ou usamos uma abordagem mais simples aqui apenas alterando o mock retornado.
    const { auth } = await import('../../app/lib/firebase');
    const originalUser = auth.currentUser;
    (auth as any).currentUser = null;

    await expect(repository.postComment('manga', 'manga-1', 'content'))
      .rejects.toThrow('User not authenticated');

    (auth as any).currentUser = originalUser;
  });
});
