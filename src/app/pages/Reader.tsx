import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { CommentSection } from "../components/CommentSection";
import { useReaderViewModel } from "../../presentation/viewmodels/ReaderViewModel";

export default function Reader() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const lastPageRef = useRef<HTMLImageElement>(null);
  const [lastPageLoaded, setLastPageLoaded] = useState(false);

  const {
    chapter,
    manga,
    pages,
    loading,
    error,
    mode,
    setMode,
    currentPage,
    setCurrentPage,
    nextChapterId,
    prevChapterId,
    constructPageUrl,
    markAsRead,
    reload
  } = useReaderViewModel(chapterId);

  // Função para voltar com segurança
  const handleBack = useCallback(() => {
    if (manga?.id) {
      navigate(`/manga/${manga.id}`);
    } else {
      // Fallback: Se o manga ID não estiver disponível, usamos o histórico
      navigate(-1);
    }
  }, [manga?.id, navigate]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else if (prevChapterId) {
      navigate(`/read/${prevChapterId}`);
    }
  }, [currentPage, prevChapterId, navigate, setCurrentPage]);

  const goNext = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(p => p + 1);
    } else if (nextChapterId) {
      markAsRead();
      navigate(`/read/${nextChapterId}`);
    }
  }, [currentPage, pages.length, nextChapterId, navigate, markAsRead, setCurrentPage]);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'scroll') return;
    const width = e.currentTarget.clientWidth;
    const x = e.nativeEvent.offsetX;
    if (x < width / 2) goPrev();
    else goNext();
  };

  // Reset do estado ao mudar de capítulo
  useEffect(() => {
    setLastPageLoaded(false);
  }, [chapterId]);

  // Lógica de Observação para marcar como lido (Modo Cascata)
  useEffect(() => {
    // Só ativa o sensor se: modo cascata, as páginas carregaram e a ÚLTIMA imagem já foi carregada no DOM
    if (mode !== 'scroll' || !lastPageRef.current || !lastPageLoaded || pages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          markAsRead();
        }
      },
      {
        threshold: 0.5,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    observer.observe(lastPageRef.current);
    return () => observer.disconnect();
  }, [mode, pages.length, markAsRead, lastPageLoaded]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'scroll') return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, goPrev, goNext]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando páginas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">{error}</h2>
        <Button onClick={reload}>Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0" id="back-button" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col truncate cursor-pointer" onClick={handleBack}>
             <span className="font-semibold text-sm truncate">{manga?.title || "Carregando..."}</span>
             <span className="text-xs text-muted-foreground truncate">
               Cap. {chapter?.chapter || "?"} {chapter?.title ? `- ${chapter.title}` : ""}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
           <Select value={mode} onValueChange={(v: any) => setMode(v)}>
             <SelectTrigger className="w-[110px] h-8 text-xs">
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="paged">Paginado</SelectItem>
               <SelectItem value="scroll">Cascata</SelectItem>
             </SelectContent>
           </Select>
        </div>
      </header>

      <main className="flex-1 relative bg-black/5 dark:bg-black/40 overflow-y-auto">
         {mode === 'paged' ? (
           <div
             className="h-full flex flex-col items-center justify-center cursor-pointer p-2 md:p-4"
             onClick={handlePageClick}
           >
             <img
               src={constructPageUrl(pages[currentPage])}
               alt={`Página ${currentPage + 1}`}
               className="max-h-full max-w-full object-contain shadow-2xl select-none"
               draggable={false}
             />
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
               Página {currentPage + 1} / {pages.length}
             </div>
           </div>
         ) : (
           <div className="max-w-3xl mx-auto space-y-1 pb-10">
             {pages.map((page, index) => {
               const isLast = index === pages.length - 1;
               return (
                 <img
                   key={page}
                   ref={isLast ? lastPageRef : null}
                   src={constructPageUrl(page)}
                   alt={`Página ${index + 1}`}
                   className="w-full h-auto shadow-sm"
                   loading={index < 3 ? "eager" : "lazy"}
                   onLoad={() => {
                     if (isLast) {
                       setLastPageLoaded(true);
                     }
                   }}
                 />
               );
             })}

             <div className="p-12 space-y-8 max-w-lg mx-auto">
               {nextChapterId ? (
                  <Button size="lg" className="w-full h-16 text-lg rounded-xl" onClick={() => {
                    markAsRead();
                    navigate(`/read/${nextChapterId}`);
                  }}>
                    Próximo Capítulo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
               ) : (
                  <div className="text-center p-6 bg-muted rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Fim dos capítulos em Português.</p>
                  </div>
               )}

               <div className="pt-8 border-t">
                  <h3 className="text-xl font-bold mb-6">Comentários</h3>
                  {chapterId && <CommentSection type="chapter" id={chapterId} />}
               </div>
             </div>
           </div>
         )}
      </main>
    </div>
  );
}
