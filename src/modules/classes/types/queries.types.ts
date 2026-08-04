import type { ClassFormValues } from '@/modules/classes/schemas/class.schema';

export interface CreateClassInput {
  name: string;
  year_band: string;
  teacher_documentIds: string[];
}

export interface UpdateClassInput extends ClassFormValues {
  documentId: string;
}
