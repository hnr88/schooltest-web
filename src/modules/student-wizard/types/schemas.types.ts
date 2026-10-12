import type { createStudentWizardSchema } from '@/modules/student-wizard/schemas/student-wizard.schema';

export type WizardSchemaTranslator = (key: string) => string;

export type StudentWizardSchema = ReturnType<typeof createStudentWizardSchema>;

export type { CreateStudentResponse } from '@/modules/student-wizard/schemas/student-create.schema';

// W4-19 (D5 S1/S4): what the consent config switches into the wizard schema.
// `minimised` = `minimised_student_profile`; `recordsEnabled` =
// `consent_records_enabled`; `guardianConsentRequired` = `guardian_consent_required`
// (already ANDed with records enabled by the resolver). All false = today's schema.
export interface WizardSchemaOptions {
  minimised: boolean;
  guardianConsentRequired: boolean;
  recordsEnabled: boolean;
}
