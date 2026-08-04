import { create } from 'zustand';

import { INITIAL_ARTICLES_FILTERS } from '@/modules/articles/constants/article.constants';

import type { ArticlesFiltersState } from '@/modules/articles/types/article.types';

export const useArticlesFiltersStore = create<ArticlesFiltersState>((set) => ({
  ...INITIAL_ARTICLES_FILTERS,
  setSearch: (search) => set({ search, page: 1 }),
  setCategory: (category) => set({ category, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set(INITIAL_ARTICLES_FILTERS),
}));
