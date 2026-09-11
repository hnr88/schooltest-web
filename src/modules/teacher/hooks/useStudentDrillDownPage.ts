'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { deidentify } from '@/modules/results';
import { useRecordCrumb } from '@/modules/shell';
import { RESULTS_PATH } from '@/modules/teacher/constants/results.constants';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { useTeacherExportDownload } from '@/modules/teacher/hooks/useTeacherExportDownload';
import { classResultsHref } from '@/modules/teacher/lib/results-shell';
import { DEFAULT_SKILL_SCOPE } from '@/modules/teacher/lib/skill-scope';
import { drillDownCrumb } from '@/modules/teacher/lib/student-drill-down-view';
import { firstNameOf } from '@/modules/teacher/lib/student-text';
import { studentDetail } from '@/modules/teacher/lib/v2/student-detail';
import { useStudentDrillDownQuery } from '@/modules/teacher/queries/use-student-drill-down.query';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useClassOverlaysStore } from '@/modules/teacher/stores/use-class-overlays-store';
import type { SkillScopeValue } from '@/modules/teacher/types/results-shell.types';
import type { StudentDrillDownPage } from '@/modules/teacher/types/student-drill-down.types';

/**
 * The student page's data and actions: the canonical drill-down read, the class name
 * from the cached C-TD-1 dashboard, the C-TR-7 export, the Ask AI drawer and the copy.
 * A success waits for the dashboard so the class is never printed as its document id.
 */
export function useStudentDrillDownPage(
  classDocumentId: string,
  studentDocumentId: string,
): StudentDrillDownPage {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const drillDown = useStudentDrillDownQuery(classDocumentId, studentDocumentId);
  const dashboard = useTeacherDashboardQuery();
  const openAskAi = useClassOverlaysStore((state) => state.openAskAi);
  const closeOverlays = useClassOverlaysStore((state) => state.close);
  const askAiOpen = useClassOverlaysStore(
    (state) =>
      state.askAiOpen &&
      state.askAiTarget.scope === 'student' &&
      state.askAiTarget.studentDocumentId === studentDocumentId,
  );
  const download = useTeacherExportDownload({ kind: 'student', classDocumentId, studentDocumentId }, () =>
    toast.success(t('exported')),
  );
  const [skill, setSkill] = useState<SkillScopeValue>(DEFAULT_SKILL_SCOPE);
  const knownClassName =
    dashboard.data?.classes.find((entry) => entry.class_document_id === classDocumentId)?.name ?? null;
  const data = drillDown.status === 'success' ? drillDown.data : null;
  const studentName = data?.displayName ?? null;
  const className = knownClassName ?? classDocumentId;
  const classHref = classResultsHref(classDocumentId);
  const crumb = drillDownCrumb(studentName, knownClassName, classDocumentId);

  useRecordCrumb(crumb?.label ?? null, crumb?.ancestors);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(deidentify(text, studentName ?? ''));
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  return {
    status: drillDown.status === 'success' && dashboard.isPending ? 'pending' : drillDown.status,
    retry: () => {
      drillDown.refetch();
      void dashboard.refetch();
    },
    className,
    studentName,
    firstName: studentName === null ? '' : firstNameOf(studentName),
    view: data === null ? null : studentDetail(data.view),
    skill,
    setSkill,
    actions: {
      exportPending: download.isPending,
      exportFailed: download.isError,
      exportMarkdown: download.start,
      askAiOpen,
      askAi: () => {
        if (askAiOpen) closeOverlays();
        else openAskAi({ scope: 'student', studentDocumentId });
      },
      copy: (text) => void copy(text),
    },
    crumbs: {
      back: { href: classHref, title: t('backTitle', { class: className }) },
      items: [
        { label: t('crumbClasses'), href: RESULTS_PATH },
        { label: className, href: classHref },
        ...(studentName === null ? [] : [{ label: studentName }]),
      ],
    },
  };
}
