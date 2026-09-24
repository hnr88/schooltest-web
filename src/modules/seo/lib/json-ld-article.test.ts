import { describe, expect, it } from 'vitest';

import {
  buildArticleJsonLd,
  buildBlogPostingJsonLd,
  buildNewsArticleJsonLd,
  countWords,
} from '@/modules/seo/lib/json-ld-article';

const ROOT = 'http://localhost:3000/';
const BASE = {
  pathname: '/blog/subskills',
  locale: 'en',
  headline: 'Why subskills matter',
  description: 'A placement band hides the detail.',
  datePublished: '2026-09-01T00:00:00.000Z',
};

describe('countWords', () => {
  it('counts words and ignores markdown and html punctuation', () => {
    expect(countWords('## Heading\n\nOne *two* [three](http://x) <b>four</b> - 5')).toBe(6);
    expect(countWords('   ')).toBe(0);
  });
});

describe('buildArticleJsonLd', () => {
  it('credits the Organization when no author is named and falls back dateModified to datePublished', () => {
    const article = buildArticleJsonLd(BASE);
    expect(article['@type']).toBe('Article');
    expect(article.author).toEqual([{ '@id': `${ROOT}#organization` }]);
    expect(article.publisher).toEqual({ '@id': `${ROOT}#organization` });
    expect(article.dateModified).toBe(BASE.datePublished);
    expect(article.mainEntityOfPage).toEqual({ '@id': `${ROOT}blog/subskills#webpage` });
    for (const key of ['image', 'wordCount', 'keywords', 'articleSection']) {
      expect(key in article, key).toBe(false);
    }
  });

  it('carries people, images, word count, keywords and section when supplied', () => {
    const article = buildArticleJsonLd({
      ...BASE,
      locale: 'th',
      authors: [{ name: 'A. Teacher', url: 'https://example.edu/a' }],
      images: [{ url: `${ROOT}img.png`, width: 1200, height: 630 }],
      body: 'one two three',
      keywords: ['EAL/D', ' '],
      articleSection: 'Assessment',
    });
    expect(article.author).toEqual([{ '@type': 'Person', name: 'A. Teacher', url: 'https://example.edu/a' }]);
    expect(article.image).toEqual([{ '@type': 'ImageObject', url: `${ROOT}img.png`, width: 1200, height: 630 }]);
    expect(article.wordCount).toBe(3);
    expect(article.keywords).toEqual(['EAL/D']);
    expect(article.articleSection).toBe('Assessment');
    expect(article.inLanguage).toBe('th');
    expect(article['@id']).toBe(`${ROOT}th/blog/subskills#article`);
  });

  it('caps the headline at 110 characters (Google Article guideline)', () => {
    expect(buildArticleJsonLd({ ...BASE, headline: 'x'.repeat(200) }).headline).toHaveLength(110);
  });

  it('has BlogPosting and NewsArticle variants', () => {
    expect(buildBlogPostingJsonLd(BASE)['@type']).toBe('BlogPosting');
    expect(buildNewsArticleJsonLd(BASE)['@type']).toBe('NewsArticle');
  });
});
