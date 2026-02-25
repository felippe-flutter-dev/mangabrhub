import { Manga } from "../models/Manga";
import { IMangaRepository, SearchParams } from "../repositories/IMangaRepository";

export class SearchMangasUseCase {
  constructor(private mangaRepository: IMangaRepository) {}

  async execute(params: SearchParams): Promise<Manga[]> {
    return this.mangaRepository.searchMangas(params);
  }
}
