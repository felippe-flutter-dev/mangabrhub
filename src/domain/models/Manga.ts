export interface Manga {
  id: string;
  title: string;
  description: string;
  status: string;
  contentRating: string;
  coverUrl: string | null;
  rating?: number;
  tags: string[];
  availableLanguages: string[];
}
