'use client';

import { StudentAnalysisCard } from '@/modules/teacher/components/StudentAnalysisCard';
import { StudentBreakdownTable } from '@/modules/teacher/components/StudentBreakdownTable';
import { StudentProgressPanel } from '@/modules/teacher/components/StudentProgressPanel';
import type { StudentDrillDownBodyProps } from '@/modules/teacher/types/student-drill-down.types';

// The Reading body (Spec 02 §3b–3d, `02 Student report.html:207–367`), built only
// from the v2 view model: the progress card (band chart + 2×2 tiles), then the
// subskill breakdown table beside the analysis card (equal heights) — whose
// coming-soon state is locked (§0.1); no generated text is rendered.
function StudentDrillDownBody({ view }: StudentDrillDownBodyProps) {
  return (
    <>
      <StudentProgressPanel view={view} />
      <div className="flex flex-wrap items-stretch gap-[18px]">
        <StudentBreakdownTable view={view} className="min-w-[min(300px,100%)] flex-[1_1_360px]" />
        <StudentAnalysisCard className="min-w-[min(300px,100%)] flex-[1_1_360px]" />
      </div>
    </>
  );
}

export { StudentDrillDownBody };
