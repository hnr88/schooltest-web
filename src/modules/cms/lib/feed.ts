import type { FeedInput } from '@/modules/cms/types/cms.types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RSS 2.0 for the published articles, newest first as given. */
export function buildRssFeed(input: FeedInput): string {
  const items = input.items
    .map((item) =>
      [
        '    <item>',
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(item.url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(item.id)}</guid>`,
        `      <description>${escapeXml(item.summary)}</description>`,
        `      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>`,
        ...(item.authorName ? [`      <dc:creator>${escapeXml(item.authorName)}</dc:creator>`] : []),
        '    </item>',
      ].join('\n'),
    )
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${escapeXml(input.title)}</title>`,
    `    <link>${escapeXml(input.homePageUrl)}</link>`,
    `    <description>${escapeXml(input.description)}</description>`,
    `    <language>${escapeXml(input.language)}</language>`,
    `    <atom:link href="${escapeXml(input.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...(items ? [items] : []),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
