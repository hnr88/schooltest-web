// C-ONB-01/02/03 shapes plus the wizard's local state model (spec section 4).

export type OnboardingStepKey = 'school' | 'teachers' | 'review' | 'admin';

export interface OnboardingStepDefinition {
  key: OnboardingStepKey;
  label: string;
}

// School details are stored as plain strings locally; the step schema narrows
// state/sector to the contract enums on submit.
export interface SchoolDetails {
  name: string;
  suburb: string;
  state: string;
  postcode: string;
  sector: string;
}

export type TeacherRole = 'teacher' | 'school_admin';

export interface TeacherEntry {
  first_name: string;
  last_name: string;
  email: string;
  role: TeacherRole;
}

// The admin password is NEVER part of the payload: it lives only in the final
// step's form state and goes straight into the C-ONB-03 body.
export interface AdminDetails {
  first_name: string;
  last_name: string;
  email: string;
}

export interface SchoolOnboardingPayload {
  school: SchoolDetails;
  teachers: TeacherEntry[];
  admin: AdminDetails;
}

// D-3 / D-01: every field carries provenance. AI prefill is design-only, so
// manual entry always writes { source: 'manual', state: 'confirmed' }; the
// 'suggested' state exists for the prefilled school record and future AI import.
export type ProvenanceSource = 'manual' | 'ai';
export type ProvenanceState = 'suggested' | 'confirmed';

export interface FieldProvenance {
  source: ProvenanceSource;
  state: ProvenanceState;
}

export type ProvenanceMap = Record<string, FieldProvenance>;

// C-ONB-01 data payload.
export interface OnboardingSchoolSummary {
  name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  sector: string | null;
}

export interface SchoolOnboardingData {
  school: OnboardingSchoolSummary;
  current_step: number;
  payload: Record<string, unknown>;
  provenance: ProvenanceMap;
  expires_at: string;
}

// C-ONB-02 data payload.
export interface SaveProgressResult {
  current_step: number;
  saved_at: string;
}

// C-ONB-03 data payload.
export interface CompleteOnboardingResult {
  jwt: string;
  user: {
    documentId: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

// The four guest-facing link states (404/410/409/network).
export type OnboardingLinkState = 'invalid' | 'expired' | 'used' | 'unavailable';
