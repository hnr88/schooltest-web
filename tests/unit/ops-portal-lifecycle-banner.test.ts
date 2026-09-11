import { describe, expect, it, vi } from 'vitest';

import { resolveBannerCtaProxy } from '@/modules/ops/components/OpsSchoolLifecycleBanner';
import { portalLifecycleBanner } from '@/modules/ops/lib/portal-lifecycle.lib';
import type { PortalLifecycleBannerCta } from '@/modules/ops/lib/portal-lifecycle.lib';
import type { PortalStatus } from '@schooltest/ops-contracts';

const NO_DATES = {
  trialEndsAtDisplay: null,
  retentionUntilDisplay: null,
  suspendedIntervalDisplay: null,
};

function bannerFor(status: PortalStatus, readOnly = false, canResendOwnerInvite = false) {
  return portalLifecycleBanner({ status, readOnly, canResendOwnerInvite, ...NO_DATES });
}

describe('portalLifecycleBanner precedence', () => {
  it('active carries no banner — a healthy school has no standing notice', () => {
    expect(bannerFor('active')).toBeNull();
  });

  it('renders the design-precedence tone, title and body key for each of the five statuses', () => {
    expect(bannerFor('trial')).toMatchObject({
      kind: 'lifecycle',
      tone: 'info',
      titleKey: 'banner.trial.title',
      bodyKey: 'banner.trial.body',
      cta: { kind: 'activate', labelKey: 'actions.activate', write: true },
    });
    expect(bannerFor('pending_setup', false, true)).toMatchObject({
      kind: 'lifecycle',
      tone: 'warning',
      titleKey: 'banner.pending_setup.title',
      bodyKey: 'banner.pending_setup.body',
      cta: { kind: 'resendOwnerInvite', labelKey: 'banner.pending_setup.cta', write: true },
    });
    expect(bannerFor('suspended')).toMatchObject({
      kind: 'lifecycle',
      tone: 'error',
      titleKey: 'banner.suspended.title',
      bodyKey: 'banner.suspended.body',
      cta: { kind: 'reactivate', labelKey: 'actions.reactivate', write: true },
    });
    expect(bannerFor('archived')).toMatchObject({
      kind: 'lifecycle',
      tone: 'warning',
      titleKey: 'banner.archived.title',
      bodyKey: 'banner.archived.body',
      cta: { kind: 'restore', labelKey: 'actions.restore', write: true },
    });
  });

  it('a pending_setup school WITHOUT a resendable owner invite gets no CTA — the server 409s that resend', () => {
    // onboarding never started (no invitation, no contact) or already submitted:
    // `onboardingEligibility().canResend` is false, so the banner stands alone
    // instead of offering a write the API refuses (sweep finding, 2026-09-11).
    expect(bannerFor('pending_setup', false, false)).toMatchObject({
      kind: 'lifecycle',
      tone: 'warning',
      titleKey: 'banner.pending_setup.title',
      bodyKey: 'banner.pending_setup.body',
      cta: null,
    });
  });

  it('the resend gate is pending_setup-specific: every other CTA mounts regardless of it', () => {
    expect(bannerFor('trial', false, false)).toMatchObject({ cta: { kind: 'activate' } });
    expect(bannerFor('suspended', false, false)).toMatchObject({ cta: { kind: 'reactivate' } });
    expect(bannerFor('archived', false, false)).toMatchObject({ cta: { kind: 'restore' } });
  });

  it('the read-only session outranks every one of the four lifecycle banners', () => {
    for (const status of ['trial', 'pending_setup', 'suspended', 'archived', 'active'] as const) {
      expect(bannerFor(status, true)).toEqual({ kind: 'read-only', tone: 'info' });
    }
  });

  it('every lifecycle CTA is a write action; the read-only banner carries none at all', () => {
    for (const status of ['trial', 'pending_setup', 'suspended', 'archived'] as const) {
      const banner = bannerFor(status, false, status === 'pending_setup');
      expect(banner?.kind).toBe('lifecycle');
      if (banner?.kind === 'lifecycle') expect(banner.cta?.write).toBe(true);
    }
    const readOnly = bannerFor('active', true);
    expect(readOnly).not.toHaveProperty('cta');
  });

  it('interpolates the real trial end date, and never "in null days" when it is absent', () => {
    const withDate = portalLifecycleBanner({
      status: 'trial',
      readOnly: false,
      canResendOwnerInvite: false,
      ...NO_DATES,
      trialEndsAtDisplay: '16 Sep 2026',
    });
    expect(withDate).toMatchObject({
      bodyKey: 'banner.trial.bodyWithDate',
      bodyValues: { date: '16 Sep 2026' },
    });

    const withoutDate = bannerFor('trial');
    expect(withoutDate).toMatchObject({ bodyKey: 'banner.trial.body' });
    expect(withoutDate && 'bodyValues' in withoutDate ? withoutDate.bodyValues : undefined).toBeUndefined();
  });

  it('interpolates the real retention date for the archived banner', () => {
    const withDate = portalLifecycleBanner({
      status: 'archived',
      readOnly: false,
      canResendOwnerInvite: false,
      ...NO_DATES,
      retentionUntilDisplay: '1 Feb 2028',
    });
    expect(withDate).toMatchObject({
      bodyKey: 'banner.archived.bodyWithDate',
      bodyValues: { date: '1 Feb 2028' },
    });
    expect(bannerFor('archived')).toMatchObject({ bodyKey: 'banner.archived.body' });
  });

  it('interpolates the real suspended interval, formatted client-side', () => {
    const withInterval = portalLifecycleBanner({
      status: 'suspended',
      readOnly: false,
      canResendOwnerInvite: false,
      ...NO_DATES,
      suspendedIntervalDisplay: '6 wk. ago',
    });
    expect(withInterval).toMatchObject({
      bodyKey: 'banner.suspended.bodyWithInterval',
      bodyValues: { interval: '6 wk. ago' },
    });
    expect(bannerFor('suspended')).toMatchObject({ bodyKey: 'banner.suspended.body' });
  });
});

describe('resolveBannerCtaProxy — the no-target failure must report, not no-op', () => {
  const RESTORE_CTA: PortalLifecycleBannerCta = { kind: 'restore', labelKey: 'actions.restore', write: true };
  const RESEND_CTA: PortalLifecycleBannerCta = {
    kind: 'resendOwnerInvite',
    labelKey: 'banner.pending_setup.cta',
    write: true,
  };

  it('clicks the proxy target when the header button is mounted', () => {
    const click = vi.fn();
    const outcome = resolveBannerCtaProxy(RESTORE_CTA, () => ({ click }));
    expect(outcome).toBe('clicked');
    expect(click).toHaveBeenCalledOnce();
  });

  it('reports "not-found" instead of silently no-oping when the proxy target is missing', () => {
    const outcome = resolveBannerCtaProxy(RESTORE_CTA, () => null);
    expect(outcome).toBe('not-found');
  });

  it('never queries a proxy target for the resend CTA — it runs its own mutation', () => {
    const findTarget = vi.fn(() => null);
    const outcome = resolveBannerCtaProxy(RESEND_CTA, findTarget);
    expect(outcome).toBe('resend');
    expect(findTarget).not.toHaveBeenCalled();
  });
});
