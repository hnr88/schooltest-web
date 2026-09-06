import type { PortalPlan, PortalStatus } from '@schooltest/ops-contracts';

import type { BadgeProps } from '@/modules/design-system';

/**
 * The ONE portal-lifecycle presentation, shared by the schools directory and
 * the school detail page.
 *
 * The server already guarantees both surfaces resolve the same `portal_status`
 * (contracts `resolvePortalStatus`); this is the other half of that guarantee —
 * one status must also read the same and look the same wherever it is shown.
 * Before this existed the list rendered portal labels while the detail rendered
 * legacy `account_status` badges, so one school could read "Trial" on the list
 * and "Active" on its own page.
 *
 * Labels are NOT written here: they are i18n keys under `Ops.schools`, so the
 * design's exact words — All schools / Active / Trial / Pending setup /
 * Suspended / Archived, Pilot / Standard / Enterprise — live in one catalogue.
 */
export function portalStatusLabelKey(status: PortalStatus): string {
  return `portalStatus.${status}`;
}

export function portalPlanLabelKey(plan: PortalPlan): string {
  return `portalPlan.${plan}`;
}

/** Badge tone per lifecycle state. Status is never conveyed by colour alone —
 *  every badge carries its label too; the tone only reinforces it. */
export const PORTAL_STATUS_VARIANTS: Record<PortalStatus, BadgeProps['variant']> = {
  active: 'success',
  trial: 'accent',
  pending_setup: 'warning',
  suspended: 'error',
  archived: 'secondary',
};

/** Which lifecycle states warrant the detail page's banner, and in what tone. */
const BANNER_STATES: Partial<Record<PortalStatus, 'info' | 'warning' | 'error'>> = {
  trial: 'info',
  pending_setup: 'warning',
  suspended: 'error',
  archived: 'warning',
};

export interface PortalLifecycleBanner {
  tone: 'info' | 'warning' | 'error';
  /** i18n key under `Ops.detail` for the banner title. */
  titleKey: string;
  /** i18n key under `Ops.detail` for the body. */
  bodyKey: string;
}

/**
 * The banner for a lifecycle state, or null when the state needs none.
 *
 * `active` deliberately has no banner: a healthy school should not carry a
 * standing notice, and the design draws none.
 */
export function portalLifecycleBanner(status: PortalStatus): PortalLifecycleBanner | null {
  const tone = BANNER_STATES[status];
  if (tone === undefined) return null;
  return {
    tone,
    titleKey: `banner.${status}.title`,
    bodyKey: `banner.${status}.body`,
  };
}
