import type { StudentWizardOutput } from '@/modules/student-wizard';

export interface UpdateStudentVars {
  documentId: string;
  values: StudentWizardOutput;
}
