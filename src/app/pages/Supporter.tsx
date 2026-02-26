import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Coffee, Heart, Globe, Github, ExternalLink } from "lucide-react";

export default function Supporter() {
  const PIX_KEY = "1dc8bd39-88b8-499f-bf49-3d531158f5c8";
  const PAYMENT_LINK = "https://link.mercadopago.com.br/mangahubapoiadores";

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 space-y-12 min-h-[calc(100vh-4rem)]">
      <div className="text-center space-y-4 max-w-2xl">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
          <Heart className="h-8 w-8 text-primary fill-current" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Mantenha o MangaBR Hub Vivo</h1>
        <p className="text-xl text-muted-foreground">
          Este é um projeto **Open Source** e sem fins lucrativos. Sua ajuda garante que continuemos no ar e sem anúncios intrusivos.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch w-full max-w-4xl">
        {/* Transparência de Custos */}
        <Card className="border-muted bg-muted/30 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" /> Transparência de Custos
            </CardTitle>
            <CardDescription>Por que pedimos o seu apoio?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm">API MangaDex (Uso Comercial/Proxy)</span>
                <span className="font-mono font-bold">$5.00 /mês</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm">Hospedagem & Vercel Functions</span>
                <span className="font-mono font-bold">Variável</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm">Manutenção & Desenvolvimento</span>
                <span className="font-mono font-bold">Tempo Pessoal</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                O MangaBR Hub é desenvolvido por paixão. Cada "cafezinho" doado é reinvestido integralmente na infraestrutura necessária.
              </p>

              <Button variant="outline" className="w-full gap-2" asChild>
                <a href="https://github.com/felippe-flutter-dev/mangabrhub" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" /> Ver Código no GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PIX */}
        <Card className="border-2 border-primary shadow-xl flex flex-col">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Coffee className="h-6 w-6 text-primary" /> Pague um Café
            </CardTitle>
            <CardDescription>Qualquer valor ajuda imensamente!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 flex-1">
            <div className="bg-white p-4 rounded-xl border-4 border-muted">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PIX_KEY)}`}
                alt="QR Code PIX"
                className="h-48 w-48"
              />
            </div>

            <div className="w-full space-y-2 text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Chave PIX</p>
              <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all select-all border border-dashed border-primary/50">
                {PIX_KEY}
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 mt-auto">
              <Button className="w-full" variant="default" onClick={() => {
                navigator.clipboard.writeText(PIX_KEY);
                alert("Chave PIX copiada!");
              }}>
                Copiar Chave
              </Button>

              <Button className="w-full gap-2" variant="outline" asChild>
                <a href={PAYMENT_LINK} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Pagar via Mercado Pago
                </a>
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center italic">
              Obrigado por apoiar a comunidade de tradução brasileira!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
