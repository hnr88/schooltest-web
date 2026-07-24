'use client';

import { FlaskConical } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { BorderedCallout } from '@/modules/design-system';
import { AttributePanel } from '@/modules/report/components/AttributePanel';
import { CrosswalkFactPanel } from '@/modules/report/components/CrosswalkFactPanel';
import { DisplayLabelPanel } from '@/modules/report/components/DisplayLabelPanel';
import { ErrorPatternNotes } from '@/modules/report/components/ErrorPatternNotes';
import { ObservationList } from '@/modules/report/components/ObservationList';
import { SupplementaryStrand } from '@/modules/report/components/SupplementaryStrand';
import { buildObservations } from '@/modules/report/lib/observations';
import { buildSupplementaryStrand } from '@/modules/report/lib/supplementary-view-model';
import type { AttributeEvidence, AttributePanelView } from '@/modules/report/types/attribute.types';
import type { ResultView } from '@/modules/report/types/report.types';

// E11-01..E11-09 — the TEACHER blocks of the report, as one tree. They are not
// rendered at all in parent mode (E11-10): removed from the DOM, never hidden
// with CSS, so the E11-08/E11-14/E11-15 exclusions are structural.
export function TeacherReportBody({
  result,
  attributes,
  evidence,
}: {
  result: ResultView;
  attributes: AttributePanelView;
  evidence: AttributeEvidence | null;
}) {
  const t = useTranslations('Report');

  return (
    <div data-slot="report-teacher-view" className="flex flex-col gap-6">
      {result.provisional === 'field_test' ? (
        <div data-slot="report-provisional">
          <BorderedCallout icon={FlaskConical}>{t('provisionalFieldTest')}</BorderedCallout>
        </div>
      ) : null}

      <DisplayLabelPanel result={result} evidence={evidence} />

      <CrosswalkFactPanel result={result} evidence={evidence} />

      <AttributePanel view={attributes} />

      <SupplementaryStrand view={buildSupplementaryStrand(result)} />

      <ObservationList view={buildObservations(result)} />

      <ErrorPatternNotes result={result} />
    </div>
  );
}
