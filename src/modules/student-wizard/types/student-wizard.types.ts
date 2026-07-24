import type { KeyboardEvent, ReactNode, Ref } from 'react';
import type { LucideIcon } from 'lucide-react';

import type { ChoiceOption } from '@/modules/design-system';
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

// >5-option canonical select (DS §06). `value` stays the wire value — a number for
// the SchoolTest testing band, a string for every other enum.
export interface WizardSelectOption {
  value: string | number;
  label: string;
}

export interface WizardSelectFieldProps {
  id: string;
  label: string;
  placeholder: string;
  options: readonly WizardSelectOption[];
  value: string | number | null;
  helper?: string;
  error?: string;
  required?: boolean;
  triggerRef?: Ref<HTMLButtonElement>;
  onValueChange: (value: string | number) => void;
}

// 2–5 short mutually exclusive labels inside a form → the portal chip row
// (spec 03 §1.4 `PortalChip`). One tab stop, arrows move the answer.
export type WizardChipSize = 'wide' | 'medium';

export interface WizardChoiceFieldProps {
  id: string;
  label: string;
  options: readonly ChoiceOption[];
  value: string;
  helper?: string;
  error?: string;
  required?: boolean;
  size?: WizardChipSize;
  onValueChange: (value: string) => void;
}

export interface WizardChipGroupProps {
  options: readonly ChoiceOption[];
  value: string;
  ariaLabelledBy: string;
  invalid?: boolean;
  size?: WizardChipSize;
  onValueChange: (value: string) => void;
}

// The props `useWizardChoice` hands each chip — the whole radiogroup contract in
// one object so the component never re-states an ARIA attribute by hand.
export interface WizardChoiceItemProps {
  role: 'radio';
  type: 'button';
  'data-value': string;
  'aria-checked': boolean;
  tabIndex: number;
  ref: (node: HTMLButtonElement | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onClick: () => void;
}

export interface WizardFieldProps {
  id: string;
  label: string;
  labelId?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

// One row of the step rail (spec 03 §2.2): title + hint, plus the state the dot,
// the connector and the two type ramps are drawn from.
export interface WizardRailStep {
  key: WizardStepKey;
  title: string;
  hint: string;
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
// `teacher`/`class`/`user` can never appear. Everything the wizard renders is
// required except `year_level`/`parent_guardian_wechat`; media keep `| null`
// only for the edit path's explicit clear semantics (create never sends null).
export interface StudentCreatePayload {
  given_name: string;
  family_name: string;
  email: string;
  date_of_birth: string;
  gender: Gender;
  nationality: string;
  passport_number: string;
  current_school: string;
  current_year_level: CurrentYearLevel;
  target_entry_year: string;
  target_entry_term: Term;
  parent_guardian_name: string;
  parent_guardian_phone: string;
  parent_guardian_email: string;
  preferred_contact_channel: ContactChannel;
  photo: number | null;
  voice_intro: number | null;
  year_level?: number;
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

// One row of the step-5 summary table (spec 03 §2.8): a key on the left and a
// ` · `-joined sentence on the right. Every segment comes from what the parent
// actually typed — an empty optional is dropped from the join, never invented, so
// a row with nothing behind it renders `value: null` → the em-dash.
export interface ReviewRowModel {
  label: string;
  value: string | null;
}

export interface ReviewModel {
  rows: ReviewRowModel[];
}

export type { StudentWizardValues, StudentWizardOutput };
