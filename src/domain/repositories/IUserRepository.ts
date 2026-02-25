import { MangaList } from "../models/Manga";
import { UserProfile } from "../models/User";

export interface IUserRepository {
  getLists(): Promise<MangaList[]>;
  saveList(list: MangaList): Promise<MangaList>;
  deleteList(id: string): Promise<void>;

  // Profile management
  getUserProfile(uid: string): Promise<UserProfile | null>;
  createUserProfile(profile: UserProfile): Promise<void>;
  updateUserRole(uid: string, role: 'user' | 'supporter' | 'admin'): Promise<void>;
}
