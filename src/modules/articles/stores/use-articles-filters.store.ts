import { create } from 'zustand';

import type { ArticleCategory } from '@/modules/articles/types/article.types';

interface ArticlesFiltersState {
  search: string;
  category: ArticleCategory | 'all';
  page: number;
  setSearch: (search: string) => void;
  setCategory: (category: ArticleCategory | 'all') => void;
  setPage: (page: number) => void;
  reset: () => void;
}

const INITIAL = { search: '', category: 'all' as const, page: 1 };

export const useArticlesFiltersStore = create<ArticlesFiltersState>((set) => ({
  ...INITIAL,
  setSearch: (search) => set({ search, page: 1 }),
  setCategory: (category) => set({ category, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set(INITIAL),
}));
