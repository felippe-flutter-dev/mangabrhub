import { useState, useEffect, useCallback } from "react";
import { getComments, postComment } from "../../app/lib/api";
import { auth, onAuthStateChanged } from "../../app/lib/firebase";
import { toast } from "sonner";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: any;
}

export function useCommentSectionViewModel(type: 'manga' | 'chapter', id: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getComments(type, id);
      setComments(data);
    } catch (error) {
      // Silencia erro em prod
    } finally {
      setLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    fetchComments();
    return () => unsubscribe();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      const result = await postComment(type, id, content);
      const newComment: Comment = {
        id: result.id,
        userId: user.uid,
        userName: user.displayName || "Usuário",
        userPhoto: user.photoURL,
        content: content,
        createdAt: { seconds: Math.floor(Date.now() / 1000) }
      };

      setComments(prev => [newComment, ...prev]);
      setContent("");
      toast.success("Comentário enviado!");
    } catch (error) {
      toast.error("Erro ao enviar comentário.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    comments,
    content,
    setContent,
    loading,
    submitting,
    user,
    handleSubmit,
    refresh: fetchComments
  };
}
