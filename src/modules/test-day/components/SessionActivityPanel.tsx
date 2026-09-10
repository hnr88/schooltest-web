'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DotActivityRow } from '@/modules/design-system';
import {
  useLogIncidentMutation,
} from '@/modules/test-day/queries/use-log-incident.mutation';
import {
  useSittingActivityQuery,
} from '@/modules/test-day/queries/use-sitting-activity.query';
import { cn } from '@/lib/utils';

interface SessionActivityPanelProps {
  sittingDocumentId: string;
  /** The trail's scope — task 18 mounts the same panel a second time. */
  scope: 'sitting';
  className?: string;
}

// C-SIT-ACTIVITY (teacher task 13) — the session activity trail, S12's feed
// region. The read is truncated server-side to the last 8 with `total` over
// the whole trail, so the note has two branches: the truncation sentence over
// 8, the plain appeals sentence otherwise. A feed takes no table, no pager
// and no filter bar (SHARED-LAYER §4-6 "does not fit" B). The composer is the
// ONE write a teacher can type — Log an incident; every other control writes
// its own entry from inside its own service.
export function SessionActivityPanel({ sittingDocumentId, scope, className }: SessionActivityPanelProps) {
  const t = useTranslations('TestDay.activity');
  const feed = useSittingActivityQuery(sittingDocumentId);
  const logIncident = useLogIncidentMutation(sittingDocumentId);
  const [note, setNote] = useState('');
  const [composing, setComposing] = useState(false);

  const entries = feed.data?.entries ?? [];
  const total = feed.data?.total ?? 0;
  const truncated = total > entries.length;

  const submit = () => {
    const trimmed = note.trim();
    if (trimmed.length === 0 || logIncident.isPending) return;
    logIncident.mutate(
      { sittingDocumentId, note: trimmed, kind: 'warn' },
      {
        onSuccess: () => {
          setNote('');
          setComposing(false);
        },
      },
    );
  };

  return (
    <section
      data-surface="sitting-activity"
      data-scope={scope}
      aria-label={t('title')}
      className={cn('flex flex-col gap-3 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5', className)}
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-body-lg font-semibold text-foreground">{t('title')}</h3>
        <p className="text-caption text-muted-foreground">{t('subtitle')}</p>
      </div>

      {feed.isLoading ? (
        <p role="status" className="text-caption text-muted-foreground">{t('loading')}</p>
      ) : feed.isError ? (
        <p role="alert" className="text-caption text-destructive">{t('error')}</p>
      ) : entries.length === 0 ? (
        <p className="text-caption text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-border [&>*:last-child]:border-transparent">
            {entries.map((entry) => (
              <DotActivityRow
                key={`${entry.occurred_at}-${entry.action}`}
                tone={entry.kind === 'warn' ? 'warning' : 'brand'}
              >
                <strong>{entry.actor_label}</strong> — {entry.action}
                <span className="block text-caption text-muted-foreground">
                  {new Date(entry.occurred_at).toLocaleString()}
                </span>
              </DotActivityRow>
            ))}
          </div>
          <p className="text-caption text-muted-foreground">
            {truncated ? t('truncated', { shown: entries.length, total }) : t('appealsNote')}
          </p>
        </>
      )}

      {composing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            aria-label={t('noteLabel')}
            value={note}
            maxLength={120}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('notePlaceholder')}
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={note.trim().length === 0 || logIncident.isPending}>
              {t('logIncident')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setComposing(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button size="sm" variant="outline" onClick={() => setComposing(true)}>
            {t('logIncident')}
          </Button>
        </div>
      )}
    </section>
  );
}
