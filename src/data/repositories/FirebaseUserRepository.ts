import { db, auth } from "../../app/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { IUserRepository, MangaList } from "../../domain/repositories/IUserRepository";

export class FirebaseUserRepository implements IUserRepository {
  async getLists(): Promise<MangaList[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const listsRef = collection(db, "lists");
      const q = query(listsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MangaList));
    } catch (error) {
      console.error("FirebaseUserRepository: Error fetching lists", error);
      return [];
    }
  }

  async saveList(list: MangaList): Promise<MangaList> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      if (list.id) {
        const docRef = doc(db, "lists", list.id);
        await updateDoc(docRef, {
          name: list.name,
          items: list.items,
          updatedAt: serverTimestamp()
        });
        return list;
      } else {
        const docRef = await addDoc(collection(db, "lists"), {
          name: list.name,
          items: list.items,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        return { ...list, id: docRef.id, userId: user.uid };
      }
    } catch (error) {
      console.error("FirebaseUserRepository: Error saving list", error);
      throw error;
    }
  }

  async deleteList(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "lists", id));
    } catch (error) {
      console.error("FirebaseUserRepository: Error deleting list", error);
      throw error;
    }
  }
}
