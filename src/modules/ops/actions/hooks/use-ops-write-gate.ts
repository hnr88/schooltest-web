'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { useOnlineStatus } from '@/modules/ops/hooks/use-online-status';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';

interface OpsWriteGateCopy {
  readOnly: string;
  offline: string;
}

export function opsWriteBlockedReason(
  readOnly: boolean,
  online: boolean,
  copy: OpsWriteGateCopy,
): string | null {
  if (readOnly) return copy.readOnly;
  if (!online) return copy.offline;
  return null;
}

export interface OpsWriteGate {
  blockedReason: () => string | null;
  retryWhenBlocked: boolean;
  retryLabel: string;
  /**
   * ops/28 (D-53 follow-up) — read-only ALONE, never offline. A kit surface
   * uses this to grey a control pre-emptively (`disabled`); offline is
   * transient and must keep its clickable toast-with-Retry path
   * (`blockedReason` + `retryWhenBlocked` still own that), so a control must
   * never go inert just because the connection dropped.
   */
  readOnly: boolean;
}

/** One capability + NIC preflight shared by every action-kit write. */
export function useOpsWriteGate(): OpsWriteGate {
  const capabilities = useCapabilitiesQuery();
  const online = useOnlineStatus();
  const tCapabilities = useTranslations('Ops.capabilities');
  const tToast = useTranslations('Ops.toast');
  const readOnly = capabilities.data?.capabilities.write === false;

  const blockedReason = useCallback(
    () =>
      opsWriteBlockedReason(readOnly, online, {
        readOnly: tCapabilities('readOnlyWriteBlocked'),
        offline: tCapabilities('offlineWriteBlocked'),
      }),
    [online, readOnly, tCapabilities],
  );

  return {
    blockedReason,
    retryWhenBlocked: !readOnly && !online,
    retryLabel: tToast('retry'),
    readOnly,
  };
}
