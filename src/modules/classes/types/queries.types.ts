import type { ClassFormValues } from '@/modules/classes/schemas/class.schema';

// C-CLS-02 body. `year_band` is optional server-side (only `name` is required),
// and the spec §2 add-class modal has no year band field — omitting the key
// leaves the band unset rather than inventing one.
export interface CreateClassInput {
  name: string;
  year_band?: string;
  teacher_documentIds: string[];
}

export interface UpdateClassInput extends ClassFormValues {
  documentId: string;
}
