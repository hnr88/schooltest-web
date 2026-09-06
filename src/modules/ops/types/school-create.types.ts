import type { UseFormReturn } from 'react-hook-form';

import type { SchoolCreateFormValues, SchoolEditFormValues } from '@/modules/ops/schemas/school-create.schema';

export type SchoolCreateSchemaTranslator = (key: string) => string;

/** What the C-OPS-PORTAL-003 mutation needs: the form values plus the key. */
export interface SchoolCreateInput {
  values: SchoolCreateFormValues;
  idempotencyKey: string;
}

/** What the C-OPS-PORTAL-004 mutation needs: the patch, the version, the id. */
export interface SchoolEditInput {
  documentId: string;
  patch: Record<string, unknown>;
  ifMatch: string;
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
  updatedAt: string;
}

export interface UseSchoolCreateFormInput {
  onDone: () => void;
  /** Present = EDIT mode: the dialog prefills from it and writes with If-Match. */
  school?: SchoolEditDraft;
}

/**
 * The dialog mounts SELF-MANAGED (create, own open state + trigger button) or
 * CONTROLLED (edit, opened by its parent with the loaded school draft).
 */
export interface OpsCreateSchoolDialogProps {
  editSchool?: SchoolEditDraft;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDone?: () => void;
}

/** The controlled EDIT modal: opened by the school detail with the loaded draft. */
export interface OpsEditSchoolDialogProps {
  school: SchoolEditDraft;
  onDone: () => void;
}

export interface OpsCreateSchoolFieldsProps {
  form: UseFormReturn<SchoolCreateFormValues | SchoolEditFormValues>;
  /** A valid-but-non-school-domain email WARNS without blocking (task 10). */
  emailWarning?: string | null;
}
