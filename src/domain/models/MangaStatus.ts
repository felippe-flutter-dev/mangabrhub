export enum MangaStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
  CANCELLED = 'cancelled',
}

export const MangaStatusLabels: Record<MangaStatus, string> = {
  [MangaStatus.ONGOING]: 'Em andamento',
  [MangaStatus.COMPLETED]: 'Finalizado',
  [MangaStatus.HIATUS]: 'Hiato',
  [MangaStatus.CANCELLED]: 'Cancelado',
};
