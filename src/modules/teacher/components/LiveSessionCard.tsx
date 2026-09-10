'use client';

/**
 * teacher/09 — one open sitting rendered as the design's card (`:242–263`):
 * LIVE pill, test label (C-TD-2's own label, never the variant letter), join
 * code, who (whole-class until task 22 ships subsets), the completed/expected
 * bar ("two integers on the wire — the wire wins"), Monitor (task 08's
 * console) and Close (C-TS-4 via the existing confirm, wired by the parent).
 */
import { useTranslations } from 'next-intl';

import { Button, StatusPill } from '@/modules/design-system';
import { findTestLabel, testSessionMonitorHref } from '@/modules/teacher/lib/join-code';
import type { LiveRollupSitting } from '@/modules/teacher/lib/live-rollup';
import type { TeacherTest } from '@/modules/teacher/types/teacher.types';

export interface LiveSessionCardProps {
  sitting: LiveRollupSitting;
  classLabel: string;
  studentCount: number;
  tests: readonly TeacherTest[];
  onRequestClose: (target: { documentId: string; className: string }) => void;
}

export function LiveSessionCard({
  sitting,
  classLabel,
  studentCount,
  tests,
  onRequestClose,
}: LiveSessionCardProps) {
  const t = useTranslations('Teacher.testSessions.rollup');
  const testLabel = findTestLabel(tests, sitting.variant) ?? t('testLabelMissing');
  const pct = sitting.expected > 0 ? Math.round((sitting.completed / sitting.expected) * 100) : 0;
  return (
    <div
      data-slot="live-session-card"
      data-sitting-id={sitting.documentId}
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-card/50 p-4"
    >
      <div className="flex items-center gap-2.5">
        <StatusPill tone="danger" className="bg-destructive tracking-widest text-white">
          {t('livePill')}
        </StatusPill>
        <span className="flex-1 text-sm font-medium text-foreground">{testLabel}</span>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {sitting.code}
        </span>
      </div>
      <p className="text-body-sm text-muted-foreground">{t('who', { students: studentCount })}</p>
      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-body-sm text-muted-foreground">
        {sitting.completed} / {sitting.expected}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" href={testSessionMonitorHref(sitting.documentId)}>
          {t('monitor')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRequestClose({ documentId: sitting.documentId, className: classLabel })}
        >
          {t('close')}
        </Button>
      </div>
    </div>
  );
}
