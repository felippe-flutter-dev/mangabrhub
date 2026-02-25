import axios from 'axios';

const API_BASE_URL = 'https://api.mangadex.org';
const UPLOADS_BASE_URL = 'https://uploads.mangadex.org';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface Manga {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Record<string, string>[];
    description: Record<string, string>;
    isLocked: boolean;
    links: Record<string, string>;
    originalLanguage: string;
    lastVolume: string;
    lastChapter: string;
    publicationDemographic: string;
    status: string;
    year: number;
    contentRating: string;
    tags: Tag[];
    state: string;
    chapterNumbersResetOnNewVolume: boolean;
    createdAt: string;
    updatedAt: string;
    version: number;
    availableTranslatedLanguages: string[];
    latestUploadedChapter: string;
  };
  relationships: Relationship[];
}

export interface Tag {
  id: string;
  type: 'tag';
  attributes: {
    name: Record<string, string>;
    description: Record<string, string>;
    group: string;
    version: number;
  };
}

export interface Relationship {
  id: string;
  type: string;
  attributes?: any;
}

export interface Chapter {
  id: string;
  type: 'chapter';
  attributes: {
    volume: string;
    chapter: string;
    title: string;
    translatedLanguage: string;
    externalUrl: string;
    publishAt: string;
    readableAt: string;
    createdAt: string;
    updatedAt: string;
    pages: number;
    version: number;
  };
  relationships: Relationship[];
}

export const getTags = async () => {
  const response = await client.get('/manga/tag');
  return response.data.data as Tag[];
};

export const searchManga = async (params: any) => {
  const response = await client.get('/manga', { params });
  return response.data;
};

export const getManga = async (id: string) => {
  const response = await client.get(`/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`);
  return response.data.data as Manga;
};

export const getMangaFeed = async (id: string, params: any) => {
  // Always include translatedLanguage=pt-br unless specified otherwise, but API expects array
  const defaultParams = {
    limit: 100,
    order: { chapter: 'desc' },
    includes: ['scanlation_group', 'user'],
    ...params,
  };
  const response = await client.get(`/manga/${id}/feed`, { params: defaultParams });
  return response.data;
};

export const getChapter = async (id: string) => {
  const response = await client.get(`/chapter/${id}`);
  return response.data.data as Chapter;
};

export const getChapterPages = async (chapterId: string) => {
  const response = await client.get(`/at-home/server/${chapterId}`);
  const { baseUrl, chapter } = response.data;
  return {
    baseUrl,
    hash: chapter.hash,
    data: chapter.data,
    dataSaver: chapter.dataSaver,
  };
};

export const getMangaStatistics = async (mangaIds: string[]) => {
  if (mangaIds.length === 0) return {};
  const params = new URLSearchParams();
  mangaIds.forEach((id) => params.append('manga[]', id));
  const response = await client.get('/statistics/manga', { params });
  return response.data.statistics;
};

export const getCoverUrl = (manga: Manga) => {
  const coverRel = manga.relationships.find((r) => r.type === 'cover_art');
  if (!coverRel?.attributes?.fileName) return null;
  return `${UPLOADS_BASE_URL}/covers/${manga.id}/${coverRel.attributes.fileName}`;
};

export const constructPageUrl = (baseUrl: string, hash: string, fileName: string, quality: 'data' | 'data-saver' = 'data') => {
  return `${baseUrl}/${quality}/${hash}/${fileName}`;
};
