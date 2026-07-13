'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import type { ArticleStats } from '@/modules/articles/types/article.types';

async function fetchArticleStats(): Promise<ArticleStats> {
  const res = await strapi.get<{ data: ArticleStats }>('/api/articles/stats');
  return res.data.data;
}

export function useArticleStatsQuery() {
  return useQuery({
    queryKey: ['articles', 'stats'],
    queryFn: fetchArticleStats,
    staleTime: 30_000,
  });
}
