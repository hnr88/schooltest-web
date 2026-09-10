export const ARTICLE_CATEGORIES = ['news', 'tutorial', 'guide', 'opinion'] as const;

import type { ArticleStats } from '@/modules/articles/types/article.types';

/** Labels are message keys under the `Articles` namespace, resolved by the card. */
export const STAT_ITEMS: ReadonlyArray<{ key: keyof ArticleStats; labelKey: string }> = [
  { key: 'total', labelKey: 'statTotal' },
  { key: 'featured', labelKey: 'statFeatured' },
  { key: 'totalViews', labelKey: 'statTotalViews' },
];
