export enum ContentRating {
  SAFE = 'safe',
  SUGGESTIVE = 'suggestive',
  EROTICA = 'erotica',
  PORNOGRAPHIC = 'pornographic',
}

export const ContentRatingLabels: Record<ContentRating, string> = {
  [ContentRating.SAFE]: 'Livre',
  [ContentRating.SUGGESTIVE]: 'Sugestivo',
  [ContentRating.EROTICA]: 'Erótico',
  [ContentRating.PORNOGRAPHIC]: 'Pornográfico',
};
