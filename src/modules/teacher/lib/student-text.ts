import type { StudentTextTranslators, TextDescriptor } from '@/modules/teacher/types/student-drill-down.types';

/** One descriptor from `student-detail-text.ts` → its sentence in the active locale. */
export function resolveStudentText(descriptor: TextDescriptor, translators: StudentTextTranslators): string {
  const values: Record<string, string | number> = { ...descriptor.values };
  for (const [name, key] of Object.entries(descriptor.labels ?? {})) values[name] = translators.tVm(key);
  for (const [name, key] of Object.entries(descriptor.lowerLabels ?? {})) {
    values[name] = translators.lower(translators.tVm(key));
  }
  for (const [name, iso] of Object.entries(descriptor.months ?? {})) values[name] = translators.month(iso);
  const translate = descriptor.ns === 'viewModel' ? translators.tVm : translators.t;
  return translate(descriptor.key, values);
}

/** The analysis card: each paragraph's sentences resolved and joined by a space. */
export function resolveParagraphs(
  paragraphs: readonly (readonly TextDescriptor[])[],
  translators: StudentTextTranslators,
): string[] {
  return paragraphs.map((sentences) =>
    sentences.map((sentence) => resolveStudentText(sentence, translators)).join(' '),
  );
}

/** The design's `{first}`: the first word of the roster name. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
