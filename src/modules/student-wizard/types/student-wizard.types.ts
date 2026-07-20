import type { LucideIcon } from 'lucide-react';

import type {
  StudentWizardOutput,
  StudentWizardValues,
} from '@/modules/student-wizard/schemas/student-wizard.schema';

// Field enums — kept in lockstep with the `*_VALUES` tuples in the constants
// (single runtime source); declared here so props/types never import runtime.
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ContactChannel = 'whatsapp' | 'wechat' | 'email' | 'sms';
export type Term = 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4';
export type CurrentYearLevel =
  | 'Prep'
  | 'Year 1'
  | 'Year 2'
  | 'Year 3'
  | 'Year 4'
  | 'Year 5'
  | 'Year 6'
  | 'Year 7'
  | 'Year 8'
  | 'Year 9'
  | 'Year 10'
  | 'Year 11'
  | 'Year 12';

export type WizardMode = 'create' | 'edit';
export type WizardStepKey = 'personal' | 'education' | 'guardian' | 'media' | 'review';
export type WizardMediaKey = 'photo' | 'voice_intro';

export interface ContactChannelOption {
  value: ContactChannel;
  icon: LucideIcon;
}

// Reused for both /dashboard/children/new (create) and the edit route (054):
// documentId + initialValues + mode are reserved for the edit wiring. `onSubmit`
// overrides the create mutation with the edit `PUT` path (wired in 054).
export interface WizardScreenProps {
  documentId?: string;
  initialValues?: Partial<StudentWizardValues>;
  mode?: WizardMode;
  onSubmit?: (values: StudentWizardOutput) => Promise<void>;
}

// C-STUDENT-CREATE whitelist payload — the ONLY keys the client may send. Built
// by construction (build-student-payload) so `parent`/`status`/`student_key`/
// `teacher`/`class`/`user` can never appear. Empty optionals omitted; media as
// numeric file id or explicit null.
export interface StudentCreatePayload {
  given_name: string;
  family_name: string;
  nationality: string;
  target_entry_year: string;
  target_entry_term: Term;
  parent_guardian_name: string;
  parent_guardian_phone: string;
  preferred_contact_channel: ContactChannel;
  photo: number | null;
  voice_intro: number | null;
  email?: string;
  date_of_birth?: string;
  gender?: Gender;
  passport_number?: string;
  current_school?: string;
  current_year_level?: CurrentYearLevel;
  year_level?: number;
  parent_guardian_email?: string;
  parent_guardian_wechat?: string;
}

// CONTRACTS.md typed-error envelope: { error: { status, name, message, details? } }.
export interface WizardSubmitErrorPayload {
  error?: {
    status?: number;
    name?: string;
    message?: string;
    details?: { fields?: string[]; issues?: string[] };
  };
}

// Submit classifier result (classify-wizard-error): 400 → generic validation
// alert (server re-validation, optional detail message), 403 → server (grant
// regression), no response → offline, anything else → server.
export type WizardSubmitError =
  | { kind: 'offline' }
  | { kind: 'server' }
  | { kind: 'validation'; message?: string };

export interface ReviewRowModel {
  label: string;
  value: string | null;
}

export interface ReviewSectionModel {
  id: string;
  title: string;
  step: number;
  rows: ReviewRowModel[];
}

export type { StudentWizardValues, StudentWizardOutput };
