'use client';

import { FileSearch, Lock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button, Eyebrow } from '@/modules/design-system';
import { PrintReportButton } from '@/modules/results';
import { QueryErrorFallback } from '@/modules/query-errors';
import { ParentReportView } from '@/modules/report/components/ParentReportView';
import { ReportSkeleton } from '@/modules/report/components/ReportSkeleton';
import { useRungHeading } from '@/modules/report/hooks/useRungHeading';
import { familyCommentaryKeys } from '@/modules/report/lib/family-commentary';
import { buildFamilyPreview } from '@/modules/report/lib/parent-view-model';
import { useFamilyReportQuery } from '@/modules/report/queries/use-family-report.query';
import type { FamilyReportDetail } from '@/modules/report/schemas/family-report.schema';

/**
 * C-PAR-REPORT (NIGHT-2 W8, JF-039) — the PARENT's own family-report face at
 * /dashboard/reports/[resultDocumentId] (the staff arm keeps the teacher
 * screen; the arm swap is ReportAudienceGate's job).
 *
 * The read is the parent-authorised GET /api/my/results/:documentId, whose
 * server-side allow-list projection carries ONLY family-safe content:
 * - released → score + phase + skills (ParentReportView over the shared
 *   FamilyPreviewView builder) PLUS "What this means": localized carer lines
 *   built from the structured attributes (`familyCommentaryKeys`), never the
 *   API's English audit narrative (probabilities, CEFR, internal keys);
 * - held / recalled → the lifecycle face with NO measures on the wire, so "no
 *   score digits anywhere" is structural (PAR-012/013). A recalled report is
 *   the held face plus the recall fact — the released payload is never cached
 *   under a shape this screen would render.
 */
export function FamilyReportScreen({ resultDocumentId }: { resultDocumentId: string }) {
  const { data, error, isError, isFetching, isLoading, refetch } = useFamilyReportQuery(resultDocumentId);
  const format = useFormatter();
  const t = useTranslations('Report');
  const tFam = useTranslations('Report.family');
  const tCarer = useTranslations('TeacherPortal.viewModel');
  const rungHeading = useRungHeading();

  if (isLoading) return <ReportSkeleton />;

  if (isError || !data) {
    return (
      <main className="flex flex-1 flex-col px-4 py-7 sm:px-6 lg:px-8">
        <div className="w-full max-w-160">
          <QueryErrorFallback
            error={error}
            goneIcon={FileSearch}
            goneTitle={t('reportGoneTitle')}
            goneDescription={t('reportGoneDescription')}
            isRetrying={isFetching}
            onRetry={() => refetch()}
            action={
              <Button
                href="/dashboard/reports"
                variant="outline"
                size="sm"
                className="h-11 rounded-full px-4"
              >
                {t('backToList')}
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  const childName = [data.view.student.given_name, data.view.student.family_name]
    .filter(Boolean)
    .join(' ');

  if (data.state !== 'released') {
    const recalled = data.state === 'recalled';
    return (
      <main
        data-surface="family-report"
        data-state={data.state}
        className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
      >
        <section
          data-slot="family-report-held"
          className="flex max-w-160 flex-col gap-3 rounded-card bg-card px-6 py-8 shadow-sm sm:px-7.5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
            <Lock className="h-5 w-5 text-primary-ink" aria-hidden />
          </span>
          <Eyebrow>{childName || tFam('yourChild')}</Eyebrow>
          <h1 data-slot="family-report-held-title" className="text-portal-heading font-bold text-foreground">
            {recalled ? tFam('recalledTitle') : tFam('heldTitle')}
          </h1>
          <p className="max-w-prose text-body-md text-muted-foreground">
            {recalled ? tFam('recalledBody') : tFam('heldBody', { child: childName || tFam('yourChild') })}
          </p>
          <p className="text-caption text-muted-foreground">
            {recalled && data.view.recalled_at
              ? tFam('recalledAt', {
                  date: format.dateTime(new Date(data.view.recalled_at), { dateStyle: 'medium' }),
                })
              : tFam('heldWhen', {
                  date: data.view.published_at
                    ? format.dateTime(new Date(data.view.published_at), { dateStyle: 'medium' })
                    : tFam('soon'),
                })}
          </p>
        </section>
      </main>
    );
  }

  const view = data.view;
  const preview = buildFamilyPreview({
    overall: { domain_score: view.overall_domain_score },
    acara_phase: view.acara_phase,
    skill: view.skill,
    published_at: view.published_at,
    attributes: view.attributes,
  });
  const commentary = familyCommentaryKeys(view.attributes);

  return (
    <main
      data-surface="family-report"
      data-state="released"
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>{rungHeading(view.acara_phase) ?? view.display_label ?? t('backToList')}</Eyebrow>
        {/* §4.9 print — JF-040: the print affordance lives on the parent face
            itself now; the shared print CSS pair strips it off the paper. */}
        <PrintReportButton studentName={childName || tFam('yourChild')} satAt={view.published_at === null ? null : view.published_at.slice(0, 10)} />
      </div>

      <ParentReportView view={preview} />

      {commentary.length > 0 ? (
        <section
          data-slot="family-report-commentary"
          aria-labelledby="family-commentary-title"
          className="flex max-w-160 flex-col gap-3 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
        >
          <h2 id="family-commentary-title" className="text-caption font-bold uppercase tracking-wide text-muted-foreground">
            {tFam('commentaryHeading')}
          </h2>
          <ul className="flex flex-col gap-2">
            {commentary.map((key) => (
              <li key={key} data-slot="family-report-commentary-line" className="text-body-md text-foreground">
                {tCarer(key)}
              </li>
            ))}
          </ul>
          <p className="text-caption text-muted-foreground">{tFam('commentarySource')}</p>
        </section>
      ) : null}
    </main>
  );
}
