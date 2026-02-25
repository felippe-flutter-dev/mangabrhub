import { Outlet, Link, useLocation } from "react-router";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/theme-toggle";
import { Search as SearchIcon, User, BookOpen, Coffee, Flame } from "lucide-react";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import { useEffect, useState } from "react";
import { auth, onAuthStateChanged, User as FirebaseUser } from "./lib/firebase";
import { CookieConsent } from "./components/CookieConsent";
import { userRepository } from "./di";
import ScrollToTop from "./components/ScrollToTop";
import { Analytics } from "@vercel/analytics/react";

export default function Root() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'user' | 'supporter' | 'admin'>('user');
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await userRepository.getUserProfile(currentUser.uid);
        if (profile) setRole(profile.role);
      } else {
        setRole('user');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ScrollToTop />
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center px-4">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                MangaBR Hub
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/search"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Explorar
              </Link>
              {user && (
                <Link
                  to="/profile"
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Minha Biblioteca
                </Link>
              )}
              {role === 'supporter' || role === 'admin' ? (
                <Link
                  to="/adult"
                  className="transition-colors hover:text-primary text-orange-500 font-bold flex items-center gap-1"
                >
                  <Flame className="h-4 w-4" /> Espaço Adulto
                </Link>
              ) : (
                <Link
                  to="/supporter"
                  className="transition-colors hover:text-primary text-muted-foreground flex items-center gap-1"
                >
                  <Coffee className="h-4 w-4" /> Café?
                </Link>
              )}
            </nav>
            <div className="flex flex-1 items-center justify-end space-x-2">
              <div className="w-full flex-1 md:w-auto md:flex-none">
                <Button variant="ghost" className="w-9 px-0" asChild>
                  <Link to="/search">
                    <SearchIcon className="h-4 w-4" />
                    <span className="sr-only">Buscar</span>
                  </Link>
                </Button>
              </div>
              <ModeToggle />
              {user ? (
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/profile">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "Usuário"}
                        className="h-6 w-6 rounded-full border-2 border-primary/20"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Link>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
              )}
            </div>
          </div>
        </header>
        <main key={location.pathname} className="flex-1">
          <Outlet />
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 text-center">
            <p className="text-balance text-sm leading-loose text-muted-foreground">
              MangaBR Hub © {new Date().getFullYear()}. Alimentado pela API do Mangadex.
              <span className="mx-2 block md:inline">
                Desenvolvido por{" "}
                <a
                  href="https://github.com/felippe-flutter-dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Felippe Pinheiro
                </a>
              </span>
            </p>
          </div>
        </footer>
      </div>
      <Toaster />
      <CookieConsent />
      <Analytics />
    </ThemeProvider>
  );
}
