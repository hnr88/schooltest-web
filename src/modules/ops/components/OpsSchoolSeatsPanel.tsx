'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Button, FieldShell, ProgressBar, Skeleton } from '@/modules/design-system';
import { useOpsWriteGate } from '@/modules/ops/actions';
import { useSchoolSeats } from '@/modules/ops/hooks/use-school-seats';

import type { OpsSchoolSeatsPanelProps } from '@/modules/ops/types/components.types';

// The seat-assignment surface (C-ENT-02), which had no UI anywhere before:
// only ops could call the write endpoint and nothing in the portal did, so a
// school's seat cap could only be changed by hand over HTTP. Seats gate the
// ENTIRE roster — adding a student, reactivating an archived one and committing
// a roster import are all refused with SEAT_CAP once `seats_used` reaches
// `seats_total` — and `seats_used` is recomputed server-side on every read, so
// the meter below is live and cannot drift from the roster.
export function OpsSchoolSeatsPanel({ documentId, enabled }: OpsSchoolSeatsPanelProps) {
  const t = useTranslations('Ops.seats');
  const gate = useOpsWriteGate();
  const seats = useSchoolSeats(documentId, enabled);

  return (
    <section
      data-slot="ops-school-seats"
      data-surface="ops-school-seats"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>

      {seats.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : seats.isError ? (
        <p data-surface="ops-school-seats-error" className="text-sm text-destructive">
          {t('loadError')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p data-surface="ops-school-seats-meter" className="text-sm text-body">
            {t('meter', { used: seats.used, total: seats.total })}
          </p>
          <ProgressBar
            value={seats.total > 0 ? Math.min((seats.used / seats.total) * 100, 100) : 0}
            ariaLabel={t('meter', { used: seats.used, total: seats.total })}
          />
          <p
            data-surface="ops-school-seats-remaining"
            className={
              seats.remaining === 0
                ? 'text-sm font-semibold text-destructive'
                : 'text-sm text-body'
            }
          >
            {seats.remaining === 0 ? t('remainingNone') : t('remaining', { remaining: seats.remaining })}
          </p>
        </div>
      )}

      <FieldShell
        id="ops-school-seats-total"
        label={t('label')}
        helperText={seats.overAllocated ? t('belowUsedHelper', { used: seats.used }) : t('helper')}
        errorText={seats.draft.trim() !== '' && !seats.isValid ? t('invalidToast') : undefined}
      >
        <Input
          id="ops-school-seats-total"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          data-testid="ops-school-seats-input"
          value={seats.draft}
          disabled={gate.readOnly || seats.isLoading || seats.pending}
          onChange={(event) => seats.setDraft(event.target.value)}
        />
      </FieldShell>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          data-testid="ops-school-seats-save"
          disabled={gate.readOnly || !seats.dirty || seats.pending}
          onClick={() => void seats.save()}
        >
          {seats.pending ? t('saving') : t('save')}
        </Button>
        {gate.readOnly ? <span className="text-sm text-body">{t('readOnly')}</span> : null}
      </div>
    </section>
  );
}
