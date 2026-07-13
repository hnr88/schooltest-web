import type { StrapiEntity } from '@/lib/axios/strapi';
import type { CreateArticleInput } from '@/modules/articles/schemas/article.schema';

export type ArticleCategory = 'news' | 'tutorial' | 'guide' | 'opinion';

export interface ArticleAuthor {
  documentId: string;
  username: string;
  email?: string;
}

export interface Article extends StrapiEntity {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  category: ArticleCategory;
  featured: boolean;
  views: number;
  author?: ArticleAuthor | null;
}

export interface ArticleStats {
  total: number;
  featured: number;
  totalViews: number;
}

export interface ArticleListFilters {
  search?: string;
  category?: ArticleCategory | 'all';
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ArticleListResult {
  items: Article[];
  total: number;
  page: number;
  pageCount: number;
}

export type { CreateArticleInput };
