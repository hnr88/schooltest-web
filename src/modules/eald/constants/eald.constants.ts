import type { EaldNavLink, EaldFooterColumn, NextSectionCard, SubskillBar } from '@/modules/eald/types/eald.types';

const EALD_NAV_LINKS: readonly EaldNavLink[] = [
  { href: '/eald/diagnose', key: 'nav.diagnose', page: 'diagnose' },
  { href: '/eald/teach', key: 'nav.teach', page: 'teach' },
  { href: '/eald/track', key: 'nav.track', page: 'track' },
  { href: '/eald/predict', key: 'nav.predict', page: 'predict' },
] as const;

const EALD_FOOTER_COLUMNS: readonly EaldFooterColumn[] = [
  {
    titleKey: 'Eald.footer.productTitle',
    links: [
      { href: '/eald/diagnose', labelKey: 'Eald.footer.diagnose' },
      { href: '/eald/teach', labelKey: 'Eald.footer.teach' },
      { href: '/eald/track', labelKey: 'Eald.footer.track' },
      { href: '/eald/predict', labelKey: 'Eald.footer.predict' },
    ],
  },
  {
    titleKey: 'Eald.footer.moreTitle',
    links: [
      { href: '/dashboard/search', labelKey: 'Eald.footer.schoolSearch' },
      { href: '/#register', labelKey: 'Eald.footer.foundingPilot' },
      { href: '/#register', labelKey: 'Eald.footer.contact' },
    ],
  },
  // C-LEG-02 (mission st-legal-seo-ops, task 206). Replaces the single
  // `/privacy` entry, which pointed at a route that never existed and 404'd.
  {
    titleKey: 'Eald.footer.legalTitle',
    links: [
      { href: '/privacy-policy', labelKey: 'Navigation.privacyPolicy' },
      { href: '/terms-of-service', labelKey: 'Navigation.termsOfService' },
      { href: '/cookie-policy', labelKey: 'Navigation.cookiePolicy' },
      { href: '/gdpr', labelKey: 'Navigation.gdpr' },
    ],
  },
] as const;

/** The legal links the public header and mobile nav expose (C-LEG-02). */
export const EALD_LEGAL_LINKS: readonly { readonly href: string; readonly labelKey: string }[] = [
  { href: '/privacy-policy', labelKey: 'Navigation.privacyPolicy' },
  { href: '/terms-of-service', labelKey: 'Navigation.termsOfService' },
  { href: '/cookie-policy', labelKey: 'Navigation.cookiePolicy' },
  { href: '/gdpr', labelKey: 'Navigation.gdpr' },
];

const EALD_TRUSTED_SCHOOLS = [
  'trustedBy.one',
  'trustedBy.two',
  'trustedBy.three',
] as const;

const DIAGNOSE_NEXT_SECTIONS: readonly NextSectionCard[] = [
  { number: '02', titleKey: 'shared.nextTeachTitle', descriptionKey: 'shared.nextTeachDescription', href: '/eald/teach' },
  { number: '03', titleKey: 'shared.nextTrackTitle', descriptionKey: 'shared.nextTrackDescription', href: '/eald/track' },
  { number: '04', titleKey: 'shared.nextPredictTitle', descriptionKey: 'shared.nextPredictDescription', href: '/eald/predict' },
] as const;

const TEACH_NEXT_SECTIONS: readonly NextSectionCard[] = [
  { number: '01', titleKey: 'shared.nextDiagnoseTitle', descriptionKey: 'shared.nextDiagnoseDescription', href: '/eald/diagnose' },
  { number: '03', titleKey: 'shared.nextTrackTitle', descriptionKey: 'shared.nextTrackDescription', href: '/eald/track' },
  { number: '04', titleKey: 'shared.nextPredictTitle', descriptionKey: 'shared.nextPredictDescription', href: '/eald/predict' },
] as const;

const TRACK_NEXT_SECTIONS: readonly NextSectionCard[] = [
  { number: '01', titleKey: 'shared.nextDiagnoseTitle', descriptionKey: 'shared.nextDiagnoseDescription', href: '/eald/diagnose' },
  { number: '02', titleKey: 'shared.nextTeachTitle', descriptionKey: 'shared.nextTeachDescription', href: '/eald/teach' },
  { number: '04', titleKey: 'shared.nextPredictTitle', descriptionKey: 'shared.nextPredictDescription', href: '/eald/predict' },
] as const;

const PREDICT_NEXT_SECTIONS: readonly NextSectionCard[] = [
  { number: '01', titleKey: 'shared.nextDiagnoseTitle', descriptionKey: 'shared.nextDiagnoseDescription', href: '/eald/diagnose' },
  { number: '02', titleKey: 'shared.nextTeachTitle', descriptionKey: 'shared.nextTeachDescription', href: '/eald/teach' },
  { number: '03', titleKey: 'shared.nextTrackTitle', descriptionKey: 'shared.nextTrackDescription', href: '/eald/track' },
] as const;

const DIAGNOSE_SUBSKILLS: readonly SubskillBar[] = [
  { labelKey: 'diagnose.profile.decoding', percent: 88, phaseKey: 'diagnose.profile.phaseConsolidating', phase: 'consolidating' },
  { labelKey: 'diagnose.profile.vocabulary', percent: 32, phaseKey: 'diagnose.profile.phaseBeginning', phase: 'beginning' },
  { labelKey: 'diagnose.profile.grammar', percent: 68, phaseKey: 'diagnose.profile.phaseDeveloping', phase: 'developing' },
  { labelKey: 'diagnose.profile.gist', percent: 78, phaseKey: 'diagnose.profile.phaseDeveloping', phase: 'developing' },
  { labelKey: 'diagnose.profile.detail', percent: 42, phaseKey: 'diagnose.profile.phaseEmerging', phase: 'emerging' },
  { labelKey: 'diagnose.profile.inference', percent: 38, phaseKey: 'diagnose.profile.phaseEmerging', phase: 'emerging' },
  { labelKey: 'diagnose.profile.critical', percent: 20, phaseKey: 'diagnose.profile.phaseBeginning', phase: 'beginning' },
] as const;

export {
  EALD_NAV_LINKS,
  EALD_FOOTER_COLUMNS,
  EALD_TRUSTED_SCHOOLS,
  DIAGNOSE_NEXT_SECTIONS,
  TEACH_NEXT_SECTIONS,
  TRACK_NEXT_SECTIONS,
  PREDICT_NEXT_SECTIONS,
  DIAGNOSE_SUBSKILLS,
};
