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
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { IUserRepository, MangaList } from "../../domain/repositories/IUserRepository";
import { UserProfile } from "../../domain/models/User";

export class FirebaseUserRepository implements IUserRepository {
  async getLists(): Promise<MangaList[]> {
    const user = auth.currentUser;
    if (!user) return [];

    const listsRef = collection(db, "lists");
    const q = query(listsRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MangaList));
  }

  async saveList(list: MangaList): Promise<MangaList> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

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
  }

  async deleteList(id: string): Promise<void> {
    await deleteDoc(doc(db, "lists", id));
  }

  // --- Profile Management ---

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile;
    }
    return null;
  }

  async createUserProfile(profile: UserProfile): Promise<void> {
    const docRef = doc(db, "users", profile.uid);
    await setDoc(docRef, {
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
      role: profile.role || 'user',
      createdAt: serverTimestamp()
    });
  }

  async updateUserRole(uid: string, role: 'user' | 'supporter' | 'admin'): Promise<void> {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, { role });
  }
}
