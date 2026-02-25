import { IMangaRepository, SearchParams } from "../../domain/repositories/IMangaRepository";
import { Manga } from "../../domain/models/Manga";
import axios from 'axios';

const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd ? '/api/proxy' : 'https://api.mangadex.org';
const UPLOADS_BASE_URL = 'https://uploads.mangadex.org';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

export class MangaRepository implements IMangaRepository {
  private mapToManga(data: any): Manga {
    const title = Object.values(data.attributes.title)[0] as string || "Untitled";
    const coverRel = data.relationships.find((r: any) => r.type === 'cover_art');
    const coverUrl = coverRel?.attributes?.fileName
      ? `${UPLOADS_BASE_URL}/covers/${data.id}/${coverRel.attributes.fileName}`
      : null;

    const descriptions = data.attributes.description || {};
    const description = descriptions['pt-br'] || descriptions['pt'] || descriptions['en'] || Object.values(descriptions)[0] || "";

    return {
      id: data.id,
      title,
      description,
      status: data.attributes.status,
      contentRating: data.attributes.contentRating,
      coverUrl,
      tags: data.attributes.tags.map((t: any) => t.attributes.name.en),
      availableLanguages: data.attributes.availableTranslatedLanguages || []
    };
  }

  // Função auxiliar para resolver o path no Proxy da Vercel
  private getPath(endpoint: string): string {
    return isProd ? '' : endpoint;
  }

  async getPopularMangas(limit: number = 10): Promise<Manga[]> {
    const results = await this.searchWithTotal({
      limit,
      order: { followedCount: 'desc' },
      contentRating: ['safe', 'suggestive']
    });
    return results.data;
  }

  async getLatestMangas(limit: number = 10): Promise<Manga[]> {
    const results = await this.searchWithTotal({
      limit,
      order: { latestUploadedChapter: 'desc' },
      contentRating: ['safe', 'suggestive']
    });
    return results.data;
  }

  async getTopRatedMangas(limit: number = 10): Promise<Manga[]> {
    const results = await this.searchWithTotal({
      limit,
      order: { rating: 'desc' },
      contentRating: ['safe', 'suggestive']
    });
    return results.data;
  }

  async searchMangas(params: SearchParams): Promise<Manga[]> {
    const results = await this.searchWithTotal(params);
    return results.data;
  }

  async searchWithTotal(params: SearchParams): Promise<{ data: Manga[], total: number }> {
    const apiParams: any = {
      limit: params.limit || 20,
      offset: params.offset || 0,
      'includes[]': ['cover_art'],
      'contentRating[]': params.contentRating || ['safe', 'suggestive', 'erotica'],
      'availableTranslatedLanguage[]': ['pt-br', 'pt']
    };

    if (isProd) apiParams.path = 'manga'; // Direciona para o endpoint correto no proxy

    if (params.query) apiParams.title = params.query;
    if (params.includedTags) apiParams['includedTags[]'] = params.includedTags;
    if (params.excludedTags) apiParams['excludedTags[]'] = params.excludedTags;
    if (params.status) apiParams['status[]'] = params.status;

    if (params.order) {
      Object.entries(params.order).forEach(([key, val]) => {
        apiParams[`order[${key}]`] = val;
      });
    }

    const response = await client.get(this.getPath('/manga'), { params: apiParams });
    return {
      data: response.data.data.map((m: any) => this.mapToManga(m)),
      total: response.data.total
    };
  }

  async getMangaById(id: string): Promise<Manga | null> {
    try {
      const apiParams: any = {};
      if (isProd) apiParams.path = `manga/${id}`;
      apiParams['includes[]'] = ['cover_art', 'author', 'artist'];

      const response = await client.get(this.getPath(`/manga/${id}`), {
        params: apiParams
      });
      return this.mapToManga(response.data.data);
    } catch (error) {
      return null;
    }
  }

  async getTags(): Promise<{ id: string; name: string }[] > {
    const apiParams: any = {};
    if (isProd) apiParams.path = 'manga/tag';

    const response = await client.get(this.getPath('/manga/tag'), { params: apiParams });
    return response.data.data.map((tag: any) => ({
      id: tag.id,
      name: tag.attributes.name.en
    }));
  }
}
