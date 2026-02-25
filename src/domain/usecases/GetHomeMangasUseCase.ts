import { Manga } from "../models/Manga";
import { IMangaRepository } from "../repositories/IMangaRepository";

export class GetHomeMangasUseCase {
  constructor(private mangaRepository: IMangaRepository) {}

  async execute(): Promise<{ popular: Manga[], latest: Manga[], topRated: Manga[] }> {
    const [popular, latest, topRated] = await Promise.all([
      this.mangaRepository.getPopularMangas(10),
      this.mangaRepository.getLatestMangas(10),
      this.mangaRepository.getTopRatedMangas(10),
    ]);

    return { popular, latest, topRated };
  }
}
