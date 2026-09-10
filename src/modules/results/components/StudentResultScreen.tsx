'use client';

import { useTranslations } from 'next-intl';

import type { ResultView } from '@schooltest/scoring-contracts';

import { ConfidenceStrip } from './ConfidenceStrip';
import { ConsolidatingChecklist } from './ConsolidatingChecklist';
import { ErrorPatternsPanel } from './ErrorPatternsPanel';
import { PrintReportButton } from './PrintReportButton';
import { ProgressTrendChart } from './ProgressTrendChart';
import { SkillMovementSparklines } from './SkillMovementSparklines';
import { StudentResultHeader, type StudentIdentity } from './StudentResultHeader';
import { SubskillCardGrid } from './SubskillCardGrid';

/**
 * Screen C (dashboard §4.1–§4.7, §4.9 print): header, confidence strip, trend
 * chart, seven cards, movement sparklines, error patterns, consolidating
 * checklist, print control. A PURE composition over a parsed ResultView — the
 * fetching is `useStudentResultQuery` (task 29) at wiring time; this component
 * takes the already-parsed view so tests render the REAL fixture payload
 * without a server.
 *
 * §6 states handled: scoring failed (a full-panel failure, never score cards
 * built from a result the pipeline itself rejected), first sitting (trend
 * caption; NO sparkline section at all — ruling), skill not assessed (gap
 * cards), Section 3 not reached (gate.passed null), low confidence, single
 * strand, empty error patterns (section absent, never an empty panel).
 */
export function StudentResultScreen({ view, student }: { view: ResultView; student: StudentIdentity }) {
  const t = useTranslations('Results');

  if (view.status === 'scoring_failed') {
    return (
      <div data-slot="result-screen" data-state="scoring_failed" className="flex flex-col gap-2 p-4">
        <p data-slot="scoring-failed" className="text-body font-semibold text-danger-ink">
          {t('scoringFailed')}
        </p>
      </div>
    );
  }

  return (
    <div data-slot="result-screen" data-status={view.status} className="flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <StudentResultHeader view={view} student={student} />
        <PrintReportButton studentName={student.name} satAt={view.published_at === null ? null : view.published_at.slice(0, 10)} />
      </div>
      <ConfidenceStrip view={view} />
      <ProgressTrendChart view={view} />
      <SubskillCardGrid view={view} />
      <SkillMovementSparklines view={view} />
      <ErrorPatternsPanel view={view} studentName={student.name} />
      <ConsolidatingChecklist view={view} />
    </div>
  );
}
