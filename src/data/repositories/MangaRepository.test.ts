import { describe, it, expect, beforeEach } from 'vitest';
import { MangaRepository } from './MangaRepository';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';

describe('MangaRepository', () => {
  let repository: MangaRepository;

  beforeEach(() => {
    repository = new MangaRepository();
  });

  it('should fetch popular mangas correctly', async () => {
    // Mock da API do MangaDex
    server.use(
      http.get('https://api.mangadex.org/manga', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('order[followedCount]') === 'desc') {
          return HttpResponse.json({
            data: [
              {
                id: '1',
                attributes: {
                  title: { en: 'Popular Manga' },
                  description: { en: 'Description' },
                  status: 'ongoing',
                  contentRating: 'safe',
                  tags: [],
                  availableTranslatedLanguages: ['pt-br']
                },
                relationships: []
              }
            ],
            total: 1
          });
        }
      })
    );

    const result = await repository.getPopularMangas();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Popular Manga');
    expect(result[0].id).toBe('1');
  });

  it('should handle search with parameters', async () => {
    server.use(
      http.get('https://api.mangadex.org/manga', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('title') === 'One Piece') {
          return HttpResponse.json({
            data: [
              {
                id: 'op-id',
                attributes: {
                  title: { en: 'One Piece' },
                  description: { en: 'Pirates' },
                  status: 'ongoing',
                  contentRating: 'safe',
                  tags: [],
                  availableTranslatedLanguages: ['pt-br']
                },
                relationships: []
              }
            ],
            total: 1
          });
        }
      })
    );

    const result = await repository.searchMangas({ query: 'One Piece' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('One Piece');
  });

  it('should return null when manga is not found', async () => {
    server.use(
      http.get('https://api.mangadex.org/manga/invalid-id', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const result = await repository.getMangaById('invalid-id');
    expect(result).toBeNull();
  });
});
