import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { BookOpen, ShieldCheck, Zap, Heart, MapPin, Code2, Rocket, Share2, Github, Coffee, Laptop } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router";

export default function About() {
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 space-y-16 animate-in fade-in duration-700 flex flex-col items-center">

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 pt-8 w-full">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight w-full">
          O Farol da Comunidade <span className="text-primary">Brasileira</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          O MangaBR Hub não é apenas um leitor. É a manifestação técnica de uma paixão pela nona arte,
          construído para ser a plataforma definitiva e limpa que o Brasil merece.
        </p>
      </section>

      {/* History Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full justify-items-center">
        <div className="space-y-6 text-center md:text-left flex flex-col items-center md:items-start">
          <div className="space-y-2 flex flex-col items-center md:items-start">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="h-6 w-6 text-yellow-500 fill-current" /> Nossa História
            </h2>
            <div className="h-1 w-20 bg-primary rounded-full" />
          </div>
          <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base max-w-xl">
            <p>
              O MangaBR Hub nasceu da inquietação de um leitor que se cansou de ver a experiência de leitura ser arruinada por anúncios invasivos e plataformas obsoletas. O objetivo era claro: criar o <strong>"leitor definitivo"</strong>.
            </p>
            <p>
              O que começou como um desafio técnico evoluiu para a missão de ser o ponto de encontro da comunidade. Somos um projeto de fã para fãs, focado em três pilares inegociáveis:
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start gap-4 pt-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold">Zero Anúncios</span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red-500 fill-current" />
              <span className="font-semibold">Transparência Total</span>
            </div>
            <div className="flex items-center gap-3">
              <Code2 className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Engenharia de Ponta</span>
            </div>
          </div>
        </div>
        <div className="relative group w-full max-w-md md:max-w-none">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative bg-card border-muted w-full">
            <CardContent className="p-8 space-y-4">
              <div className="text-sm font-mono text-primary italic text-center md:text-left">"Respeito ao tempo do usuário e ao trabalho das Scans."</div>
              <p className="text-sm text-muted-foreground leading-relaxed text-center md:text-left">
                Cada linha de código deste projeto foi escrita pensando na imersão.
                Acreditamos que a tecnologia deve ser invisível, permitindo que apenas a arte e a história brilhem.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="w-full" />

      {/* Author Section */}
      <section className="space-y-12 w-full flex flex-col items-center">
        <div className="flex flex-col md:flex-row gap-12 items-center text-center md:text-left justify-center w-full">
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="relative">
              <div className="h-48 w-48 rounded-full border-4 border-primary/20 overflow-hidden shadow-2xl mx-auto">
                <img
                  src="https://github.com/felippe-flutter-dev.png"
                  alt="Felippe Pinheiro"
                  className="h-full w-full object-cover"
                />
              </div>
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 px-3 py-1 shadow-lg border-2 border-background">Software Architect</Badge>
            </div>
          </div>
          <div className="flex-1 space-y-6 flex flex-col items-center md:items-start max-w-2xl">
            <div className="space-y-2 flex flex-col items-center md:items-start">
              <h2 className="text-3xl font-bold">Quem Constrói</h2>
              <div className="flex items-center gap-2 text-primary font-medium">
                <MapPin className="h-4 w-4" /> Paracambi, Rio de Janeiro
              </div>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                No comando do código está <strong>Felippe Pinheiro</strong>, Engenheiro de Software Sênior com alma de fundador.
                Nascido e crescido em Paracambi, atua na cidade como sua base de operações. É deste canto sossegado que ele projeta sistemas que escalam para milhares de usuários.
              </p>
              <p>
                Com carreira como <strong>Founding Mobile Engineer</strong> em setores vitais, Felippe traz o rigor da Clean Architecture para o MangaBR Hub.
                Para ele, morar "onde não tem nada" foi o combustível para construir "algo que é tudo" para a comunidade.
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a href="https://github.com/felippe-flutter-dev/mangabr-hub" target="_blank" rel="noreferrer"><Github className="h-4 w-4" /> GitHub</a>
              </Button>
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link to="/supporter"><Coffee className="h-4 w-4" /> Pagar um Café</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Future Section */}
      <section className="bg-primary/5 rounded-3xl p-8 md:p-12 space-y-8 border border-primary/10 w-full flex flex-col items-center">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Rocket className="h-8 w-8 text-primary animate-bounce" /> O Futuro: v2.0
          </h2>
          <p className="text-muted-foreground font-medium">Elevando a Experiência Brasileira</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full justify-items-center">
          <div className="space-y-3 text-center flex flex-col items-center">
            <div className="h-10 w-10 bg-background rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Poder para as Scans</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
              Perfis customizáveis e links diretos para comunidades, garantindo que as Scans sejam donas do seu tráfego.
            </p>
          </div>
          <div className="space-y-3 text-center flex flex-col items-center">
            <div className="h-10 w-10 bg-background rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Tecnologia Offline</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
              Suporte a PWA real para leitura no transporte público e notificações de novos lançamentos.
            </p>
          </div>
          <div className="space-y-3 text-center flex flex-col items-center">
            <div className="h-10 w-10 bg-background rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <Laptop className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Engenharia Contínua</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[250px]">
              Evolução constante da arquitetura para garantir velocidade máxima e consumo mínimo de dados.
            </p>
          </div>
        </div>

        <div className="pt-8 text-center w-full">
          <p className="italic text-muted-foreground max-w-2xl mx-auto border-t border-primary/10 pt-8">
            "O MangaBR Hub está deixando de ser um projeto pessoal para se tornar o Hub Nacional.
            Onde o esforço das Scans e a paixão dos leitores se encontram."
          </p>
        </div>
      </section>

      {/* Footer Support */}
      <footer className="flex flex-col items-center text-center pb-8 space-y-4 w-full">
        <p className="text-sm font-medium">Acredita na nossa visão?</p>
        <Button asChild size="lg" className="rounded-full px-8 shadow-xl shadow-primary/20">
          <Link to="/supporter">Apoie esta Revolução ☕</Link>
        </Button>
      </footer>
    </div>
  );
}
