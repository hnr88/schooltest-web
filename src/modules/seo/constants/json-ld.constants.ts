/**
 * Facts the structured data may state about the publisher and the product.
 * Every entry is backed by something in the repo; an empty list means "none
 * verified yet" and the builder then omits the property instead of guessing.
 */
export const ORGANIZATION_SAME_AS: readonly string[] = [];

/** The public "Contact the programme team" link on every landing page targets the register form. */
export const CONTACT_ANCHOR = '#register';

export const AREA_SERVED = 'Australia';
export const AREA_SERVED_CODE = 'AU';

/** electron-builder.yml ships the student app for these three targets; teachers use the browser. */
export const DESKTOP_OPERATING_SYSTEMS = 'macOS, Windows, Linux';
export const BROWSER_REQUIREMENTS = 'A current web browser for the teacher and school portal';

/** The date printed in every landing page footer ("Page last updated 31 August 2026"). */
export const LANDING_LAST_UPDATED = '2026-08-31';

/** CSS selectors the speakable block points at: the page's H1 and its answer-first summary. */
export const SPEAKABLE_SELECTORS: readonly string[] = ['h1', '[data-speakable="summary"]'];

/** Stable fragment ids. Site-level ids hang off the root URL so they never change per locale. */
export const JSON_LD_FRAGMENT = {
  organization: '#organization',
  website: '#website',
  logo: '#logo',
  software: '#software',
  webpage: '#webpage',
  breadcrumb: '#breadcrumb',
  primaryImage: '#primaryimage',
  service: '#service',
  howTo: '#howto',
  article: '#article',
} as const;
