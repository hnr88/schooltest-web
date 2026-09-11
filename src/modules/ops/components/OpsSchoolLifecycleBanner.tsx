'use client';

import { useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { PortalStatus } from '@schooltest/ops-contracts';

import { Alert, Button } from '@/modules/design-system';
import { showOpsToast, useOpsWriteGate } from '@/modules/ops/actions';
import {
  CAPABILITIES_COPY,
  CAPABILITIES_TRANSLATION_NAMESPACE,
  type CapabilitiesCopyKey,
} from '@/modules/ops/constants/capabilities.constants';
import {
  portalLifecycleBanner,
  type PortalLifecycleBannerCta,
  type PortalLifecycleBannerCtaKind,
} from '@/modules/ops/lib/portal-lifecycle.lib';
import { formatRelativeTime } from '@/modules/ops/lib/relative-time';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import {
  isResendCooldownFailure,
  useResendInvitationMutation,
} from '@/modules/ops/queries/use-resend-invitation.mutation';

export interface OpsSchoolLifecycleBannerProps {
  documentId: string;
  schoolName: string;
  status: PortalStatus;
  trialEndsAt: string | null;
  retentionUntil: string | null;
  suspendedAt: string | null;
  enabled: boolean; // gates the capabilities read, mirrors the caller's auth guard
}

/** A restore/reactivate/activate CTA's outcome — "not-found" is testable without a DOM harness. */
export type BannerCtaProxyOutcome = 'clicked' | 'resend' | 'not-found';

/** Resolves a CTA against its proxy target (the header's primary button), or
 *  flags resend. `findTarget` is injected so this is provable without `document`. */
export function resolveBannerCtaProxy(
  cta: PortalLifecycleBannerCta,
  findTarget: (
    kind: Exclude<PortalLifecycleBannerCtaKind, 'resendOwnerInvite'>,
  ) => { click: () => void } | null,
): BannerCtaProxyOutcome {
  if (cta.kind === 'resendOwnerInvite') return 'resend';
  const target = findTarget(cta.kind);
  if (target === null) return 'not-found';
  target.click();
  return 'clicked';
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

function formatDate(locale: string, value: string | null): string | null {
  return value ? new Intl.DateTimeFormat(locale, DATE_FORMAT).format(new Date(value)) : null;
}

/** The school-detail lifecycle banner (task 11): precedence, copy and its
 *  single CTA — a write run through the ops action kit (restore/reactivate/
 *  activate proxy the header's primary button; resend runs its own mutation). */
export function OpsSchoolLifecycleBanner({
  documentId,
  schoolName,
  status,
  trialEndsAt,
  retentionUntil,
  suspendedAt,
  enabled,
}: OpsSchoolLifecycleBannerProps) {
  const t = useTranslations('Ops.detail');
  const tOnboard = useTranslations('Ops.onboard'); // reuses resendSuccess verbatim (D-33)
  const tCapabilities = useTranslations(CAPABILITIES_TRANSLATION_NAMESPACE); // reuses read-only copy
  const locale = useLocale();
  const capabilities = useCapabilitiesQuery(enabled);
  const writeGate = useOpsWriteGate();
  const resendOwnerInvite = useResendInvitationMutation();
  const lastResendAtRef = useRef<number | null>(null); // logic.md#c-resend's 60s client cooldown

  const isReadOnly = capabilities.data?.capabilities.write === false;
  const capabilitiesCopy = (key: CapabilitiesCopyKey): string =>
    tCapabilities.has(key) ? tCapabilities(key) : CAPABILITIES_COPY[key];

  const banner = portalLifecycleBanner({
    status,
    readOnly: isReadOnly,
    trialEndsAtDisplay: formatDate(locale, trialEndsAt),
    retentionUntilDisplay: formatDate(locale, retentionUntil),
    suspendedIntervalDisplay: suspendedAt ? formatRelativeTime(suspendedAt, new Date(), locale) : null,
  });

  if (banner === null) return null;

  const runResendOwnerInvite = async () => {
    const last = lastResendAtRef.current;
    if (last !== null && Date.now() - last < 60_000) {
      showOpsToast({
        tone: 'warn',
        message: t('banner.pending_setup.resendCooldown', { name: schoolName }),
      });
      return;
    }
    try {
      const result = await resendOwnerInvite.mutateAsync(documentId);
      lastResendAtRef.current = Date.now();
      showOpsToast({ tone: 'ok', message: tOnboard('resendSuccess', { email: result.contact.email }) });
    } catch (error) {
      if (isResendCooldownFailure(error)) {
        lastResendAtRef.current = Date.now();
        showOpsToast({
          tone: 'warn',
          message: t('banner.pending_setup.resendCooldown', { name: schoolName }),
        });
        return;
      }
      showOpsToast({ tone: 'error', message: t('actions.error') });
    }
  };

  const runBannerCta = (cta: PortalLifecycleBannerCta) => {
    const blocked = writeGate.blockedReason();
    if (blocked !== null) {
      showOpsToast({ tone: 'error', message: blocked });
      return;
    }
    const outcome = resolveBannerCtaProxy(cta, (kind) =>
      document.querySelector<HTMLButtonElement>(`[data-action="primary-${kind}"]`),
    );
    if (outcome === 'resend') {
      void runResendOwnerInvite();
      return;
    }
    if (outcome === 'not-found') {
      // Missing proxy target: a silent no-op would reach acceptance undetected (OP-4).
      showOpsToast({ tone: 'error', message: t('actions.error') });
    }
  };

  if (banner.kind === 'read-only') {
    return (
      <div data-slot="ops-school-banner" data-banner="read-only">
        <Alert variant={banner.tone} title={capabilitiesCopy('readOnlyTitle')}>
          {capabilitiesCopy('readOnlyBody')}
        </Alert>
      </div>
    );
  }

  return (
    <div data-slot="ops-school-banner" data-banner={status}>
      <Alert
        variant={banner.tone}
        title={t(banner.titleKey)}
        action={
          banner.cta === null ? undefined : (
            <BannerCtaButton
              cta={banner.cta}
              tone={banner.tone}
              isReadOnly={isReadOnly}
              onRun={runBannerCta}
              label={t(banner.cta.labelKey)}
            />
          )
        }
      >
        {t(banner.bodyKey, banner.bodyValues)}
      </Alert>
    </div>
  );
}

/** Design 227: CTA = 38px white pill, border/ink in the banner's tone colour. */
const CTA_TONE_CLASSES: Record<string, string> = {
  info: 'border-blue-600 text-blue-700',
  warning: 'border-amber-600 text-amber-700',
  error: 'border-red-600 text-red-600',
};

/** The banner's single CTA — greyed with a refusal in a support session. */
function BannerCtaButton({
  cta,
  tone,
  isReadOnly,
  label,
  onRun,
}: {
  cta: PortalLifecycleBannerCta;
  tone: string;
  isReadOnly: boolean;
  label: string;
  onRun: (cta: PortalLifecycleBannerCta) => void;
}) {
  const run = () => onRun(cta);
  return (
    <span className="inline-flex" onClick={isReadOnly ? run : undefined}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-testid="ops-banner-cta"
        data-banner-cta={cta.kind}
        disabled={isReadOnly}
        onClick={isReadOnly ? undefined : run}
        className={`h-[38px] rounded-full border bg-card px-[18px] text-[13px] font-semibold ${CTA_TONE_CLASSES[tone] ?? ''}`}
      >
        {label}
      </Button>
    </span>
  );
}
