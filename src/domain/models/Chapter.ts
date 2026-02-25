export interface Chapter {
  id: string;
  volume: string;
  chapter: string;
  title: string;
  translatedLanguage: string;
  publishAt: string;
  pages: number;
  scanlationGroup?: string;
}
