export const ARTICLE_CATEGORIES = ['news', 'tutorial', 'guide', 'opinion'] as const;

import type { ArticleStats } from '@/modules/articles/types/article.types';

export const STAT_ITEMS: ReadonlyArray<{ key: keyof ArticleStats; label: string }> = [
  { key: 'total', label: 'Total' },
  { key: 'featured', label: 'Featured' },
  { key: 'totalViews', label: 'Total views' },
];

export const INITIAL_ARTICLES_FILTERS = { search: '', category: 'all' as const, page: 1 };
