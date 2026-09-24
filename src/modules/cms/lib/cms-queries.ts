import {
  ARTICLES_PAGE_SIZE,
  CMS_FALLBACK_LOCALE,
  CMS_LAYOUT_PATH,
  CMS_LIST_PAGE_SIZE,
  CMS_PAGE_BY_SLUG_PATH,
  CMS_PAGES_PATH,
  SLUG_PATTERN,
} from '@/modules/cms/constants/cms.constants';
import { cmsGet } from '@/modules/cms/lib/cms-fetch';
import {
  cmsLayoutResponseSchema,
  cmsPageListResponseSchema,
  cmsPageResponseSchema,
} from '@/modules/cms/schemas/cms.schema';
import type {
  CmsLayout,
  CmsPageList,
  CmsPageType,
  ResolvedCmsPage,
} from '@/modules/cms/types/cms.types';

/**
 * One published page by slug in the request locale, falling back to `en` when
 * the locale has no entry (the site's copy is authored in English first).
 * `null` means "render a 404" — missing, or the CMS is unreachable.
 */
export async function getCmsPage(slug: string, locale: string): Promise<ResolvedCmsPage | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const read = (target: string) =>
    cmsGet(`${CMS_PAGE_BY_SLUG_PATH}/${slug}?locale=${encodeURIComponent(target)}`, cmsPageResponseSchema);

  const first = await read(locale);
  if (first.status === 'ok') return { page: first.data.data, requestedLocale: locale, isFallback: false };
  if (locale === CMS_FALLBACK_LOCALE) return null;
  const fallback = await read(CMS_FALLBACK_LOCALE);
  return fallback.status === 'ok'
    ? { page: fallback.data.data, requestedLocale: locale, isFallback: true }
    : null;
}

/** One page of published pages of a type, newest first. Empty when the CMS is unreachable. */
export async function listCmsPages({
  locale,
  type,
  page = 1,
  pageSize = ARTICLES_PAGE_SIZE,
}: {
  locale: string;
  type?: CmsPageType;
  page?: number;
  pageSize?: number;
}): Promise<CmsPageList> {
  const query = new URLSearchParams({ locale, page: String(page), pageSize: String(pageSize) });
  if (type) query.set('type', type);
  const result = await cmsGet(`${CMS_PAGES_PATH}?${query.toString()}`, cmsPageListResponseSchema);
  if (result.status !== 'ok') return { items: [], page, pageCount: 0, total: 0 };
  const { pagination } = result.data.meta;
  return {
    items: result.data.data,
    page: pagination.page,
    pageCount: pagination.pageCount,
    total: pagination.total,
  };
}

/** Every published page in a locale (all pages of the list endpoint, 100 at a time). */
export async function listAllCmsPages(locale: string, type?: CmsPageType): Promise<CmsPageList['items']> {
  const first = await listCmsPages({ locale, type, page: 1, pageSize: CMS_LIST_PAGE_SIZE });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.pageCount - 1) }, (_, index) =>
      listCmsPages({ locale, type, page: index + 2, pageSize: CMS_LIST_PAGE_SIZE }),
    ),
  );
  return [...first.items, ...rest.flatMap((list) => list.items)];
}

/** Site navigation for a locale, falling back to `en`; `null` when the CMS has none or is down. */
export async function getCmsLayout(locale: string): Promise<CmsLayout | null> {
  const read = (target: string) =>
    cmsGet(`${CMS_LAYOUT_PATH}?locale=${encodeURIComponent(target)}`, cmsLayoutResponseSchema);
  const first = await read(locale);
  if (first.status === 'ok') return first.data.data;
  if (locale === CMS_FALLBACK_LOCALE) return null;
  const fallback = await read(CMS_FALLBACK_LOCALE);
  return fallback.status === 'ok' ? fallback.data.data : null;
}
