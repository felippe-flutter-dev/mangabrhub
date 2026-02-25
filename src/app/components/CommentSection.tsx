import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useCommentSectionViewModel } from "../../presentation/viewmodels/CommentSectionViewModel";

interface CommentSectionProps {
  type: 'manga' | 'chapter';
  id: string;
}

export function CommentSection({ type, id }: CommentSectionProps) {
  const {
    comments,
    content,
    setContent,
    loading,
    submitting,
    user,
    handleSubmit
  } = useCommentSectionViewModel(type, id);

  const formatCommentDate = (createdAt: any) => {
    if (!createdAt) return "agora";

    // Lida com Timestamps do Firestore ou objetos com .seconds
    const date = createdAt.seconds
      ? new Date(createdAt.seconds * 1000)
      : new Date(createdAt);

    try {
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (e) {
      return "recentemente";
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Comentários ({comments.length})</h3>
      
      {user ? (
        <div className="space-y-2">
          <Textarea 
            placeholder="Deixe um comentário..." 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting || !content.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted p-4 rounded-md text-center">
          <p className="text-sm text-muted-foreground">Faça login para comentar.</p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 border rounded-lg bg-card">
              <Avatar>
                <AvatarImage src={comment.userPhoto} />
                <AvatarFallback>{comment.userName?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{comment.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCommentDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4 text-sm">Nenhum comentário ainda.</p>
        )}
      </div>
    </div>
  );
}
