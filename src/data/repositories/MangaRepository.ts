import { IMangaRepository, SearchParams } from "../../domain/repositories/IMangaRepository";
import { Manga } from "../../domain/models/Manga";
import axios from 'axios';

const API_BASE_URL = 'https://api.mangadex.org';
const UPLOADS_BASE_URL = 'https://uploads.mangadex.org';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      includes: ['cover_art'],
      contentRating: params.contentRating || ['safe', 'suggestive', 'erotica'],
      availableTranslatedLanguage: ['pt-br', 'pt']
    };

    if (params.query) apiParams.title = params.query;
    if (params.includedTags) apiParams.includedTags = params.includedTags;
    if (params.excludedTags) apiParams.excludedTags = params.excludedTags;
    if (params.status) apiParams.status = params.status;
    if (params.order) apiParams.order = params.order;

    const response = await client.get('/manga', {
      params: apiParams,
      headers: {} // Garante que nenhum header extra seja enviado
    });
    return {
      data: response.data.data.map((m: any) => this.mapToManga(m)),
      total: response.data.total
    };
  }

  async getMangaById(id: string): Promise<Manga | null> {
    try {
      const response = await client.get(`/manga/${id}`, {
        params: {
          includes: ['cover_art', 'author', 'artist']
        },
        headers: {} // Garante que nenhum header extra seja enviado
      });
      return this.mapToManga(response.data.data);
    } catch (error) {
      return null;
    }
  }

  async getTags(): Promise<{ id: string; name: string }[] > {
    const response = await client.get('/manga/tag', {
      headers: {} // Garante que nenhum header extra seja enviado
    });
    return response.data.data.map((tag: any) => ({
      id: tag.id,
      name: tag.attributes.name.en
    }));
  }
}
