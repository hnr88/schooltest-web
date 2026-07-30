import type {
  SCHOOL_ACCOUNT_STATUSES,
  SCHOOL_ONBOARDING_STATUSES,
  TEST_TYPES,
} from '@/modules/school-admin/constants/school-admin.constants';

export type SchoolAccountStatus = (typeof SCHOOL_ACCOUNT_STATUSES)[number];
export type SchoolOnboardingStatus = (typeof SCHOOL_ONBOARDING_STATUSES)[number];

// C-SCH-01 (GET /api/schools/me) payload — the caller's own school, limited
// server-side to ME_FIELDS in the api::school.school controller.
export interface SchoolMe {
  documentId: string;
  name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  sector: string | null;
  account_status: SchoolAccountStatus;
  onboarding_status: SchoolOnboardingStatus;
}

// Strapi v5 transformResponse envelope for a single entity.
export interface SchoolMeResponse {
  data: SchoolMe;
}

export type TestType = (typeof TEST_TYPES)[number];

// C-ENT-01 (GET /api/schools/me/entitlement): one allowance row per Progress
// Test type; `remaining` is computed server-side at read.
export interface Allowance {
  test_type: TestType;
  total: number;
  used: number;
  remaining: number;
}

// C-ENT-01 payload. seats_used is the live count of active students, never
// stored. renewal_date is null until ops sets one.
export interface Entitlement {
  plan_code: string;
  seats_total: number;
  seats_used: number;
  seats_remaining: number;
  allowances: Allowance[];
  renewal_date: string | null;
  account_status: SchoolAccountStatus;
}

export interface EntitlementResponse {
  data: Entitlement;
}
