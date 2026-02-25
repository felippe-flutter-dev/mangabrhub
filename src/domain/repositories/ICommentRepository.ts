export interface Comment {
  id: string;
  type: 'manga' | 'chapter';
  targetId: string;
  content: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  createdAt: any;
}

export interface ICommentRepository {
  getComments(type: 'manga' | 'chapter', id: string): Promise<Comment[]>;
  postComment(type: 'manga' | 'chapter', targetId: string, content: string): Promise<{ id: string }>;
}
