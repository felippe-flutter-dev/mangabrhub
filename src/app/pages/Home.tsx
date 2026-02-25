import { Link } from "react-router";
import { MangaCard } from "../components/MangaCard";
import { Button } from "../components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel";
import { Skeleton } from "../components/ui/skeleton";
import { ArrowRight, Flame, Clock, Star, AlertCircle } from "lucide-react";
import { useHomeViewModel } from "../../presentation/viewmodels/HomeViewModel";
import { Manga } from "../../domain/models/Manga";

export default function Home() {
  const { popular, latest, topRated, loading, error, user, refresh } = useHomeViewModel();

  if (error) {
    return (
      <div className="container flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Erro ao carregar</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={refresh}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 space-y-12 pb-20">
      <section className="text-center space-y-4 py-8 bg-muted/30 rounded-3xl">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          MangaBR Hub
        </h1>
        {user ? (
          <div className="space-y-4">
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Bem-vindo de volta, <span className="text-foreground font-semibold">{user.displayName || "leitor"}</span>!
              Continue explorando seus mangás favoritos ou confira as novidades abaixo.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/search">Explorar Mangás</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="rounded-full">
                <Link to="/profile">Minha Biblioteca</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Sua plataforma definitiva para ler mangás em Português.
              Explore milhares de títulos, crie listas e acompanhe lançamentos.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/search">Explorar Mangás</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/login">Criar Conta</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Seção Popular */}
      <MangaSection 
        title="Populares Agora" 
        icon={<Flame className="h-5 w-5 text-orange-500" />} 
        mangas={popular} 
        loading={loading}
        link="/search?sort=followedCount"
      />

      {/* Seção Recentes */}
      <MangaSection 
        title="Lançamentos Recentes" 
        icon={<Clock className="h-5 w-5 text-blue-500" />} 
        mangas={latest} 
        loading={loading}
        link="/search?sort=latest"
      />

      {/* Seção Melhores Avaliados */}
      <MangaSection 
        title="Melhor Avaliados" 
        icon={<Star className="h-5 w-5 text-yellow-500" />} 
        mangas={topRated} 
        loading={loading}
        link="/search?sort=rating"
      />
    </div>
  );
}

function MangaSection({ title, icon, mangas, loading, link }: { title: string, icon: React.ReactNode, mangas: Manga[], loading: boolean, link: string }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        </div>
        <Button variant="ghost" asChild className="text-sm">
          <Link to={link}>Ver tudo <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {mangas.map((manga) => (
              <CarouselItem key={manga.id} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                <div className="h-full">
                  <MangaCard manga={manga} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </div>
        </Carousel>
      )}
    </section>
  );
}
