import { pageIds, siteIds } from '@/modules/seo/lib/json-ld-ids';
import type { ArticleInput } from '@/modules/seo/types/json-ld-input.types';
import type { ArticleNode, ArticleType } from '@/modules/seo/types/json-ld.types';

/** Word count of plain or markdown text, ignoring markup punctuation. */
export function countWords(text: string): number {
  const words = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/[#*_>`[\]()!|~-]/g, ' ')
    .trim()
    .split(/\s+/u)
    .filter((word) => /[\p{L}\p{N}]/u.test(word));
  return words.length;
}

/**
 * Article / BlogPosting / NewsArticle for one article page. The article is the
 * page's main entity; with no named author the Organization is credited rather
 * than a made-up person. Pair it with the page's WebPage node in one @graph.
 */
export function buildArticleJsonLd(input: ArticleInput): ArticleNode {
  const site = siteIds();
  const ids = pageIds(input.pathname, input.locale);
  const authors = input.authors ?? [];
  const wordCount = input.wordCount ?? (input.body ? countWords(input.body) : undefined);
  const keywords = (input.keywords ?? []).filter((keyword) => keyword.trim().length > 0);

  return {
    '@type': input.type ?? 'Article',
    '@id': ids.article,
    headline: input.headline.slice(0, 110),
    description: input.description,
    url: ids.url,
    ...(input.images && input.images.length > 0
      ? {
          image: input.images.map((image) => ({
            '@type': 'ImageObject' as const,
            url: image.url,
            ...(image.width ? { width: image.width } : {}),
            ...(image.height ? { height: image.height } : {}),
            ...(image.caption ? { caption: image.caption } : {}),
          })),
        }
      : {}),
    author:
      authors.length > 0
        ? authors.map((author) => ({
            '@type': 'Person' as const,
            name: author.name,
            ...(author.url ? { url: author.url } : {}),
          }))
        : [{ '@id': site.organization }],
    publisher: { '@id': site.organization },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    mainEntityOfPage: { '@id': ids.webpage },
    isPartOf: { '@id': ids.webpage },
    inLanguage: input.locale,
    ...(wordCount !== undefined ? { wordCount } : {}),
    ...(keywords.length > 0 ? { keywords } : {}),
    ...(input.articleSection ? { articleSection: input.articleSection } : {}),
  };
}

function withType(type: ArticleType) {
  return (input: Omit<ArticleInput, 'type'>): ArticleNode => buildArticleJsonLd({ ...input, type });
}

export const buildBlogPostingJsonLd = withType('BlogPosting');
export const buildNewsArticleJsonLd = withType('NewsArticle');
