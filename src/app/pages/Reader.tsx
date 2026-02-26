import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { CommentSection } from "../components/CommentSection";
import { useReaderViewModel } from "../../presentation/viewmodels/ReaderViewModel";
import { cn } from "../components/ui/utils";
import { auth, onAuthStateChanged } from "../lib/firebase";

export default function Reader() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [userUid, setUserUid] = useState<string>('guest');

  const mainRef = useRef<HTMLElement>(null);
  const lastScrollYRef = useRef(0);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReadyToObserve, setIsReadyToObserve] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserUid(user?.uid || 'guest');
    });
    return () => unsubscribe();
  }, []);

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
  } = useReaderViewModel(chapterId, userUid);

  useEffect(() => {
    if (pages.length > 0 && loadedCount >= pages.length && !isReadyToObserve) {
      setIsReadyToObserve(true);
    }
  }, [loadedCount, pages.length, isReadyToObserve]);

  // GATILHO DE LEITURA UNIFICADO E INTELIGENTE
  useEffect(() => {
    if (pages.length === 0 || !bottomSentinelRef.current || !isReadyToObserve) return;

    // No modo PAGINADO, o sensor só deve agir se estivermos na última página
    if (mode === 'paged' && currentPage !== pages.length - 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          markAsRead();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px' // Reduzido para evitar disparos acidentais no topo
      }
    );

    observer.observe(bottomSentinelRef.current);
    return () => observer.disconnect();
  }, [mode, pages.length, markAsRead, chapterId, currentPage, isReadyToObserve]);

  const handleScroll = useCallback(() => {
    if (!mainRef.current || mode === 'paged') return;
    const currentScrollY = mainRef.current.scrollTop;
    const delta = currentScrollY - lastScrollYRef.current;
    if (currentScrollY < 100) setShowHeader(true);
    else if (delta > 15) setShowHeader(false);
    else if (delta < -5) setShowHeader(true);
    lastScrollYRef.current = currentScrollY;
  }, [mode]);

  useEffect(() => {
    setIsImageLoading(true);
    setLoadedCount(0);
    setIsReadyToObserve(false);
  }, [chapterId, currentPage]);

  const handleBack = useCallback(() => {
    if (manga?.id) {
      navigate(`/manga/${manga.id}`, { replace: true });
    } else {
      navigate(-1);
    }
  }, [manga?.id, navigate]);

  const goPrev = useCallback(() => {
    if (mode === 'paged' && currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else if (prevChapterId) {
      navigate(`/read/${prevChapterId}`, { replace: true });
    }
  }, [mode, currentPage, prevChapterId, navigate, setCurrentPage]);

  const goNext = useCallback(() => {
    if (mode === 'paged' && currentPage < pages.length - 1) {
      setCurrentPage(p => p + 1);
    }
    else if (nextChapterId) {
      markAsRead();
      navigate(`/read/${nextChapterId}`, { replace: true });
    }
  }, [mode, currentPage, pages.length, nextChapterId, navigate, markAsRead, setCurrentPage]);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'scroll') return;
    const width = e.currentTarget.clientWidth;
    const x = e.nativeEvent.offsetX;
    if (x < width * 0.3) {
      goPrev();
    } else {
      goNext();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'scroll') return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, goPrev, goNext]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (error) return <div className="h-screen flex flex-col items-center justify-center space-y-6 text-center px-4"><AlertCircle className="h-16 w-16 text-destructive/50" /><Button onClick={reload} size="lg" className="rounded-full">Tentar Novamente</Button></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden relative">
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur px-4 h-14 flex items-center justify-between shadow-sm transition-all duration-200 ease-in-out",
        (showHeader || mode === 'paged') ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}>
        <div className="flex items-center gap-3 overflow-hidden text-left">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col truncate cursor-pointer" onClick={handleBack}>
             <span className="font-semibold text-sm truncate">{manga?.title}</span>
             <span className="text-xs text-muted-foreground truncate">Cap. {chapter?.chapter}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <Select value={mode} onValueChange={(v: any) => setMode(v)}>
             <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
             <SelectContent><SelectItem value="paged">Paginado</SelectItem><SelectItem value="scroll">Cascata</SelectItem></SelectContent>
           </Select>
        </div>
      </header>

      <main ref={mainRef} onScroll={handleScroll} className="flex-1 relative bg-black/5 dark:bg-black/40 overflow-y-auto pt-14 scroll-smooth">
         {/* MODO PAGINADO */}
         <div className={cn("h-full w-full", mode !== 'paged' && "hidden")}>
           <div className="h-full flex flex-col items-center justify-center cursor-pointer p-2 md:p-4 relative" onClick={handlePageClick}>
             {isImageLoading && <Loader2 className="absolute h-8 w-8 animate-spin text-primary" />}
             <img
               key={`paged-${pages[currentPage]}`}
               src={constructPageUrl(pages[currentPage] || "")}
               alt={`Página ${currentPage + 1}`}
               className={cn("max-h-full max-w-full object-contain shadow-2xl transition-opacity duration-300", isImageLoading ? "opacity-0" : "opacity-100")}
               onLoad={() => {
                 setIsImageLoading(false);
                 setLoadedCount(prev => prev + 1);
               }}
               referrerPolicy="no-referrer"
             />
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-2 rounded-full text-xs font-bold backdrop-blur-md">{currentPage + 1} / {pages.length}</div>
           </div>
         </div>

         {/* MODO CASCATA */}
         <div className={cn("max-w-3xl mx-auto space-y-1 pb-10 px-1", mode !== 'scroll' && "hidden")}>
           {pages.map((page, index) => (
             <img
               key={`scroll-${page}`}
               src={constructPageUrl(page)}
               alt={`Página ${index + 1}`}
               className="w-full h-auto shadow-md bg-muted min-h-[40vh]"
               onLoad={() => setLoadedCount(prev => prev + 1)}
               referrerPolicy="no-referrer"
             />
           ))}
         </div>

         {/* ÁREA DE RODAPÉ (Comum a ambos os modos, mas só aparece no fim) */}
         <div className={cn("p-8 space-y-8 max-w-lg mx-auto", (mode === 'paged' && currentPage !== pages.length - 1) && "hidden")}>
            <div className="flex flex-col gap-4">
              {nextChapterId && (
                <Button size="lg" className="w-full h-16 text-lg rounded-2xl shadow-lg" onClick={goNext}>
                  Próximo Capítulo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="lg" className="w-full h-14 rounded-2xl" onClick={handleBack}>
                Voltar para o Mangá
              </Button>
            </div>

            {/* SENTINEL: Detecta o fim real do conteúdo */}
            <div ref={bottomSentinelRef} className="h-32 w-full flex items-center justify-center border-t border-dashed mt-10">
               <div className="flex flex-col items-center gap-2 text-muted-foreground/40 font-bold uppercase tracking-widest text-[10px]">
                  <div className="h-1 w-12 bg-current rounded-full" />
                  <span>Fim do Capítulo</span>
               </div>
            </div>

            <div className="pt-12 border-t border-primary/10">{chapterId && <CommentSection type="chapter" id={chapterId} />}</div>
         </div>
      </main>
    </div>
  );
}
