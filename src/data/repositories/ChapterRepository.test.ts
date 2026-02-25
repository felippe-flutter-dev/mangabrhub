import { describe, it, expect, beforeEach } from 'vitest';
import { ChapterRepository } from './ChapterRepository';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';

describe('ChapterRepository', () => {
  let repository: ChapterRepository;

  beforeEach(() => {
    repository = new ChapterRepository();
  });

  it('should fetch a single chapter correctly', async () => {
    const chapterId = 'chap-1';
    server.use(
      http.get(`https://api.mangadex.org/chapter/${chapterId}`, () => {
        return HttpResponse.json({
          data: {
            id: chapterId,
            attributes: {
              volume: '1',
              chapter: '1',
              title: 'Chapter Title',
              translatedLanguage: 'pt-br',
              publishAt: '2023-01-01T00:00:00Z',
              pages: 20
            },
            relationships: [
              {
                type: 'scanlation_group',
                attributes: { name: 'Test Scan' }
              }
            ]
          }
        });
      })
    );

    const result = await repository.getChapter(chapterId);
    expect(result.id).toBe(chapterId);
    expect(result.chapter).toBe('1');
    expect(result.scanlationGroup).toBe('Test Scan');
  });

  it('should fetch chapter pages correctly', async () => {
    const chapterId = 'chap-1';
    server.use(
      http.get(`https://api.mangadex.org/at-home/server/${chapterId}`, () => {
        return HttpResponse.json({
          baseUrl: 'https://test.com',
          chapter: {
            hash: 'test-hash',
            data: ['page1.jpg', 'page2.jpg']
          }
        });
      })
    );

    const result = await repository.getChapterPages(chapterId);
    expect(result.baseUrl).toBe('https://test.com');
    expect(result.hash).toBe('test-hash');
    expect(result.pages).toHaveLength(2);
  });

  it('should fetch manga feed correctly', async () => {
    const mangaId = 'manga-1';
    server.use(
      http.get(`https://api.mangadex.org/manga/${mangaId}/feed`, () => {
        return HttpResponse.json({
          data: [
            {
              id: 'c1',
              attributes: { chapter: '1', title: 'C1', translatedLanguage: 'pt-br', pages: 10 },
              relationships: []
            }
          ],
          total: 1
        });
      })
    );

    const { data, total } = await repository.getMangaChapters(mangaId);
    expect(data).toHaveLength(1);
    expect(total).toBe(1);
    expect(data[0].id).toBe('c1');
  });
});
