'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import type {
  Article,
  ArticleListFilters,
  ArticleListResult,
} from '@/modules/articles/types/article.types';

async function fetchArticles(filters: ArticleListFilters): Promise<ArticleListResult> {
  const f: Record<string, unknown> = {};
  if (filters.category && filters.category !== 'all') f.category = { $eq: filters.category };
  if (typeof filters.featured === 'boolean') f.featured = { $eq: filters.featured };
  if (filters.search) {
    f.$or = [
      { title: { $containsi: filters.search } },
      { excerpt: { $containsi: filters.search } },
    ];
  }

  const pageSize = filters.pageSize ?? 12;
  const res = await strapi.get<StrapiCollectionResponse<Article>>('/api/articles', {
    params: {
      sort: ['updatedAt:desc'],
      filters: f,
      populate: { author: { fields: ['documentId', 'username'] } },
      pagination: { page: filters.page ?? 1, pageSize },
    },
  });

  const total = res.data.meta.pagination?.total ?? res.data.data.length;
  return {
    items: res.data.data,
    total,
    page: filters.page ?? 1,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function useArticlesQuery(filters: ArticleListFilters = {}) {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: () => fetchArticles(filters),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
