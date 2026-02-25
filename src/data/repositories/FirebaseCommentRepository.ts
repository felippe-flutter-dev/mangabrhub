import { db, auth } from "../../app/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";
import { ICommentRepository, Comment } from "../../domain/repositories/ICommentRepository";

export class FirebaseCommentRepository implements ICommentRepository {
  async getComments(type: 'manga' | 'chapter', id: string): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, "comments");
      const q = query(
        commentsRef,
        where("type", "==", type),
        where("targetId", "==", id)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment)).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    } catch (error) {
      console.error("FirebaseCommentRepository: Error fetching comments", error);
      return [];
    }
  }

  async postComment(type: 'manga' | 'chapter', targetId: string, content: string): Promise<{ id: string }> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
      const docRef = await addDoc(collection(db, "comments"), {
        type,
        targetId,
        content,
        userId: user.uid,
        userName: user.displayName || "Usuário",
        userPhoto: user.photoURL,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id };
    } catch (error) {
      console.error("FirebaseCommentRepository: Error posting comment", error);
      throw error;
    }
  }
}
