import { useEffect, useCallback } from "react";
import { TagSelector } from "../components/TagSelector";
import { MangaCard } from "../components/MangaCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Search as SearchIcon, Filter, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { ScrollArea } from "../components/ui/scroll-area";
import { useSearchParams } from "react-router";
import { Badge } from "../components/ui/badge";
import { useSearchViewModel } from "../../presentation/viewmodels/SearchViewModel";
import { MangaStatus, MangaStatusLabels, ContentRating, ContentRatingLabels } from "../../domain/models/Enums";

export default function Search() {
  const [searchParams] = useSearchParams();
  const {
    tags,
    query,
    setQuery,
    tagSelection,
    toggleTag,
    sortBy,
    setSortBy,
    results,
    loading,
    error,
    contentRating,
    setContentRating,
    status,
    setStatus,
    handleSearch,
    clearFilters,
    currentPage,
    totalPages,
    totalResults
  } = useSearchViewModel(searchParams.get("q") || "");

  useEffect(() => {
    handleSearch(1);
  }, [handleSearch]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      handleSearch(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [handleSearch, totalPages]);

  const translateStatus = (s: string) => {
    return MangaStatusLabels[s as MangaStatus] || s;
  };

  const translateContentRating = (r: string) => {
    return ContentRatingLabels[r as ContentRating] || r;
  };

  return (
    <div className="container px-4 py-6 md:py-8 flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)]">
      {/* Mobile Filter Sheet */}
      <div className="md:hidden flex items-center gap-2 mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros Avançados</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ordenar por</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevância</SelectItem>
                        <SelectItem value="latest">Lançamentos</SelectItem>
                        <SelectItem value="oldest">Antigos</SelectItem>
                        <SelectItem value="title">Título (A-Z)</SelectItem>
                        <SelectItem value="rating">Avaliação</SelectItem>
                        <SelectItem value="followedCount">Mais Seguidores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Classificação de Conteúdo</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(ContentRating).map(r => (
                        <Badge 
                          key={r}
                          variant={contentRating.includes(r) ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                          onClick={() => {
                            if (contentRating.includes(r)) setContentRating(contentRating.filter(x => x !== r));
                            else setContentRating([...contentRating, r]);
                          }}
                        >
                          {translateContentRating(r)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(MangaStatus).map(s => (
                        <Badge 
                          key={s}
                          variant={status.includes(s) ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                          onClick={() => {
                            if (status.includes(s)) setStatus(status.filter(x => x !== s));
                            else setStatus([...status, s]);
                          }}
                        >
                          {translateStatus(s)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Tags</label>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs">Limpar Tags</Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <TagSelector tags={tags as any} selection={tagSelection} onToggle={toggleTag} />
                    </ScrollArea>
                  </div>
               </div>
               <Button onClick={() => handleSearch(1)} className="w-full">Aplicar Filtros</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 border-r pr-6 overflow-y-auto h-full">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filtros</h2>
            {(Object.keys(tagSelection).length > 0 || query || status.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                <X className="mr-1 h-3 w-3" /> Limpar Tudo
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ordenar por</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevância</SelectItem>
                <SelectItem value="latest">Lançamentos</SelectItem>
                <SelectItem value="oldest">Antigos</SelectItem>
                <SelectItem value="title">Título (A-Z)</SelectItem>
                <SelectItem value="rating">Avaliação</SelectItem>
                <SelectItem value="followedCount">Mais Seguidores</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Classificação de Conteúdo</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ContentRating).filter(r => r !== ContentRating.PORNOGRAPHIC).map(r => (
                <Badge 
                  key={r}
                  variant={contentRating.includes(r) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (contentRating.includes(r)) setContentRating(contentRating.filter(x => x !== r));
                    else setContentRating([...contentRating, r]);
                  }}
                >
                  {translateContentRating(r)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(MangaStatus).map(s => (
                <Badge 
                  key={s}
                  variant={status.includes(s) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (status.includes(s)) setStatus(status.filter(x => x !== s));
                    else setStatus([...status, s]);
                  }}
                >
                  {translateStatus(s)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <ScrollArea className="h-[400px] pr-4">
              <TagSelector tags={tags as any} selection={tagSelection} onToggle={toggleTag} />
            </ScrollArea>
          </div>
          
          <Button onClick={() => handleSearch(1)} className="w-full sticky bottom-0 z-10">Aplicar Filtros</Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar títulos de mangá..."
              className="pl-8 w-full"
              value={query}
              id="search-input"
              name="search"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            />
          </div>
          <Button onClick={() => handleSearch(1)}>Buscar</Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-2">
          {error && (
            <div className="flex flex-col items-center justify-center py-10 text-destructive">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p>{error}</p>
              <Button variant="link" onClick={() => handleSearch(currentPage)}>Tentar novamente</Button>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              Mostrando {results.length} de {totalResults} resultados
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.map((manga) => (
                  <MangaCard
                    key={manga.id}
                    manga={manga}
                  />
                ))}
              </div>

              {/* Pagination UI */}
              <div className="flex items-center justify-center gap-2 py-8 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium px-4">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center flex-col text-muted-foreground">
              <p>Nenhum resultado encontrado.</p>
              <p className="text-sm">Tente ajustar seus filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
