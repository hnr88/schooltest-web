import { routing } from '@/i18n/routing';
import {
  AREA_SERVED,
  BROWSER_REQUIREMENTS,
  DESKTOP_OPERATING_SYSTEMS,
} from '@/modules/seo/constants/json-ld.constants';
import { pageIds, siteIds } from '@/modules/seo/lib/json-ld-ids';
import type {
  FaqEntry,
  HowToInput,
  ServiceInput,
  SoftwareApplicationInput,
} from '@/modules/seo/types/json-ld-input.types';
import type {
  EducationalAudienceNode,
  HowToNode,
  QuestionNode,
  ServiceNode,
  SoftwareApplicationNode,
} from '@/modules/seo/types/json-ld.types';

const AUDIENCE: readonly EducationalAudienceNode[] = [
  { '@type': 'EducationalAudience', educationalRole: 'teacher', audienceType: 'EAL/D teachers' },
  { '@type': 'EducationalAudience', educationalRole: 'administrator', audienceType: 'School leaders' },
];

/** Question nodes for a page's VISIBLE FAQ; the caller renders the same entries. */
export function buildFaqQuestionNodes(
  entries: readonly FaqEntry[],
  pathname: string,
  locale: string,
): QuestionNode[] {
  const ids = pageIds(pathname, locale);
  return entries.map((entry) => ({
    '@type': 'Question',
    '@id': ids.question(entry.key),
    name: entry.question,
    inLanguage: locale,
    acceptedAnswer: { '@type': 'Answer', text: entry.answer },
  }));
}

/** HowTo for a step flow the page shows as an ordered list; each step anchors to its <li>. */
export function buildHowToJsonLd({ pathname, locale, name, description, steps }: HowToInput): HowToNode {
  const ids = pageIds(pathname, locale);
  return {
    '@type': 'HowTo',
    '@id': ids.howTo,
    name,
    description,
    inLanguage: locale,
    isPartOf: { '@id': ids.webpage },
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${ids.url}#step-${step.key}`,
    })),
  };
}

/** One product capability (diagnose, teach, …) as a Service the Organization provides. */
export function buildServiceJsonLd({
  pathname,
  locale,
  name,
  description,
  serviceType,
}: ServiceInput): ServiceNode {
  const site = siteIds();
  const ids = pageIds(pathname, locale);
  return {
    '@type': 'Service',
    '@id': ids.service,
    name,
    description,
    serviceType,
    url: ids.url,
    provider: { '@id': site.organization },
    areaServed: { '@type': 'Country', name: AREA_SERVED },
    audience: AUDIENCE,
    isRelatedTo: { '@id': site.software },
  };
}

/**
 * The platform itself. No `offers`, `aggregateRating` or `review`: there is no
 * public price list and no rating source, and inventing either is forbidden.
 */
export function buildSoftwareApplicationJsonLd({
  siteName,
  description,
  featureList,
}: SoftwareApplicationInput): SoftwareApplicationNode {
  const site = siteIds();
  return {
    '@type': ['SoftwareApplication', 'WebApplication'],
    '@id': site.software,
    name: siteName,
    description,
    url: site.root,
    applicationCategory: 'EducationalApplication',
    operatingSystem: DESKTOP_OPERATING_SYSTEMS,
    browserRequirements: BROWSER_REQUIREMENTS,
    publisher: { '@id': site.organization },
    audience: AUDIENCE,
    inLanguage: [...routing.locales],
    featureList,
  };
}
