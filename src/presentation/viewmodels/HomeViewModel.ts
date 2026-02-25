import { useState, useEffect, useCallback } from "react";
import { Manga } from "../../domain/models/Manga";
import { GetHomeMangasUseCase } from "../../domain/usecases/GetHomeMangasUseCase";
import { auth, onAuthStateChanged } from "../../app/lib/firebase";
import { mangaRepository } from "../../app/di";

export function useHomeViewModel() {
  const [popular, setPopular] = useState<Manga[]>([]);
  const [latest, setLatest] = useState<Manga[]>([]);
  const [topRated, setTopRated] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const fetchHomeData = useCallback(async () => {
    const getHomeMangasUseCase = new GetHomeMangasUseCase(mangaRepository);
    setLoading(true);
    setError(null);
    try {
      const data = await getHomeMangasUseCase.execute();
      setPopular(data.popular);
      setLatest(data.latest);
      setTopRated(data.topRated);
    } catch (err) {
      setError("Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [fetchHomeData]);

  return {
    popular,
    latest,
    topRated,
    loading,
    error,
    user,
    refresh: fetchHomeData
  };
}
