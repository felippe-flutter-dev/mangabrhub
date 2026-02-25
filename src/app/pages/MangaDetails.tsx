import { useParams, Link } from "react-router";
import { ChapterList } from "../components/ChapterList";
import { CommentSection } from "../components/CommentSection";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { Star, BookOpen, Plus, Share2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useMangaDetailsViewModel } from "../../presentation/viewmodels/MangaDetailsViewModel";

export default function MangaDetails() {
  const { id } = useParams<{ id: string }>();
  const {
    manga,
    loading,
    user,
    lists,
    selectedList,
    setSelectedList,
    error,
    loadUserLists,
    addMangaToList
  } = useMangaDetailsViewModel(id);

  if (loading) {
    return (
      <div className="container px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-[300px] h-[450px] rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      'ongoing': 'Em andamento',
      'completed': 'Finalizado',
      'hiatus': 'Hiato',
      'cancelled': 'Cancelado'
    };
    return map[status] || status;
  };

  if (error || !manga) {
    return (
      <div className="container flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">{error || "Mangá não encontrado"}</h2>
        <Button asChild>
          <Link to="/search">Voltar para busca</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Cover Image */}
        <div className="flex-shrink-0 w-full md:w-[300px]">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg bg-muted">
            {manga.coverUrl ? (
              <img src={manga.coverUrl} alt={manga.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Sem Capa
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={loadUserLists}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar à Lista
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar à Lista de Leitura</DialogTitle>
                  <DialogDescription>Escolha uma de suas listas personalizadas para salvar este título.</DialogDescription>
                </DialogHeader>
                {user ? (
                  <div className="space-y-4 py-4">
                    {lists.length > 0 ? (
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Selecione a lista</label>
                            <Select value={selectedList} onValueChange={setSelectedList}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma lista" />
                              </SelectTrigger>
                              <SelectContent>
                                {lists.map(list => (
                                  <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                         </div>
                         <Button onClick={addMangaToList} className="w-full">Salvar</Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <p>Você ainda não tem listas de leitura.</p>
                        <Button asChild variant="outline">
                           <Link to="/profile">Criar Lista no Perfil</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p>Faça login para gerenciar suas listas.</p>
                    <Button asChild className="mt-4 w-full">
                      <Link to="/login">Entrar</Link>
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="w-full">
              <Share2 className="mr-2 h-4 w-4" /> Compartilhar
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 leading-tight">{manga.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center capitalize">
                <BookOpen className="mr-1 h-4 w-4" /> {translateStatus(manga.status)}
              </span>
              {manga.rating && (
                <span className="flex items-center text-yellow-500 font-medium">
                  <Star className="mr-1 h-4 w-4 fill-current" /> {manga.rating.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {manga.tags.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Sinopse</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {manga.description || "Sem descrição disponível."}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Chapters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-6">Capítulos</h2>
            {id && <ChapterList mangaId={id} />}
          </section>
        </div>

        {/* Comments Sidebar */}
        <div className="space-y-8">
          <section>
            {id && <CommentSection type="manga" id={id} />}
          </section>
        </div>
      </div>
    </div>
  );
}
