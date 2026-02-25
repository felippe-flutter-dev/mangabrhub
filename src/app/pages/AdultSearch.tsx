import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { auth, onAuthStateChanged } from "../lib/firebase";
import { userRepository } from "../di";
import { Loader2, Lock, Flame, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { MangaCard } from "../components/MangaCard";
import { Input } from "../components/ui/input";
import { useSearchViewModel } from "../../presentation/viewmodels/SearchViewModel";

export default function AdultSearch() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isSupporter, setIsSupporter] = useState(false);

  // Inicializa o SearchViewModel com o filtro pornográfico forçado
  const {
    results,
    loading,
    error,
    query,
    setQuery,
    handleSearch
  } = useSearchViewModel("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const profile = await userRepository.getUserProfile(user.uid);
      if (profile?.role === "supporter" || profile?.role === "admin") {
        setIsSupporter(true);
        setChecking(false);
      } else {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSupporter) {
    return (
      <div className="container max-w-2xl py-20 px-4 text-center space-y-6">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10">
          <Lock className="h-10 w-10 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Conteúdo Restrito</h1>
        <p className="text-muted-foreground">
          O **Espaço Adulto** é reservado exclusivamente para apoiadores do projeto.
          Sua contribuição ajuda a manter nossos servidores e o proxy de alta velocidade.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/supporter">Quero ser Apoiador ☕</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="rounded-full">
            <Link to="/">Voltar para Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500 fill-current" /> Espaço Adulto
          </h1>
          <p className="text-muted-foreground">Exploração de conteúdo adulto e hentais.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar no acervo adulto..."
            className="w-full md:w-64"
            value={query}
            id="adult-search-input"
            name="adult-search"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
          />
          <Button onClick={() => handleSearch(1)}>Buscar</Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-destructive">
          <AlertCircle className="h-10 w-10 mb-2" />
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          Nenhum mangá encontrado no acervo adulto.
        </div>
      )}
    </div>
  );
}
