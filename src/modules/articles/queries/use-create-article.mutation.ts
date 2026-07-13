'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import type { CreateArticleInput } from '@/modules/articles/schemas/article.schema';
import type { Article } from '@/modules/articles/types/article.types';

async function createArticleRequest(input: CreateArticleInput): Promise<Article> {
  const res = await strapi.post<StrapiSingleResponse<Article>>('/api/articles', { data: input });
  return res.data.data;
}

export function useCreateArticleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createArticleRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
