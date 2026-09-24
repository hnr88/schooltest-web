import { getFormatter, getTranslations } from 'next-intl/server';

import { pageToText, readingMinutes } from '@/modules/cms/lib/cms-text';
import type { CmsPage } from '@/modules/cms/types/cms.types';

const DATE = { year: 'numeric', month: 'long', day: 'numeric' } as const;

// The dateline under the h1: effective date + version for legal pages, byline +
// date + reading time for articles, last update for info pages.
async function CmsPageMeta({ page, locale }: { page: CmsPage; locale: string }) {
  const t = await getTranslations();
  const format = await getFormatter({ locale });
  const date = (value: string) => format.dateTime(new Date(value), DATE);
  const items: { key: string; label: string; value: string; dateTime?: string }[] = [];

  if (page.pageType === 'legal') {
    if (page.publishedDate) items.push({ key: 'effective', label: t('Legal.effectiveDate'), value: date(page.publishedDate), dateTime: page.publishedDate });
    if (page.version) items.push({ key: 'version', label: t('Legal.version'), value: page.version });
  } else if (page.pageType === 'article') {
    if (page.author) items.push({ key: 'author', label: t('Cms.author'), value: page.author.name });
    const published = page.publishedDate ?? page.publishedAt;
    if (published) items.push({ key: 'published', label: t('Cms.published'), value: date(published), dateTime: published });
    items.push({ key: 'reading', label: t('Cms.readingTimeLabel'), value: t('Cms.readingTime', { minutes: readingMinutes(pageToText(page)) }) });
  } else {
    const updated = page.updatedDate ?? page.updatedAt;
    items.push({ key: 'updated', label: t('Cms.updated'), value: date(updated), dateTime: updated });
  }

  return (
    <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-body-sm text-body">
      {items.map((item) => (
        <div key={item.key} className="flex gap-2">
          <dt className="font-medium text-foreground">{item.label}</dt>
          <dd>{item.dateTime ? <time dateTime={item.dateTime}>{item.value}</time> : item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export { CmsPageMeta };
