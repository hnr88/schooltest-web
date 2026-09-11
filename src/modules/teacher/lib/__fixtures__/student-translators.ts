import { createTranslator, type AbstractIntlMessages } from 'next-intl';

import enMessages from '@/i18n/messages/en.json';
import koMessages from '@/i18n/messages/ko.json';
import msMessages from '@/i18n/messages/ms.json';
import thMessages from '@/i18n/messages/th.json';
import viMessages from '@/i18n/messages/vi.json';
import zhMessages from '@/i18n/messages/zh.json';
import type { StudentTextTranslators, StudentTranslate } from '@/modules/teacher/types/student-drill-down.types';

/** The six shipped catalogs (D17), for tests that must hold in every locale. */
export const STUDENT_CATALOGS: Readonly<Record<string, AbstractIntlMessages>> = {
  en: enMessages,
  ko: koMessages,
  ms: msMessages,
  th: thMessages,
  vi: viMessages,
  zh: zhMessages,
};

/**
 * The real catalogs through next-intl's own translator; a missing message throws. The
 * catalogs load as untyped messages, so the translator's key is re-typed as a string.
 */
export function studentTranslators(locale: string): StudentTextTranslators {
  const onError = (error: Error) => {
    throw error;
  };
  const messages = STUDENT_CATALOGS[locale] ?? {};
  const t = createTranslator({ locale, messages, namespace: 'TeacherPortal.student', onError });
  const tVm = createTranslator({ locale, messages, namespace: 'TeacherPortal.viewModel', onError });
  const months = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  return {
    t: t as unknown as StudentTranslate,
    tVm: tVm as unknown as StudentTranslate,
    month: (iso) => months.format(new Date(iso)),
    lower: (text) => text.toLocaleLowerCase(locale),
  };
}
