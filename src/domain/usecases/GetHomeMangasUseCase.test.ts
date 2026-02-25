import { describe, it, expect, vi } from 'vitest';
import { GetHomeMangasUseCase } from './GetHomeMangasUseCase';
import { IMangaRepository } from '../repositories/IMangaRepository';
import { Manga } from '../models/Manga';

describe('GetHomeMangasUseCase', () => {
  it('should fetch popular, latest and top rated mangas from repository', async () => {
    // Mock do repositório
    const mockManga: Manga = {
      id: '1',
      title: 'Test Manga',
      description: '',
      status: 'ongoing',
      contentRating: 'safe',
      coverUrl: null,
      availableLanguages: ['pt-br'],
      tags: []
    };

    const mockRepository: IMangaRepository = {
      getPopularMangas: vi.fn().mockResolvedValue([mockManga]),
      getLatestMangas: vi.fn().mockResolvedValue([mockManga]),
      getTopRatedMangas: vi.fn().mockResolvedValue([mockManga]),
      searchMangas: vi.fn(),
      searchWithTotal: vi.fn(),
      getMangaById: vi.fn(),
      getTags: vi.fn(),
    };

    const useCase = new GetHomeMangasUseCase(mockRepository);
    const result = await useCase.execute();

    expect(mockRepository.getPopularMangas).toHaveBeenCalledWith(10);
    expect(mockRepository.getLatestMangas).toHaveBeenCalledWith(10);
    expect(mockRepository.getTopRatedMangas).toHaveBeenCalledWith(10);

    expect(result.popular).toHaveLength(1);
    expect(result.latest).toHaveLength(1);
    expect(result.topRated).toHaveLength(1);
  });
});
