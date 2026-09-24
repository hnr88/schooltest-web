import { env } from '@/lib/env';
import { toAbsoluteStrapiMediaUrl } from '@/lib/strapi-media';
import { ARTICLES_PATH } from '@/modules/cms/constants/cms.constants';
import { cmsPagePath } from '@/modules/cms/lib/cms-paths';
import { blocksToText, countWords, pageToText } from '@/modules/cms/lib/cms-text';
import type { CmsPage } from '@/modules/cms/types/cms.types';
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_NAME,
  absoluteUrl,
  ogImagePathFor,
  buildBlogPostingJsonLd,
  buildPublicPageGraph,
} from '@/modules/seo';
import type { BreadcrumbJsonLdItem, FaqEntry, JsonLdGraph, WebPageType } from '@/modules/seo';
import { routing } from '@/i18n/routing';

const WEB_PAGE_TYPE: Readonly<Record<string, WebPageType>> = {
  about: 'AboutPage',
  contact: 'ContactPage',
};

/** Visible FAQ entries → FAQPage Question nodes (only what the page renders). */
export function cmsFaqEntries(page: Pick<CmsPage, 'sections'>): FaqEntry[] {
  return page.sections.flatMap((section) =>
    section.__component === 'sections.faq-list'
      ? section.faqs.map((faq, index) => ({
          key: `${section.id}-${index + 1}`,
          question: faq.question,
          answer: blocksToText(faq.answer),
        }))
      : [],
  );
}

/**
 * One @graph per CMS page through the SEO module's builders: Organization,
 * WebSite, WebPage (FAQPage when a FAQ is visible), BreadcrumbList, the FAQ
 * Questions and, for an article, its BlogPosting.
 */
export function buildCmsJsonLd({
  page,
  locale,
  siteDescription,
  crumbs,
}: {
  page: CmsPage;
  locale: string;
  siteDescription: string;
  crumbs: readonly { label: string; href: string }[];
}): JsonLdGraph {
  const pathname = cmsPagePath(page);
  const description = page.seo?.metaDescription || page.summary || page.title;
  const faq = cmsFaqEntries(page);
  const image = page.seo?.ogImage ?? page.coverImage;
  const images = image
    ? [{ url: toAbsoluteStrapiMediaUrl(image.url), width: image.width ?? undefined, height: image.height ?? undefined }]
    : undefined;
  const breadcrumb: BreadcrumbJsonLdItem[] = crumbs.map((crumb) => ({
    name: crumb.label,
    url: absoluteUrl(crumb.href, locale, routing.defaultLocale),
  }));
  // An article always carries an image (Article rich results): its own cover,
  // else the generated 1200x630 share card of its URL.
  const articleImages = images ?? [
    {
      url: new URL(ogImagePathFor(pathname, locale), env.NEXT_PUBLIC_APP_URL).toString(),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
    },
  ];
  const datePublished = page.publishedDate ?? page.publishedAt ?? page.updatedAt;
  const dateModified = page.updatedDate ?? page.updatedAt;

  const nodes =
    page.pageType === 'article'
      ? [
          buildBlogPostingJsonLd({
            pathname,
            locale,
            headline: page.title,
            description,
            datePublished,
            dateModified,
            images: articleImages,
            authors: page.author ? [{ name: page.author.name, ...(page.author.url ? { url: page.author.url } : {}) }] : [],
            wordCount: countWords(pageToText(page)),
            articleSection: 'Articles',
          }),
        ]
      : [];

  return buildPublicPageGraph({
    site: { siteName: SITE_NAME, description: siteDescription },
    page: {
      pathname,
      locale,
      title: page.seo?.metaTitle || page.title,
      description,
      pageType: faq.length > 0 ? 'FAQPage' : (WEB_PAGE_TYPE[page.slug] ?? 'WebPage'),
      datePublished,
      dateModified,
      ...(images ? { image: images[0] } : {}),
    },
    breadcrumb,
    faq,
    nodes,
  });
}

/** The /articles index: a CollectionPage with its breadcrumb. */
export function buildArticlesIndexJsonLd({
  locale,
  title,
  description,
  siteDescription,
  crumbs,
}: {
  locale: string;
  title: string;
  description: string;
  siteDescription: string;
  crumbs: readonly { label: string; href: string }[];
}): JsonLdGraph {
  return buildPublicPageGraph({
    site: { siteName: SITE_NAME, description: siteDescription },
    page: { pathname: ARTICLES_PATH, locale, title, description, pageType: 'CollectionPage' },
    breadcrumb: crumbs.map((crumb) => ({
      name: crumb.label,
      url: absoluteUrl(crumb.href, locale, routing.defaultLocale),
    })),
  });
}
