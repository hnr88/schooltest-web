import { getCmsPage, listAllCmsPages } from '@/modules/cms/lib/cms-queries';
import { cmsPagePath } from '@/modules/cms/lib/cms-paths';
import { pageToText } from '@/modules/cms/lib/cms-text';
import type { CmsPageSummary } from '@/modules/cms/types/cms.types';
import type { PublicContentInput } from '@/modules/seo';

const SECTION_BY_TYPE = { legal: 'legal', info: 'pages', article: 'articles' } as const;

function toPublicContent(page: CmsPageSummary, body?: string): PublicContentInput {
  return {
    pathname: cmsPagePath(page),
    title: page.seo?.metaTitle || page.title,
    description: page.seo?.metaDescription || page.summary || page.title,
    updatedAt: page.updatedDate ?? page.updatedAt,
    section: SECTION_BY_TYPE[page.pageType],
    ...(body ? { body } : {}),
  };
}

/**
 * Every INDEXABLE published CMS page in one locale, shaped for the sitemap,
 * llms.txt and llms-full.txt (SEO module's `PublicContentInput`). Pages marked
 * noindex (the "content coming soon" placeholders) are left out. `withBody`
 * adds the plain-text body (one detail read per page) for llms-full.txt.
 * Returns [] when the CMS is unreachable — never throws.
 */
export async function listPublicCmsPages(
  locale: string,
  { withBody = false }: { withBody?: boolean } = {},
): Promise<PublicContentInput[]> {
  const pages = (await listAllCmsPages(locale)).filter((page) => !page.seo?.noindex);
  if (!withBody) return pages.map((page) => toPublicContent(page));
  return Promise.all(
    pages.map(async (page) => {
      const detail = await getCmsPage(page.slug, locale);
      return toPublicContent(page, detail ? pageToText(detail.page) : undefined);
    }),
  );
}
