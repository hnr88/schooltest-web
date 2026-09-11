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

/**
 * The banner's call-to-action. It is always a write, and it always runs
 * through the ops action kit (`useOpsActionRunner` / `useOpsWriteGate`) so the
 * gate, the confirm dialog and the toast are INHERITED rather than
 * re-implemented here — `restore`/`reactivate`/`activate` proxy the identical
 * primary action `OpsSchoolSuspendPanel` already renders in the header
 * (`data-action="primary-<kind>"`), and `resendOwnerInvite` borrows
 * `OpsSchoolInvitationPanel`'s own resend mutation (C-OPS-PORTAL-012).
 */
export type PortalLifecycleBannerCtaKind = 'restore' | 'reactivate' | 'activate' | 'resendOwnerInvite';

export interface PortalLifecycleBannerCta {
  kind: PortalLifecycleBannerCtaKind;
  /** i18n key under `Ops.detail` for the CTA's visible label. */
  labelKey: string;
  /** Always true — recorded so callers can assert it rather than assume it. */
  write: true;
}

/**
 * A read-only (`ops_support`) session outranks every lifecycle banner
 * (`logic.md#c-banner`), and carries no CTA at all: nothing here can be
 * written anyway. Its copy is not a titleKey/bodyKey pair — the caller reuses
 * `OpsPortalCapabilities`' own `readOnlyTitle`/`readOnlyBody` verbatim so a
 * support session reads the identical words in both places.
 */
export interface PortalLifecycleReadOnlyBanner {
  kind: 'read-only';
  tone: 'info';
}

export interface PortalLifecycleStatusBanner {
  kind: 'lifecycle';
  tone: 'info' | 'warning' | 'error';
  /** i18n key under `Ops.detail` for the banner title. */
  titleKey: string;
  /** i18n key under `Ops.detail` for the body. */
  bodyKey: string;
  /** Interpolation for `bodyKey`, present only when it takes a value. */
  bodyValues?: Record<string, string>;
  cta: PortalLifecycleBannerCta | null;
}

export type PortalLifecycleBanner = PortalLifecycleReadOnlyBanner | PortalLifecycleStatusBanner;

/** The header's exact CTA labels, reused verbatim (D-33) rather than re-worded. */
const LIFECYCLE_CTA: Record<'archived' | 'suspended' | 'trial', PortalLifecycleBannerCta> = {
  archived: { kind: 'restore', labelKey: 'actions.restore', write: true },
  suspended: { kind: 'reactivate', labelKey: 'actions.reactivate', write: true },
  trial: { kind: 'activate', labelKey: 'actions.activate', write: true },
};

const PENDING_SETUP_CTA: PortalLifecycleBannerCta = {
  kind: 'resendOwnerInvite',
  labelKey: 'banner.pending_setup.cta',
  write: true,
};

export interface PortalLifecycleBannerInput {
  status: PortalStatus;
  /** True for an `ops_support` session — outranks every status arm below. */
  readOnly: boolean;
  /** The school actually holds a resendable owner invitation (`link_sent` +
   * stored contact — `onboardingEligibility().canResend`). The server 409s a
   * resend for a pending_setup school that has no invitation, so the
   * pending_setup CTA only mounts when this is true (C-OPS-PORTAL-012). */
  canResendOwnerInvite: boolean;
  /** Pre-formatted for the active locale; null when the column has no value. */
  trialEndsAtDisplay: string | null;
  retentionUntilDisplay: string | null;
  /** A pre-formatted relative interval (`relative-time.ts`), e.g. "6 wk. ago". */
  suspendedIntervalDisplay: string | null;
}

/**
 * The banner for the current session and lifecycle state, or null when
 * neither needs one. Precedence is the design's (`logic.md#c-banner`):
 *
 *   read-only  >  archived  >  suspended  >  pending_setup  >  trial  >  none
 *
 * `active` deliberately has no banner: a healthy school should not carry a
 * standing notice, and the design draws none. Callers suppress the whole
 * result while the detail query is pending or errored — a banner about a
 * school that has not loaded is a lie the design never draws either.
 */
export function portalLifecycleBanner({
  status,
  readOnly,
  canResendOwnerInvite,
  trialEndsAtDisplay,
  retentionUntilDisplay,
  suspendedIntervalDisplay,
}: PortalLifecycleBannerInput): PortalLifecycleBanner | null {
  if (readOnly) return { kind: 'read-only', tone: 'info' };

  const tone = BANNER_STATES[status];
  if (tone === undefined) return null;

  if (status === 'archived') {
    return {
      kind: 'lifecycle',
      tone,
      titleKey: 'banner.archived.title',
      bodyKey: retentionUntilDisplay === null ? 'banner.archived.body' : 'banner.archived.bodyWithDate',
      bodyValues: retentionUntilDisplay === null ? undefined : { date: retentionUntilDisplay },
      cta: LIFECYCLE_CTA.archived,
    };
  }

  if (status === 'suspended') {
    return {
      kind: 'lifecycle',
      tone,
      titleKey: 'banner.suspended.title',
      bodyKey:
        suspendedIntervalDisplay === null ? 'banner.suspended.body' : 'banner.suspended.bodyWithInterval',
      bodyValues: suspendedIntervalDisplay === null ? undefined : { interval: suspendedIntervalDisplay },
      cta: LIFECYCLE_CTA.suspended,
    };
  }

  if (status === 'pending_setup') {
    return {
      kind: 'lifecycle',
      tone,
      titleKey: 'banner.pending_setup.title',
      bodyKey: 'banner.pending_setup.body',
      // "Resend owner invite" is only truthful for a school that HAS an owner
      // invitation on the wire; without one the server 409s the resend, so the
      // banner stands without a CTA (the invitation panel owns send/revoke).
      cta: canResendOwnerInvite ? PENDING_SETUP_CTA : null,
    };
  }

  // trial — the only remaining arm `BANNER_STATES` declares.
  return {
    kind: 'lifecycle',
    tone,
    titleKey: 'banner.trial.title',
    bodyKey: trialEndsAtDisplay === null ? 'banner.trial.body' : 'banner.trial.bodyWithDate',
    bodyValues: trialEndsAtDisplay === null ? undefined : { date: trialEndsAtDisplay },
    cta: LIFECYCLE_CTA.trial,
  };
}
