'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Alert,
  Button,
} from '@/modules/design-system';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { OpsSittingRecoveryTable } from '@/modules/ops/components/OpsSittingRecoveryTable';
import { useSittingRecovery } from '@/modules/ops/hooks/use-sitting-recovery';
import { useOpsSittingMonitorQuery } from '@/modules/ops/queries/use-ops-sitting-monitor.query';

import type { OpsSittingRecoveryDetailProps } from '@/modules/ops/types/components.types';

// The selected sitting's recovery surface (C-OPS-02, task 69): the live C-SIT-02
// roster, per-student re-sits and the invalidate action behind a confirm
// dialog. Once invalidated the panel carries the contract copy: students can
// sit again.
export function OpsSittingRecoveryDetail({ sittingDocumentId }: OpsSittingRecoveryDetailProps) {
  const t = useTranslations('Ops.recovery');
  const monitorQuery = useOpsSittingMonitorQuery(sittingDocumentId, true);
  const { invalidate, resit, invalidating, invalidated, resitting } =
    useSittingRecovery(sittingDocumentId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (monitorQuery.isPending) {
    return <p className="text-sm text-body">{t('loadingMonitor')}</p>;
  }
  if (monitorQuery.isError) {
    return (
      <Alert
        variant="error"
        title={t('loadErrorTitle')}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={monitorQuery.isFetching}
            onClick={() => monitorQuery.refetch()}
          >
            {t('retry')}
          </Button>
        }
      >
        {t('loadErrorDescription')}
      </Alert>
    );
  }

  const monitor = monitorQuery.data;
  const closed = monitor.sitting.status === 'closed';

  return (
    <div data-surface="ops-sitting-recovery-detail" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="destructive"
          className="min-h-11 px-4"
          disabled={closed}
          onClick={() => setConfirmOpen(true)}
        >
          {t('invalidateButton')}
        </Button>
        {invalidated || closed ? (
          <p data-surface="ops-sitting-invalidated" className="text-sm text-body">
            {t('invalidatedNotice')}
          </p>
        ) : null}
      </div>
      <OpsSittingRecoveryTable
        students={monitor.students}
        resitting={resitting}
        onResit={(studentDocumentId, studentName) => void resit(studentDocumentId, studentName)}
      />
      <OpsConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirmTitle')}
        description={t('confirmBody')}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
        tone="destructive"
        pending={invalidating}
        onConfirm={() => {
          void invalidate();
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
