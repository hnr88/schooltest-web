'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { SelectField } from '@/modules/design-system';
import { OpsSittingRecoveryDetail } from '@/modules/ops/components/OpsSittingRecoveryDetail';
import { useSchoolSittingsQuery } from '@/modules/ops/queries/use-school-sittings.query';

interface OpsSittingRecoveryProps {
  schoolDocumentId: string;
}

// Ops sitting-recovery panel (task 69, C-OPS-02, mvp-updates 4.2): pick one of
// the school's sittings (existing core sittings read, school-filtered), then
// invalidate the sitting or re-sit a student. Mounted from the ops school
// detail.
export function OpsSittingRecovery({ schoolDocumentId }: OpsSittingRecoveryProps) {
  const t = useTranslations('Ops.recovery');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const sittingsQuery = useSchoolSittingsQuery(schoolDocumentId, hydrated && Boolean(token));
  const [selected, setSelected] = useState('');

  const options = (sittingsQuery.data ?? []).map((sitting) => ({
    value: sitting.documentId,
    label: `${sitting.code ?? sitting.documentId} - ${sitting.class?.name ?? t('noClass')} (${
      sitting.status
    })`,
  }));

  return (
    <section
      data-slot="ops-sitting-recovery"
      data-surface="ops-sitting-recovery"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <SelectField
        id="ops-sitting-recovery-picker"
        label={t('pickerLabel')}
        placeholder={t('pickerPlaceholder')}
        options={options}
        value={selected}
        onValueChange={setSelected}
        disabled={!sittingsQuery.isSuccess || options.length === 0}
        helperText={
          sittingsQuery.isSuccess && options.length === 0 ? t('empty') : undefined
        }
      />
      {selected ? <OpsSittingRecoveryDetail sittingDocumentId={selected} /> : null}
    </section>
  );
}
