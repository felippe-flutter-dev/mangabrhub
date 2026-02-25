import { useState, useEffect } from "react";
import { Manga } from "../../domain/models/Manga";
import { getLists, saveList } from "../../app/lib/api";
import { toast } from "sonner";
import { auth, onAuthStateChanged } from "../../app/lib/firebase";
import { mangaRepository } from "../../app/di";

export function useMangaDetailsViewModel(id: string | undefined) {
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    if (id) {
      fetchManga(id);
    }

    return () => unsubscribe();
  }, [id]);

  const fetchManga = async (mangaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mangaRepository.getMangaById(mangaId);
      if (data) {
        setManga(data);
      } else {
        setError("Mangá não encontrado.");
      }
    } catch (err) {
      console.error("Failed to fetch manga details", err);
      setError("Erro ao carregar detalhes do mangá.");
    } finally {
      setLoading(false);
    }
  };

  const loadUserLists = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para ver suas listas.");
      return;
    }
    try {
      const userLists = await getLists();
      setLists(userLists);
      if (userLists.length > 0 && !selectedList) {
        setSelectedList(userLists[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch lists", error);
    }
  };

  const addMangaToList = async () => {
    if (!user) {
      toast.error("Faça login para adicionar à lista.");
      return;
    }
    if (!selectedList || !manga) return;
    try {
      const list = lists.find(l => l.id === selectedList);
      if (!list) return;

      if (list.items && list.items.includes(manga.id)) {
        toast.info("Este mangá já está na lista.");
        return;
      }

      await saveList({
        ...list,
        items: [...(list.items || []), manga.id]
      });
      toast.success("Adicionado à lista com sucesso!");
    } catch (error) {
      console.error("Failed to add to list", error);
      toast.error("Erro ao adicionar à lista.");
    }
  };

  return {
    manga,
    loading,
    user,
    lists,
    selectedList,
    setSelectedList,
    error,
    loadUserLists,
    addMangaToList
  };
}
