'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';

import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import { studentAnalysis } from '@/modules/teacher/lib/student-detail-text';
import { resolveParagraphs, resolveStudentText } from '@/modules/teacher/lib/student-text';
import type { StudentText, StudentTextTranslators } from '@/modules/teacher/types/student-drill-down.types';

/** The student page's text descriptors, resolved against the active locale's catalog. */
export function useStudentText(): StudentText {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);
  const format = useFormatter();
  const locale = useLocale();
  const month = (iso: string | null) =>
    iso === null ? '' : format.dateTime(new Date(iso), { month: 'short', timeZone: 'UTC' });
  const monthYear = (iso: string | null) =>
    iso === null ? '' : format.dateTime(new Date(iso), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const translators: StudentTextTranslators = {
    t: (key, values) => t(key, values),
    tVm: (key, values) => tVm(key, values),
    month: (iso) => month(iso),
    lower: (text) => text.toLocaleLowerCase(locale),
  };

  return {
    text: (descriptor) => resolveStudentText(descriptor, translators),
    month,
    monthYear,
    analysis: (view, first) => resolveParagraphs(studentAnalysis(view, first), translators),
  };
}
