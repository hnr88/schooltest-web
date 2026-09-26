'use client';

import { useState } from 'react';

import { ReportsAudiencePicker } from '@/modules/teacher/components/ReportsAudiencePicker';
import { ReportsClassCard } from '@/modules/teacher/components/ReportsClassCard';
import { ReportsStudentList } from '@/modules/teacher/components/ReportsStudentList';
import { useReportsDownloads } from '@/modules/teacher/hooks/useReportsDownloads';
import { reportsView } from '@/modules/teacher/lib/v2/family-reports';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import type { FamilyReportsPanelProps, ReportsAudience } from '@/modules/teacher/types/v2-family.types';

function FamilyReportsPanel({ classDocumentId, rows }: FamilyReportsPanelProps) {
  const [audience, setAudience] = useState<ReportsAudience>('parents');
  const dashboard = useTeacherDashboardQuery();
  const className =
    dashboard.data?.classes.find((entry) => entry.class_document_id === classDocumentId)?.name ?? '';
  const view = reportsView(rows);
  const downloads = useReportsDownloads(classDocumentId, rows);

  return (
    <section
      data-slot="family-reports"
      data-status={rows.length === 0 ? 'empty' : 'ready'}
      data-audience={audience}
      aria-labelledby="family-reports-title"
      className="flex flex-col gap-[18px] leading-[normal]"
    >
      <ReportsAudiencePicker value={audience} titleId="family-reports-title" onChange={setAudience} />
      {audience === 'parents' ? null : (
        <ReportsClassCard className={className} audience={audience} scored={view.scored} total={view.total} />
      )}
      <ReportsStudentList view={view} audience={audience} downloads={downloads} />
    </section>
  );
}

export { FamilyReportsPanel };
