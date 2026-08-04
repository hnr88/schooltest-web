import type { createStudentWizardSchema } from '@/modules/student-wizard/schemas/student-wizard.schema';

export type WizardSchemaTranslator = (key: string) => string;

export type StudentWizardSchema = ReturnType<typeof createStudentWizardSchema>;
