import { IChapterRepository } from "../../domain/repositories/IChapterRepository";
import { Chapter } from "../../domain/models/Chapter";
import axios from 'axios';

const API_BASE_URL = 'https://api.mangadex.org';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'common': {},
    'get': {}
  },
  paramsSerializer: {
    serialize: (params) => {
      return Object.entries(params)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map(v => `${key}=${v}`).join('&');
          }
          return `${key}=${value}`;
        })
        .join('&');
    }
  }
});

export class ChapterRepository implements IChapterRepository {
  private mapToChapter(data: any): Chapter {
    const scanGroup = data.relationships.find((r: any) => r.type === 'scanlation_group');

    return {
      id: data.id,
      volume: data.attributes.volume,
      chapter: data.attributes.chapter,
      title: data.attributes.title,
      translatedLanguage: data.attributes.translatedLanguage,
      publishAt: data.attributes.publishAt,
      pages: data.attributes.pages,
      scanlationGroup: scanGroup?.attributes?.name,
    };
  }

  async getChapter(id: string): Promise<Chapter> {
    const response = await client.get(`/chapter/${id}`, {
      params: {
        "includes[]": "scanlation_group"
      }
    });
    return this.mapToChapter(response.data.data);
  }

  async getChapterPages(id: string): Promise<{ baseUrl: string, hash: string, pages: string[] }> {
    const response = await client.get(`/at-home/server/${id}`);
    const { baseUrl, chapter } = response.data;
    return {
      baseUrl,
      hash: chapter.hash,
      pages: chapter.data,
    };
  }

  async getMangaChapters(mangaId: string, limit: number = 100, offset: number = 0, order: 'asc' | 'desc' = 'desc'): Promise<{ data: Chapter[], total: number }> {
    const response = await client.get(`/manga/${mangaId}/feed`, {
      params: {
        limit,
        offset,
        "order[chapter]": order,
        "translatedLanguage[]": ['pt-br', 'pt'],
        "includes[]": ['scanlation_group']
      }
    });
    return {
      data: response.data.data.map(this.mapToChapter),
      total: response.data.total
    };
  }
}
