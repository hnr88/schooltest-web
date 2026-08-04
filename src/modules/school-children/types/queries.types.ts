import type { ChildWriteBody } from '@/modules/school-children/types/school-children.types';

export interface ArchiveChildResult {
  documentId: string;
  status: string;
}

export interface UpdateChildInput {
  documentId: string;
  body: ChildWriteBody;
}
