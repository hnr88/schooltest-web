'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button, StatusPill } from '@/modules/design-system';
import { GrantConsentButton } from '@/modules/privacy-consent/components/GrantConsentButton';
import { WithdrawConsentDialog } from '@/modules/privacy-consent/components/WithdrawConsentDialog';
import {
  CONSENT_STATE_TONES,
  GRANTABLE_CONSENT_TYPES,
} from '@/modules/privacy-consent/constants/components.constants';

import type { ConsentRowProps } from '@/modules/privacy-consent/types/components.types';

// One consent type: its statement as the API serves it (never translated here), the
// state with its date, and the one action that fits the state. A guardian's own
// withdrawal cannot be re-granted by the school, so that row offers nothing.
export function ConsentRow({ row, config, studentDocumentId, audience }: ConsentRowProps) {
  const t = useTranslations('PrivacyConsent');
  const format = useFormatter();
  const [confirming, setConfirming] = useState(false);

  const date = row.at === null ? '' : format.dateTime(new Date(row.at), { dateStyle: 'medium' });
  const canGrant =
    row.state !== 'active' &&
    GRANTABLE_CONSENT_TYPES.includes(row.type) &&
    !(audience === 'school_admin' && row.withdrawnByGuardian);

  return (
    <li
      data-slot="consent-row"
      data-consent-type={row.type}
      data-state={row.state}
      className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-[15px] font-semibold text-foreground">{t(`type.${row.type}.title`)}</h3>
          <StatusPill tone={CONSENT_STATE_TONES[row.state]}>{t(`state.${row.state}`)}</StatusPill>
        </div>
        {row.statement === null ? (
          row.statementKey === null ? null : (
            <p className="text-sm text-muted-foreground">{t('statementKey', { key: row.statementKey })}</p>
          )
        ) : (
          <p className="text-sm break-words text-muted-foreground">{row.statement.text}</p>
        )}
        <p className="text-xs font-semibold text-foreground">{t(`since.${row.state}`, { date })}</p>
        {row.state !== 'none' && row.policyVersion !== null ? (
          <p className="text-xs text-muted-foreground">
            {t('policyVersion', { version: row.policyVersion })}
          </p>
        ) : null}
        {row.state === 'active' && row.source !== null ? (
          <p className="text-xs text-muted-foreground">{t(`source.${row.source}`)}</p>
        ) : null}
        {audience === 'school_admin' && row.withdrawnByGuardian ? (
          <p className="text-xs text-muted-foreground">{t('guardianWithdrew')}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {row.withdrawTarget !== null ? (
          <>
            <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(true)}>
              {t('withdraw.button')}
            </Button>
            {confirming ? (
              <WithdrawConsentDialog
                open
                onOpenChange={setConfirming}
                type={row.type}
                recordDocumentId={row.withdrawTarget}
                aiGateOn={config.ai_consent_required}
              />
            ) : null}
          </>
        ) : null}
        {canGrant ? (
          <GrantConsentButton row={row} studentDocumentId={studentDocumentId} audience={audience} />
        ) : null}
      </div>
    </li>
  );
}
