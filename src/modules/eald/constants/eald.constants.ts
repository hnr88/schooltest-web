import type { EaldNavLink, EaldFooterColumn, NextSectionCard, SubskillBar } from '@/modules/eald/types/eald.types';

const EALD_NAV_LINKS: readonly EaldNavLink[] = [
  { href: '/eald', key: 'nav.overview', page: 'home' },
  { href: '/eald/diagnose', key: 'nav.diagnose', page: 'diagnose' },
  { href: '/eald/teach', key: 'nav.teach', page: 'teach' },
  { href: '/eald/track', key: 'nav.track', page: 'track' },
  { href: '/eald/predict', key: 'nav.predict', page: 'predict' },
  { href: '/eald#evidence', key: 'nav.evidence' },
] as const;

// Home v2:347–379. The design's four link columns behind the brand column.
// Every pre-existing href and label key survives the reshuffle (C-LEG-02:
// the four legal routes must never regress to a placeholder) — only the
// column grouping changes, and the two headings the design introduces get
// the new forSchoolsTitle/aboutTitle keys. Accessibility (design :375) is
// deferred per D-05: its design href is the `#register` placeholder and no
// accessibility statement exists.
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
    titleKey: 'Eald.footer.forSchoolsTitle',
    links: [
      { href: '/eald#register', labelKey: 'Eald.footer.foundingPilot' },
      // `/eald#evidence` is the anchor task 07 puts on the home progress
      // chart — the same destination the masthead's Evidence base link uses.
      { href: '/eald#evidence', labelKey: 'Eald.footer.evidenceBase' },
      { href: '/eald#register', labelKey: 'Eald.footer.testAdministration' },
      { href: '/dashboard/search', labelKey: 'Eald.footer.schoolSearch' },
    ],
  },
  // Home v2:371–379 "About". All four C-LEG-02 legal routes land here:
  // privacy/terms under the design's own labels, cookie/GDPR keeping their
  // Navigation.* keys (D-02 — the old labels stay in the catalogues).
  {
    titleKey: 'Eald.footer.aboutTitle',
    links: [
      { href: '/eald#register', labelKey: 'Eald.footer.contact' },
      { href: '/privacy-policy', labelKey: 'Eald.footer.privacyStatement' },
      { href: '/terms-of-service', labelKey: 'Eald.footer.termsOfUse' },
      { href: '/cookie-policy', labelKey: 'Navigation.cookiePolicy' },
      { href: '/gdpr', labelKey: 'Navigation.gdpr' },
    ],
  },
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

// "Page last updated" (Home v2:385): the copy's own date as epoch ms, bumped
// with the copy and rendered through next-intl's formatter per locale (PRD
// A8). Deliberately NOT a request-time clock.
const PAGE_LAST_UPDATED = Date.parse('2026-08-31');

export {
  EALD_NAV_LINKS,
  EALD_FOOTER_COLUMNS,
  DIAGNOSE_NEXT_SECTIONS,
  TEACH_NEXT_SECTIONS,
  TRACK_NEXT_SECTIONS,
  PREDICT_NEXT_SECTIONS,
  DIAGNOSE_SUBSKILLS,
  PAGE_LAST_UPDATED,
};
