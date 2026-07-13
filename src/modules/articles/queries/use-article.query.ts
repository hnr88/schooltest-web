'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import type { Article } from '@/modules/articles/types/article.types';

async function fetchArticle(documentId: string): Promise<Article> {
  const res = await strapi.get<StrapiSingleResponse<Article>>(`/api/articles/${documentId}`, {
    params: { populate: { author: { fields: ['documentId', 'username'] } } },
  });
  return res.data.data;
}

export function useArticleQuery(documentId: string | undefined) {
  return useQuery({
    queryKey: ['articles', 'detail', documentId],
    queryFn: () => fetchArticle(documentId as string),
    enabled: Boolean(documentId),
  });
}
