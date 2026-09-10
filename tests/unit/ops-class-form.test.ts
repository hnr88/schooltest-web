import { describe, expect, it } from 'vitest';

import { createClassFormSchema, type ClassFormExistingClass } from '@/modules/ops/schemas/class-form.schema';

/**
 * Task 23 — the exhaustive proof of every rule `logic.md#v-class`
 * (`Ops Portal.dc.html:1193-1201`, `vClass(v, editingName)`) specifies for the
 * class form modal. The `classes-list.spec.ts` e2e exercises one branch per
 * run (deferred under OP-4, `proof/DEBT.md`); this file is the authority for
 * the whole set, including rule 3's warning arm, asserted as non-blocking.
 *
 * Every rule is proven directly against the Zod schema
 * (`createClassFormSchema`) with an identity translator, so a message
 * assertion below is exactly the string an operator sees — the same schema
 * the dialog's own `safeParse` call wires to the form.
 */
const t = (key: string) => key;

const OTHER_CLASSES: ClassFormExistingClass[] = [
  { documentId: 'class-a', name: 'EAL/D 8A' },
  { documentId: 'class-b', name: 'EAL/D Year 7 - Room 4' },
];

const VALID = {
  name: 'A brand new class',
  yearBand: '7_9',
  teacherDocumentId: null,
  testWindowDocumentId: null,
};

describe('vClass rule 1 — name is required', () => {
  const schema = createClassFormSchema(t, { existingClasses: OTHER_CLASSES });

  it('empty name blocks with "nameRequired"', () => {
    const result = schema.safeParse({ ...VALID, name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((issue) => issue.path[0] === 'name')?.message).toBe('nameRequired');
  });

  it('whitespace-only name blocks with "nameRequired"', () => {
    const result = schema.safeParse({ ...VALID, name: '   ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((issue) => issue.path[0] === 'name')?.message).toBe('nameRequired');
  });

  it('a real name is valid', () => {
    expect(schema.safeParse(VALID).success).toBe(true);
  });
});

describe('vClass rule 2 — case-insensitive duplicate within the school, edited row excluded', () => {
  const schema = createClassFormSchema(t, { existingClasses: OTHER_CLASSES });

  it('a duplicate (case-insensitive) name blocks with "nameDuplicate"', () => {
    const result = schema.safeParse({ ...VALID, name: 'eal/d 8a' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((issue) => issue.path[0] === 'name')?.message).toBe('nameDuplicate');
  });

  it('the edited row is excluded from its own duplicate check — renaming to its existing name still passes', () => {
    const editSchema = createClassFormSchema(t, {
      existingClasses: OTHER_CLASSES,
      editingDocumentId: 'class-a',
    });
    // "EAL/D 8A" is class-a's OWN current name — editing class-a and keeping
    // it must not trip the duplicate rule against itself.
    const result = editSchema.safeParse({ ...VALID, name: 'EAL/D 8A' });
    expect(result.success).toBe(true);
  });

  it('a class NOT being edited still trips the duplicate rule for a different class', () => {
    const editSchema = createClassFormSchema(t, {
      existingClasses: OTHER_CLASSES,
      editingDocumentId: 'class-a',
    });
    // class-a is being renamed to class-b's name — still a real duplicate.
    const result = editSchema.safeParse({ ...VALID, name: 'EAL/D Year 7 - Room 4' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((issue) => issue.path[0] === 'name')?.message).toBe('nameDuplicate');
  });
});

describe('vClass rule 3 — the window/teacher pair (blocking arm and warning arm)', () => {
  const schema = createClassFormSchema(t, { existingClasses: OTHER_CLASSES });

  it('blocking: a window chosen with no teacher picked → "windowNeedsTeacher"', () => {
    const result = schema.safeParse({
      ...VALID,
      teacherDocumentId: null,
      testWindowDocumentId: 'window-1',
    });
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.find((issue) => issue.path[0] === 'teacherDocumentId')?.message,
    ).toBe('windowNeedsTeacher');
  });

  it('a window chosen WITH a teacher picked is valid (no error, no warning)', () => {
    const result = schema.safeParse({
      ...VALID,
      teacherDocumentId: 'teacher-1',
      testWindowDocumentId: 'window-1',
    });
    expect(result.success).toBe(true);
    expect(result.data?.warnings.teacher).toBeUndefined();
  });

  it('warning: no teacher and no window → non-blocking "noTeacherWarning"', () => {
    const result = schema.safeParse({
      ...VALID,
      teacherDocumentId: null,
      testWindowDocumentId: null,
    });
    // The warning never blocks submission — parse still succeeds.
    expect(result.success).toBe(true);
    expect(result.data?.warnings.teacher).toBe('noTeacherWarning');
  });

  it('a teacher picked with no window carries no warning and no error', () => {
    const result = schema.safeParse({
      ...VALID,
      teacherDocumentId: 'teacher-1',
      testWindowDocumentId: null,
    });
    expect(result.success).toBe(true);
    expect(result.data?.warnings.teacher).toBeUndefined();
  });
});
