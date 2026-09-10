import { z } from 'zod';

/**
 * Task 23 — `vClass` (`logic.md#v-class`, `Ops Portal.dc.html:1193-1201`), the
 * class form modal's three rules:
 *
 *   1. `name` required.
 *   2. `name` case-insensitively duplicated within the school, EXCLUDING the
 *      row being edited, → blocking error.
 *   3. a test window chosen AND no teacher picked → blocking error; no
 *      teacher picked (and no window) → non-blocking WARNING.
 *
 * Tested directly against this schema's public parse
 * (`tests/unit/ops-class-form.test.ts`) with an identity translator, the
 * same discipline `school-create.schema.ts` (task 24) set: every assertion
 * reads the KEY, so the test stays honest about WHICH message fires without
 * depending on the live English copy (pinned separately by the i18n
 * parity/census specs and D-33's reuse record in `proof/23.md`).
 *
 * Rule 3's two arms come from the SAME condition pair (window chosen +
 * !teacherChosen → error; !teacherChosen && !windowChosen → warning). Zod
 * issues always fail `parse`/`safeParse`, so the warning cannot be an issue —
 * it is carried on the PARSED VALUE instead, via `.transform`, so a caller
 * reads `result.data.warnings.teacher` without the parse having failed. This
 * is why the warning is provable through the schema's public parse alone,
 * exactly as the task's `Done when` list requires, while still never
 * blocking submission.
 */
export type ClassFormSchemaTranslator = (key: string) => string;

export interface ClassFormExistingClass {
  documentId: string;
  name: string | null;
}

export interface ClassFormWarnings {
  /** Rule 3's non-blocking arm: no teacher AND no window chosen. */
  teacher?: string;
}

export interface ClassFormSchemaOptions {
  /** Every OTHER class already loaded for this school — rule 2's population. */
  existingClasses: readonly ClassFormExistingClass[];
  /** The class being edited — excluded from its own duplicate check. `null` on create. */
  editingDocumentId?: string | null;
}

const NAME_MAX = 255;

function normalizeClassName(value: string): string {
  return value.trim().toLowerCase();
}

export function createClassFormSchema(t: ClassFormSchemaTranslator, options: ClassFormSchemaOptions) {
  const existingClasses = options.existingClasses;
  const editingDocumentId = options.editingDocumentId ?? null;

  return z
    .object({
      name: z.string().max(NAME_MAX),
      yearBand: z.string().nullable(),
      teacherDocumentId: z.string().nullable(),
      testWindowDocumentId: z.string().nullable(),
    })
    .superRefine((value, ctx) => {
      const trimmedName = value.name.trim();
      if (trimmedName === '') {
        // Rule 1.
        ctx.addIssue({ code: 'custom', path: ['name'], message: t('nameRequired') });
      } else {
        // Rule 2 — case-insensitive, excluding the row being edited.
        const normalized = normalizeClassName(trimmedName);
        const duplicate = existingClasses.some(
          (candidate) =>
            candidate.documentId !== editingDocumentId &&
            normalizeClassName(candidate.name ?? '') === normalized,
        );
        if (duplicate) {
          ctx.addIssue({ code: 'custom', path: ['name'], message: t('nameDuplicate') });
        }
      }

      // Rule 3, blocking arm — a window chosen with no teacher picked.
      const windowChosen = value.testWindowDocumentId !== null;
      const teacherChosen = value.teacherDocumentId !== null;
      if (windowChosen && !teacherChosen) {
        ctx.addIssue({ code: 'custom', path: ['teacherDocumentId'], message: t('windowNeedsTeacher') });
      }
    })
    .transform((value) => {
      const teacherChosen = value.teacherDocumentId !== null;
      const windowChosen = value.testWindowDocumentId !== null;
      // Rule 3, warning arm — never an issue, so it never fails the parse.
      const warnings: ClassFormWarnings =
        !teacherChosen && !windowChosen ? { teacher: t('noTeacherWarning') } : {};
      return { ...value, warnings };
    });
}

export type ClassFormSchema = ReturnType<typeof createClassFormSchema>;
export type ClassFormValues = z.input<ClassFormSchema>;
export type ClassFormParsed = z.output<ClassFormSchema>;
