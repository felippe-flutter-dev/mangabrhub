import { MangaRepository } from "../data/repositories/MangaRepository";
import { ChapterRepository } from "../data/repositories/ChapterRepository";
import { FirebaseCommentRepository } from "../data/repositories/FirebaseCommentRepository";
import { FirebaseUserRepository } from "../data/repositories/FirebaseUserRepository";
import { LocalStorageService } from "../data/services/LocalStorageService";

// Repository instances
export const mangaRepository = new MangaRepository();
export const chapterRepository = new ChapterRepository();
export const commentRepository = new FirebaseCommentRepository();
export const userRepository = new FirebaseUserRepository();

// Service instances
export const storageService = new LocalStorageService();
