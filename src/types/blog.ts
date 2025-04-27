
export interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  author_name: string | null;
  category: string;
  created_at: string;
  published: boolean;
  slug: string | null;
}

export interface BlogComment {
  id: string;
  article_id: string;
  content: string;
  user_email: string;
  created_at: string;
  parent_id: string | null;
  reactions: {
    likes: number;
    hearts: number;
    dislikes: number;
  };
}
