'use client';

import { useTranslations } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops';
import { classifyConsentError } from '@/modules/privacy-consent/lib/classify-consent-error';
import { useWithdrawConsentMutation } from '@/modules/privacy-consent/queries/use-withdraw-consent.mutation';

import type { WithdrawConsentDialogProps } from '@/modules/privacy-consent/types/components.types';

// The portal's ONE confirm. The description is the contract promise: withdrawal
// applies going forward and does not undo marking or processing already done.
export function WithdrawConsentDialog({
  open,
  onOpenChange,
  type,
  recordDocumentId,
  aiGateOn,
}: WithdrawConsentDialogProps) {
  const t = useTranslations('PrivacyConsent');
  const withdraw = useWithdrawConsentMutation();
  const consent = t(`type.${type}.title`);
  const aiNotice = type === 'ai_processing' && aiGateOn;

  return (
    <OpsConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('withdraw.title', { consent })}
      description={t('withdraw.description')}
      notice={aiNotice ? { title: t('withdraw.aiNoticeTitle'), body: t('withdraw.aiNoticeBody') } : null}
      confirmLabel={t('withdraw.confirm')}
      cancelLabel={t('withdraw.cancel')}
      tone="destructive"
      pending={withdraw.isPending}
      error={withdraw.isError ? t(`error.${classifyConsentError(withdraw.error)}`) : null}
      onConfirm={() =>
        withdraw.mutate({ documentId: recordDocumentId }, { onSuccess: () => onOpenChange(false) })
      }
    />
  );
}
