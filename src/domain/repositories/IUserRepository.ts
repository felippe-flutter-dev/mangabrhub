export interface MangaList {
  id?: string;
  name: string;
  items: string[];
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface IUserRepository {
  getLists(): Promise<MangaList[]>;
  saveList(list: MangaList): Promise<MangaList>;
  deleteList(id: string): Promise<void>;
}
