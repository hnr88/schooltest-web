import type { ClassFormValues } from '@/modules/classes/schemas/class.schema';

// C-CLS-02 body. `year_band` is optional server-side (only `name` is required),
// and the spec §2 add-class modal has no year band field — omitting the key
// leaves the band unset rather than inventing one.
export interface CreateClassInput {
  name: string;
  year_band?: string;
  teacher_documentIds: string[];
}

// C-CLS-03 body. Every field is optional server-side except the class itself,
// so a caller sends ONLY what it edits: the Classes-list dialog sends the whole
// form, while the class-detail edit modal sends name + teacher and deliberately
// omits `student_documentIds` (whose REPLACE semantics would otherwise unlink
// the roster) and `year_band` (not on that modal).
export interface UpdateClassInput extends Partial<ClassFormValues> {
  documentId: string;
  name: string;
}
