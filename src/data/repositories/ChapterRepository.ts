import { IChapterRepository } from "../../domain/repositories/IChapterRepository";
import { Chapter } from "../../domain/models/Chapter";
import axios from 'axios';

const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd ? '/api/proxy' : 'https://api.mangadex.org';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
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
      externalUrl: data.attributes.externalUrl,
    };
  }

  private getPath(endpoint: string): string {
    return isProd ? '' : endpoint;
  }

  async getChapter(id: string): Promise<Chapter> {
    const apiParams: any = {};
    if (isProd) apiParams.path = `chapter/${id}`;
    apiParams["includes[]"] = ["scanlation_group", "manga"];

    const response = await client.get(this.getPath(`/chapter/${id}`), { params: apiParams });
    if (!response.data?.data) throw new Error("Capítulo não encontrado.");
    return this.mapToChapter(response.data.data);
  }

  async getChapterPages(id: string): Promise<{ baseUrl: string, hash: string, pages: string[], dataSaver: string[] }> {
    const apiParams: any = {};
    if (isProd) apiParams.path = `at-home/server/${id}`;

    try {
      // Usando estritamente o Proxy para consistência e segurança
      const response = await client.get(this.getPath(`/at-home/server/${id}`), {
        params: apiParams
      });

      const { baseUrl, chapter } = response.data;
      if (!chapter?.data) throw new Error("Este capítulo não possui páginas disponíveis.");

      return {
        baseUrl,
        hash: chapter.hash,
        pages: chapter.data,
        dataSaver: chapter.dataSaver,
      };
    } catch (error: any) {
      console.error("[MangaBR Hub] Erro no Proxy ao buscar páginas:", error.message);
      throw new Error("Falha ao obter páginas via Proxy. Tente recarregar.");
    }
  }

  async getMangaChapters(mangaId: string, limit: number = 100, offset: number = 0, order: 'asc' | 'desc' = 'desc'): Promise<{ data: Chapter[], total: number }> {
    const apiParams: any = {
      limit, offset, "order[chapter]": order,
      "translatedLanguage[]": ['pt-br', 'pt'],
      "includes[]": ['scanlation_group'],
      "contentRating[]": ['safe', 'suggestive', 'erotica', 'pornographic']
    };
    if (isProd) apiParams.path = `manga/${mangaId}/feed`;

    const response = await client.get(this.getPath(`/manga/${mangaId}/feed`), { params: apiParams });
    return { data: response.data.data.map(this.mapToChapter), total: response.data.total };
  }
}
