import { auth, googleProvider, signInWithPopup } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      console.log("Iniciando login com Google...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login bem-sucedido:", result.user.email);
      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      // Print completo do erro no terminal (console do navegador)
      console.error("DETALHES DO ERRO FIREBASE:");
      console.error("Código:", error.code);
      console.error("Mensagem:", error.message);
      console.error("Objeto completo:", error);

      toast.error(`Erro: ${error.code || "Erro desconhecido"}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
      <p className="text-muted-foreground text-center max-w-sm">
        Faça login com sua conta do Google para salvar seus mangás favoritos, criar listas de leitura e interagir com a comunidade.
      </p>
      <Button size="lg" onClick={handleLogin}>
        Entrar com Google
      </Button>
    </div>
  );
}
