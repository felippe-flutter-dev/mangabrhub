import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseUserRepository } from './FirebaseUserRepository';
import { getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Mock do Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

// Mock do módulo de configuração do Firebase local
vi.mock('../../app/lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'user-123',
    },
  },
}));

describe('FirebaseUserRepository', () => {
  let repository: FirebaseUserRepository;

  beforeEach(() => {
    repository = new FirebaseUserRepository();
    vi.clearAllMocks();
  });

  it('should fetch user lists correctly', async () => {
    const mockDocs = [
      {
        id: 'list-1',
        data: () => ({
          name: 'To Read',
          items: ['manga-1'],
          userId: 'user-123',
        }),
      },
    ];

    (getDocs as any).mockResolvedValue({
      docs: mockDocs,
    });

    const result = await repository.getLists();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('To Read');
    expect(result[0].id).toBe('list-1');
  });

  it('should save a new list correctly', async () => {
    const newList = { name: 'Favorites', items: [] };
    (addDoc as any).mockResolvedValue({ id: 'new-list-id' });

    const result = await repository.saveList(newList);

    expect(result.id).toBe('new-list-id');
    expect(result.userId).toBe('user-123');
    expect(addDoc).toHaveBeenCalled();
  });

  it('should update an existing list correctly', async () => {
    const existingList = { id: 'list-1', name: 'Updated Name', items: ['manga-1'] };
    (updateDoc as any).mockResolvedValue(undefined);

    const result = await repository.saveList(existingList);

    expect(result).toEqual(existingList);
    expect(updateDoc).toHaveBeenCalled();
  });

  it('should delete a list correctly', async () => {
    (deleteDoc as any).mockResolvedValue(undefined);

    await repository.deleteList('list-to-delete');

    expect(deleteDoc).toHaveBeenCalled();
  });

  it('should throw error when saving list without user', async () => {
    const { auth } = await import('../../app/lib/firebase');
    const originalUser = auth.currentUser;
    (auth as any).currentUser = null;

    await expect(repository.saveList({ name: 'Fail', items: [] }))
      .rejects.toThrow('User not authenticated');

    (auth as any).currentUser = originalUser;
  });
});
