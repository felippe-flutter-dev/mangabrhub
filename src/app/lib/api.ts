import { auth, db } from './firebase';
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

export const getComments = async (type: 'manga' | 'chapter', id: string) => {
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
  })).sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);
};

export const postComment = async (type: 'manga' | 'chapter', targetId: string, content: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

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
};

export const getLists = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const listsRef = collection(db, "lists");
  const q = query(listsRef, where("userId", "==", user.uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const saveList = async (list: { id?: string, name: string, items: string[] }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  if (list.id) {
    const docRef = doc(db, "lists", list.id);
    await updateDoc(docRef, {
      name: list.name,
      items: list.items,
      updatedAt: serverTimestamp()
    });
    return { ...list };
  } else {
    const docRef = await addDoc(collection(db, "lists"), {
      name: list.name,
      items: list.items,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...list };
  }
};

export const deleteList = async (id: string) => {
  await deleteDoc(doc(db, "lists", id));
  return { success: true };
};
