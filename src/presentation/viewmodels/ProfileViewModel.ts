import { useState, useEffect } from "react";
import { auth, onAuthStateChanged, signOut } from "../../app/lib/firebase";
import { getLists, saveList, deleteList } from "../../app/lib/api";
import { Manga } from "../../domain/models/Manga";
import { MangaRepository } from "../../data/repositories/MangaRepository";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export function useProfileViewModel() {
  const [user, setUser] = useState<any>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [listMangas, setListMangas] = useState<Record<string, Manga[]>>({});
  const navigate = useNavigate();
  const mangaRepository = new MangaRepository();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchLists();
      } else {
        setUser(null);
        setLoading(false);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchLists = async () => {
    try {
      const data = await getLists();
      setLists(data);
      data.forEach((list: any) => {
        if (list.items && list.items.length > 0) {
          fetchListMangas(list.id, list.items);
        }
      });
    } catch (error) {
      console.error("Failed to fetch lists", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListMangas = async (listId: string, mangaIds: string[]) => {
    if (mangaIds.length === 0) return;
    try {
      const allMangas = await Promise.all(
        mangaIds.map(id => mangaRepository.getMangaById(id))
      );
      const validMangas = allMangas.filter((m): m is Manga => m !== null);
      setListMangas(prev => ({ ...prev, [listId]: validMangas }));
    } catch (error) {
      console.error("Failed to fetch mangas for list", listId, error);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const newList = await saveList({ name: newListName, items: [] });
      setLists(prev => [...prev, newList]);
      setNewListName("");
      toast.success("Lista criada!");
    } catch (error) {
      toast.error("Erro ao criar lista.");
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList(id);
      setLists(prev => prev.filter(l => l.id !== id));
      toast.success("Lista excluída.");
    } catch (error) {
      toast.error("Erro ao excluir lista.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      toast.error("Erro ao sair.");
    }
  };

  return {
    user,
    lists,
    loading,
    newListName,
    setNewListName,
    listMangas,
    handleCreateList,
    handleDeleteList,
    handleLogout
  };
}
