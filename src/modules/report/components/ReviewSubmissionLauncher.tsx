'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/modules/design-system';
import { ReviewDrawer } from '@/modules/report/components/ReviewDrawer';
import { studentNameOf } from '@/modules/report/lib/review-display';
import { useReviewStudentQuery } from '@/modules/report/queries/use-review-student.query';
import type { ReviewLaunchView } from '@/modules/report/types/review.types';

// Opens the review drawer from a page that holds a result but no roster row —
// today the teacher report. The header is filled from live reads only: the
// student's name and class from their own record, the skill and phase from the
// result. What neither serves (the form's name, the submitted time) is left out.

export function ReviewSubmissionLauncher({
  resultDocumentId,
  view,
}: {
  resultDocumentId: string;
  view: ReviewLaunchView;
}) {
  const t = useTranslations('TeacherPortal.review');
  const skills = useTranslations('Report.skills');
  const [open, setOpen] = useState(false);
  const student = useReviewStudentQuery(view.student_document_id, open);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-slot="review-open"
        className="h-11 w-fit rounded-full px-4"
        onClick={() => setOpen(true)}
      >
        {t('title')}
      </Button>
      <ReviewDrawer
        resultDocumentId={resultDocumentId}
        open={open}
        onOpenChange={setOpen}
        studentName={student.data ? studentNameOf(student.data) : undefined}
        className={student.data?.class?.name}
        testLabel={view.skill ? skills(view.skill) : undefined}
        phase={view.acara_phase}
      />
    </>
  );
}
