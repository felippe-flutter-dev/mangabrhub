import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, RefreshCw, Settings2 } from "lucide-react";
import { CommentSection } from "../components/CommentSection";
import { useReaderViewModel } from "../../presentation/viewmodels/ReaderViewModel";
import { cn } from "../components/ui/utils";
import { auth, onAuthStateChanged } from "../lib/firebase";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../components/ui/dropdown-menu";

const isProd = import.meta.env.PROD;

// Componente de Imagem Isolado
function ReaderImage({
  src,
  dataSaverSrc,
  alt,
  className,
  onFullLoad,
  onGlobalRefresh
}: {
  src: string,
  dataSaverSrc: string,
  alt: string,
  className?: string,
  onFullLoad?: () => void,
  onGlobalRefresh?: () => void
}) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [usingDataSaver, setUsingDataSaver] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Reseta o estado apenas se a URL principal mudar de verdade
  useEffect(() => {
    setStatus('loading');
    setUsingDataSaver(false);
    setRetryCount(0);
  }, [src]);

  const handleError = () => {
    if (status === 'error') return;

    if (!usingDataSaver && dataSaverSrc) {
       console.log("[ReaderImage] Falha na original, tentando data-saver...");
       setUsingDataSaver(true);
       setStatus('loading');
    } else if (retryCount < 1) {
       console.log("[ReaderImage] Tentando re-render da página...");
       setRetryCount(prev => prev + 1);
       setStatus('loading');
    } else {
       console.error("[ReaderImage] Falha definitiva na página.");
       setStatus('error');
       // Só aciona o refresh global em produção se houver falhas críticas
       if (isProd) onGlobalRefresh?.();
    }
  };

  const finalSrc = usingDataSaver ? dataSaverSrc : src;

  return (
    <div className={cn("relative flex items-center justify-center min-h-[400px] w-full bg-muted/5", className)}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary/20" />
        </div>
      )}

      {status === 'error' ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <AlertCircle className="h-10 w-10 text-destructive/30" />
          <p className="text-xs font-medium">Não foi possível carregar esta página</p>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-6 rounded-full"
            onClick={() => {
              setRetryCount(0);
              setUsingDataSaver(false);
              setStatus('loading');
            }}
          >
            Tentar carregar de novo
          </Button>
        </div>
      ) : (
        <img
          src={finalSrc}
          alt={alt}
          className={cn(
            "w-full h-auto transition-all duration-500 block",
            status === 'success' ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          onLoad={() => {
            setStatus('success');
            onFullLoad?.();
          }}
          onError={handleError}
          // MangaDex odeia no-referrer. strict-origin é melhor para evitar 404 por "bot check"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      )}
    </div>
  );
}

export default function Reader() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [userUid, setUserUid] = useState<string>('guest');

  const mainRef = useRef<HTMLElement>(null);
  const lastScrollYRef = useRef(0);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const [showHeader, setShowHeader] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReadyToObserve, setIsReadyToObserve] = useState(false);
  const consecutiveErrors = useRef(0);
  const lastErrorTime = useRef(0);

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
    quality,
    setQuality,
    currentPage,
    setCurrentPage,
    nextChapterId,
    prevChapterId,
    constructPageUrl,
    refreshImageServer,
    markAsRead,
    reload
  } = useReaderViewModel(chapterId, userUid);

  useEffect(() => {
    if (pages.length > 0 && loadedCount >= Math.min(pages.length, 3) && !isReadyToObserve) {
      setIsReadyToObserve(true);
    }
  }, [loadedCount, pages.length, isReadyToObserve]);

  useEffect(() => {
    if (pages.length === 0 || !bottomSentinelRef.current || !isReadyToObserve) return;
    if (mode === 'paged' && currentPage !== pages.length - 1) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) markAsRead(); },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(bottomSentinelRef.current);
    return () => observer.disconnect();
  }, [mode, pages.length, markAsRead, chapterId, currentPage, isReadyToObserve]);

  const handleScroll = useCallback(() => {
    if (!mainRef.current || mode === 'paged') return;
    const currentScrollY = mainRef.current.scrollTop;
    const delta = currentScrollY - lastScrollYRef.current;
    if (currentScrollY < 100) setShowHeader(true);
    else if (delta > 25) setShowHeader(false);
    else if (delta < -15) setShowHeader(true);
    lastScrollYRef.current = currentScrollY;
  }, [mode]);

  useEffect(() => {
    setLoadedCount(0);
    setIsReadyToObserve(false);
    consecutiveErrors.current = 0;
  }, [chapterId, quality]);

  const handleGlobalError = useCallback(() => {
    const now = Date.now();
    // Debounce agressivo para evitar loop em dev
    if (now - lastErrorTime.current < 10000) return;

    consecutiveErrors.current += 1;
    if (consecutiveErrors.current >= 3) {
      console.warn("[Reader] Muitas falhas detectadas. Tentando trocar de servidor...");
      refreshImageServer();
      consecutiveErrors.current = 0;
      lastErrorTime.current = now;
    }
  }, [refreshImageServer]);

  const handleBack = useCallback(() => {
    if (manga?.id) navigate(`/manga/${manga.id}`, { replace: true });
    else navigate(-1);
  }, [manga?.id, navigate]);

  const goPrev = useCallback(() => {
    if (mode === 'paged' && currentPage > 0) setCurrentPage(p => p - 1);
    else if (prevChapterId) navigate(`/read/${prevChapterId}`, { replace: true });
  }, [mode, currentPage, prevChapterId, navigate, setCurrentPage]);

  const goNext = useCallback(() => {
    if (mode === 'paged' && currentPage < pages.length - 1) setCurrentPage(p => p + 1);
    else if (nextChapterId) {
      markAsRead();
      navigate(`/read/${nextChapterId}`, { replace: true });
    }
  }, [mode, currentPage, pages.length, nextChapterId, navigate, markAsRead, setCurrentPage]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (error) return <div className="h-screen flex flex-col items-center justify-center space-y-6 text-center px-4"><AlertCircle className="h-16 w-16 text-destructive/50" /><p className="max-w-xs text-sm text-muted-foreground">{error}</p><Button onClick={reload} size="lg" className="rounded-full">Tentar Novamente</Button></div>;

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
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Configurações">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={mode} onValueChange={(v: any) => setMode(v)}>
                  <DropdownMenuRadioItem value="paged">Paginado</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="scroll">Cascata</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={quality} onValueChange={(v: any) => setQuality(v)}>
                  <DropdownMenuRadioItem value="original">Alta Qualidade</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="data-saver">Econômico (Rápido)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <div className="p-2">
                   <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-2" onClick={() => refreshImageServer(true)}>
                      <RefreshCw className="h-3 w-3" /> Trocar Servidor
                   </Button>
                </div>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </header>

      <main ref={mainRef} onScroll={handleScroll} className="flex-1 relative bg-black/5 dark:bg-black/40 overflow-y-auto pt-14 scroll-smooth">
         {mode === 'paged' && (
           <div className="h-full w-full flex flex-col items-center justify-center cursor-pointer p-2 md:p-4 relative"
                onClick={(e) => {
                  const width = e.currentTarget.clientWidth;
                  const x = e.nativeEvent.offsetX;
                  if (x < width * 0.3) goPrev(); else goNext();
                }}>
             <ReaderImage
               src={constructPageUrl(pages[currentPage] || "")}
               dataSaverSrc={constructPageUrl(pages[currentPage] || "", 'data-saver')}
               alt={`Página ${currentPage + 1}`}
               className="max-h-full max-w-full object-contain shadow-2xl"
               onGlobalRefresh={handleGlobalError}
             />
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-2 rounded-full text-xs font-bold backdrop-blur-md">
               {currentPage + 1} / {pages.length}
             </div>
           </div>
         )}

         {mode === 'scroll' && (
           <div className="max-w-3xl mx-auto space-y-1 pb-10 px-1">
             {pages.map((page, index) => (
               <ReaderImage
                 key={`page-${page}`}
                 src={constructPageUrl(page)}
                 dataSaverSrc={constructPageUrl(page, 'data-saver')}
                 alt={`Página ${index + 1}`}
                 className="shadow-md"
                 onFullLoad={() => setLoadedCount(prev => prev + 1)}
                 onGlobalRefresh={handleGlobalError}
               />
             ))}
           </div>
         )}

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
