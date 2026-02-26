import { Link } from "react-router";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "./ui/table";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, AlertCircle, ArrowUpDown, CheckCircle2, Bookmark } from "lucide-react";
import { useChapterListViewModel } from "../../presentation/viewmodels/ChapterListViewModel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Badge } from "./ui/badge";

interface ChapterListProps {
  mangaId: string;
}

export function ChapterList({ mangaId }: ChapterListProps) {
  const {
    groupedChapters,
    loading,
    error,
    sortOrder,
    toggleSortOrder,
    isRead,
    isCurrentlyReading,
    totalChapters
  } = useChapterListViewModel(mangaId);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">Erro ao carregar capítulos.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
        <span>{totalChapters} capítulos encontrados em Português</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSortOrder}
          className="h-8 text-xs gap-2"
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigos'}
        </Button>
      </div>

      <div className="space-y-2">
        {groupedChapters.map((group) => {
          const hasReadAny = group.versions.some(v => isRead(v.id));
          const isReadingAny = group.versions.some(v => isCurrentlyReading(v.id));

          return (
            <Accordion type="single" collapsible key={group.chapterNumber} className="w-full">
              <AccordionItem value={group.chapterNumber} className="border rounded-lg bg-card px-4">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                      {group.chapterNumber === "Oneshot" ? "1" : group.chapterNumber}
                    </div>
                    <div className="flex flex-col truncate min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {group.chapterNumber === "Oneshot" ? "Oneshot" : `Capítulo ${group.chapterNumber}`}
                        </span>
                        {isReadingAny && (
                          <Badge variant="default" className="bg-blue-600 hover:bg-blue-600 h-4 text-[10px] px-1 animate-pulse">
                            LENDO
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {group.versions[0].title || "Sem título"}
                      </span>
                    </div>
                    {hasReadAny && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto mr-2 shrink-0" />}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-0">
                  <div className="rounded-md border bg-muted/30 overflow-hidden mt-2">
                    <Table>
                      <TableHeader className="sr-only">
                        <TableRow>
                          <TableHead>Versão</TableHead>
                          <TableHead>Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.versions.map((version) => {
                          const read = isRead(version.id);
                          const reading = isCurrentlyReading(version.id);
                          return (
                            <TableRow key={version.id} className={read ? "opacity-60" : ""}>
                              <TableCell className="py-2 pl-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">{version.scanlationGroup || "Scan Desconhecida"}</span>
                                    {reading && <Bookmark className="h-3 w-3 text-blue-500 fill-current" />}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {version.publishAt ? formatDistanceToNow(new Date(version.publishAt), { addSuffix: true, locale: ptBR }) : "-"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2 pr-4">
                                <Button asChild size="sm" variant={reading ? "default" : (read ? "ghost" : "secondary")} className={`h-7 text-xs ${reading ? 'bg-blue-600' : ''}`}>
                                  {/* Entrada no capítulo com REPLACE para evitar empilhamento infinito no histórico */}
                                  <Link to={`/read/${version.id}`} replace>
                                    {reading ? "Continuar" : (read ? "Reler" : "Ler")}
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}
      </div>
      
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading && groupedChapters.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum capítulo encontrado.</p>
      )}
    </div>
  );
}
