import { getTranslations } from 'next-intl/server';

import {
  AEO_FAQ_KEYS,
  DIAGNOSTIC_HOW_TO_STEP_KEYS,
  SOFTWARE_FEATURE_KEYS,
} from '@/modules/seo/constants/aeo.constants';
import type {
  AeoFaqContent,
  AeoHowToContent,
  AeoPage,
  AeoServiceContent,
  AeoServicePage,
} from '@/modules/seo/types/aeo.types';

/** The translated visible FAQ for a public page; the same entries feed its FAQPage JSON-LD. */
export async function getAeoFaq(locale: string, page: AeoPage): Promise<AeoFaqContent> {
  const t = await getTranslations({ locale, namespace: 'Aeo' });
  return {
    heading: t('faqHeading'),
    intro: t('faqIntro'),
    entries: AEO_FAQ_KEYS[page].map((key) => ({
      key,
      question: t(`${page}.faq.${key}.q`),
      answer: t(`${page}.faq.${key}.a`),
    })),
  };
}

export async function getDiagnosticHowTo(locale: string): Promise<AeoHowToContent> {
  const t = await getTranslations({ locale, namespace: 'Aeo.diagnose.howTo' });
  return {
    heading: t('heading'),
    intro: t('intro'),
    steps: DIAGNOSTIC_HOW_TO_STEP_KEYS.map((key) => ({
      key,
      name: t(`steps.${key}.name`),
      text: t(`steps.${key}.text`),
    })),
  };
}

export async function getAeoService(locale: string, page: AeoServicePage): Promise<AeoServiceContent> {
  const t = await getTranslations({ locale, namespace: 'Aeo' });
  return { name: t(`${page}.serviceName`), serviceType: t(`${page}.serviceType`) };
}

export async function getSoftwareContent(
  locale: string,
): Promise<{ description: string; featureList: string[] }> {
  const t = await getTranslations({ locale, namespace: 'Aeo' });
  return {
    description: t('softwareDescription'),
    featureList: SOFTWARE_FEATURE_KEYS.map((key) => t(`features.${key}`)),
  };
}
