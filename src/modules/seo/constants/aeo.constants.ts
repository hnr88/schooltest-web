import type { AeoPage } from '@/modules/seo/types/aeo.types';

/** Visible FAQ entries per public page, in display order. Keys are `Aeo.<page>.faq.<key>` in every locale. */
export const AEO_FAQ_KEYS: Readonly<Record<AeoPage, readonly string[]>> = {
  home: ['what', 'who', 'skills', 'duration', 'delivery', 'results', 'availability', 'privacy'],
  diagnose: ['shows', 'placement', 'when', 'length'],
  teach: ['how', 'names', 'withoutAi', 'ask'],
  track: ['often', 'scale', 'class', 'teaching'],
  predict: ['what', 'decision', 'cohort'],
  report: ['audiences', 'sending', 'format', 'families'],
};

/** The "how does a school start a diagnostic" flow on /diagnose (`Aeo.diagnose.howTo.steps.<key>`). */
export const DIAGNOSTIC_HOW_TO_STEP_KEYS: readonly string[] = [
  'register',
  'onboard',
  'roster',
  'sitting',
  'sit',
  'results',
];

/** SoftwareApplication.featureList entries (`Aeo.features.<key>`). */
export const SOFTWARE_FEATURE_KEYS: readonly string[] = [
  'diagnose',
  'subskills',
  'track',
  'predict',
  'report',
  'export',
];
