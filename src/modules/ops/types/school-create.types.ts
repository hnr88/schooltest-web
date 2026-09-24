import type { UseFormReturn } from 'react-hook-form';

import type { SchoolCreateFormValues, SchoolEditFormValues } from '@/modules/ops/schemas/school-create.schema';

export type SchoolCreateSchemaTranslator = (key: string) => string;

/** What the C-OPS-PORTAL-003 mutation needs: the form values plus the key. */
export interface SchoolCreateInput {
  values: SchoolCreateFormValues;
  idempotencyKey: string;
}

/** The loaded school the EDIT modal prefills from and guards with. */
export interface SchoolEditDraft {
  documentId: string;
  name: string;
  suburb: string | null;
  state: string | null;
  sector: string | null;
  postcode: string | null;
  schoolType: string | null;
  contact_email: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  phone: string | null;
  contact_name: string | null;
  plan: string | null;
  portal_plan: string | null;
  timezone: string | null;
  /** True when a person chose `timezone`; false when it follows the state. */
  timezone_manual: boolean;
  updatedAt: string;
}

export interface UseSchoolCreateFormInput {
  onDone: () => void;
  /** Present = EDIT mode: the dialog prefills from it and writes with If-Match. */
  school?: SchoolEditDraft;
}

/** The controlled EDIT modal: opened by the school detail with the loaded draft. */
export interface OpsEditSchoolDialogProps {
  school: SchoolEditDraft;
  onDone: () => void;
}

export interface OpsCreateSchoolFieldsProps {
  form: UseFormReturn<SchoolCreateFormValues>;
  /** A valid-but-non-school-domain contact email WARNS without blocking. */
  emailWarning?: boolean;
  /** Creating with status Active WARNS without blocking (create only). */
  statusWarning?: boolean;
}

export interface OpsEditSchoolFieldsProps {
  form: UseFormReturn<SchoolEditFormValues>;
  /** A valid-but-non-school-domain email WARNS without blocking (task 10). */
  emailWarning?: boolean;
  /** The zone the "Automatic (from state)" option stands for, when known. */
  automaticZone?: string | null;
}
