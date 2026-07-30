'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input } from '@/modules/design-system';
import { useResponsesCsvMutation } from '@/modules/ops/queries/use-responses-csv.mutation';

// Ops raw-export panel (task 70, C-OPS-04, mvp-updates 4.2): the raw
// item-level responses of one session out as CSV for offline work in R. An
// empty session downloads a header-only CSV (the API answers 200, not an
// error).
export function OpsRawExport() {
  const t = useTranslations('Ops.tools.rawExport');
  const [sessionId, setSessionId] = useState('');
  const mutation = useResponsesCsvMutation();

  const submit = async () => {
    try {
      await mutation.mutateAsync(sessionId.trim());
      toast.success(t('successToast'));
    } catch {
      toast.error(t('errorToast'));
    }
  };

  return (
    <section
      data-slot="ops-raw-export"
      data-surface="ops-raw-export"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={t('sessionLabel')}
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          placeholder={t('sessionPlaceholder')}
          className="h-11 w-80"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 px-3"
          loading={mutation.isPending}
          disabled={sessionId.trim() === ''}
          onClick={() => void submit()}
        >
          {t('download')}
        </Button>
      </div>
    </section>
  );
}
