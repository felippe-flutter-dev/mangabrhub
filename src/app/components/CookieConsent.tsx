import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Cookie } from "lucide-react";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    setShow(false);
    // Dispara evento para o Reader saber que agora pode salvar
    window.dispatchEvent(new Event("chapters_updated"));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[100] animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-card border shadow-lg rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <Cookie className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold">Privacidade e Cookies</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Utilizamos cookies e armazenamento local para salvar sua lista de capítulos lidos e preferências de leitura. Ao continuar, você concorda com o uso dessas tecnologias.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAccept} className="w-full">Aceitar e Continuar</Button>
        </div>
      </div>
    </div>
  );
}
