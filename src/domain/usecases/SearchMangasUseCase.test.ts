import { describe, it, expect, vi } from 'vitest';
import { SearchMangasUseCase } from './SearchMangasUseCase';
import { IMangaRepository, SearchParams } from '../repositories/IMangaRepository';
import { Manga } from '../models/Manga';

describe('SearchMangasUseCase', () => {
  it('should call searchMangas on repository with provided params', async () => {
    const mockManga: Manga = {
      id: '1',
      title: 'Search Result',
      description: '',
      status: 'ongoing',
      contentRating: 'safe',
      coverUrl: null,
      availableLanguages: ['pt-br'],
      tags: []
    };

    const mockRepository: IMangaRepository = {
      getPopularMangas: vi.fn(),
      getLatestMangas: vi.fn(),
      getTopRatedMangas: vi.fn(),
      searchMangas: vi.fn().mockResolvedValue([mockManga]),
      searchWithTotal: vi.fn(),
      getMangaById: vi.fn(),
      getTags: vi.fn(),
    };

    const useCase = new SearchMangasUseCase(mockRepository);
    const params: SearchParams = { query: 'One Piece', limit: 20 };

    const result = await useCase.execute(params);

    expect(mockRepository.searchMangas).toHaveBeenCalledWith(params);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Search Result');
  });
});
