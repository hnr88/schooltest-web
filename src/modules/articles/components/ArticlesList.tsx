'use client';

import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

import {
  applyClientDirectoryMode,
  DIRECTORY_ALL,
  DirectoryTable,
  useDirectoryState,
  type DirectoryClientConfig,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryLabels,
  type DirectorySortDef,
} from '@/modules/directory';
import { Badge } from '@/modules/design-system';
import { ARTICLE_CATEGORIES } from '@/modules/articles/constants/article.constants';
import { useArticlesQuery } from '@/modules/articles/queries/use-articles.query';

import type { Article, ArticleCategory } from '@/modules/articles/types/article.types';

// ops/36 — the articles list ON the generic directory kit (OP-3, client mode):
// one read at Strapi's page-size ceiling and the kit owns search, filters,
// sort, pagination and the states, replacing the bespoke search input, card
// grid, pager and empty line. The article has no status field — the honest
// axes are its category and featured flag. The stats cards beside this list
// read their own hook and are untouched.
export function ArticlesList() {
  const t = useTranslations('Articles');
  const format = useFormatter();
  // One read of the whole list: client-mode search/filter/sort/pagination need
  // the full set, not one server page of it.
  const articlesQuery = useArticlesQuery({ pageSize: 100 });

  const filters = useMemo<DirectoryFilterDef[]>(
    () => [
      {
        key: 'category',
        label: t('filterCategoryLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('featuredAll') },
          ...ARTICLE_CATEGORIES.map((category) => ({
            value: category,
            label: t(`category${category[0].toUpperCase()}${category.slice(1)}`),
          })),
        ],
      },
      {
        key: 'featured',
        label: t('filterFeaturedLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('featuredAll') },
          { value: 'featured', label: t('featuredOnly') },
        ],
      },
    ],
    [t],
  );

  const sorts = useMemo<DirectorySortDef[]>(
    () => [
      { value: 'updated:desc', label: t('sortNewest') },
      { value: 'updated:asc', label: t('sortOldest') },
    ],
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: 'updated:desc',
    mode: 'client',
  });

  const labels = useMemo<Partial<DirectoryLabels>>(
    () => ({
      searchPlaceholder: t('searchPlaceholder'),
      searchLabel: t('searchLabel'),
      sortLabel: t('sortLabel'),
      clearFilters: t('clearFilters'),
      paginationLabel: t('paginationLabel'),
      previous: t('previous'),
      next: t('next'),
      rowMenuLabel: t('rowMenuLabel'),
      showingCount: ({ showing, total }) => t('showingCount', { showing, total }),
      pageCount: ({ page, pageCount, total }) => t('pageCount', { page, pageCount, total }),
      emptyNoneTitle: t('emptyTitle'),
      emptyNoneDescription: t('emptyDescription'),
      emptyNoMatchesTitle: t('filteredEmptyTitle'),
      emptyNoMatchesDescription: t('filteredEmptyDescription'),
      errorTitle: t('errorTitle'),
      errorStaleBanner: t('staleBanner'),
      errorDescription: t('errorDescription'),
      retry: t('retry'),
      loadingLabel: t('loading'),
    }),
    [t],
  );

  const columns = useMemo<readonly DirectoryColumnDef<Article>[]>(
    () => [
      {
        key: 'title',
        header: t('columnTitle'),
        cell: (row) => (
          <span className="flex items-center gap-2 font-medium text-foreground">
            <span className="truncate">{row.title}</span>
            {row.featured ? <Badge variant="accent">{t('featuredBadge')}</Badge> : null}
          </span>
        ),
      },
      {
        key: 'category',
        header: t('columnCategory'),
        cell: (row) => <span className="capitalize">{row.category}</span>,
      },
      {
        key: 'views',
        header: t('columnViews'),
        cell: (row) => t('viewsCount', { views: row.views }),
      },
      {
        key: 'updated',
        header: t('columnUpdated'),
        cell: (row) => format.dateTime(new Date(row.updatedAt), { dateStyle: 'medium' }),
      },
    ],
    [t, format],
  );

  const { rows, meta } = applyClientDirectoryMode<Article>(
    articlesQuery.data?.items ?? [],
    state.params,
    {
      searchText: (row) => [row.title, row.excerpt ?? ''],
      filterPredicates: {
        category: (row, value) => row.category === value,
        featured: (row, value) => (value === 'featured' ? row.featured : true),
      },
      comparators: {
        'updated:asc': (a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt),
        'updated:desc': (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      },
    } satisfies DirectoryClientConfig<Article>,
  );

  return (
    <DirectoryTable
      state={state}
      query={articlesQuery}
      rows={rows}
      meta={meta}
      filters={filters}
      sorts={sorts}
      columns={columns}
      getRowKey={(row) => row.documentId}
      labels={labels}
    />
  );
}
