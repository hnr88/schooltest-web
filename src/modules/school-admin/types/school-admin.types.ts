import type {
  SCHOOL_ACCOUNT_STATUSES,
  SCHOOL_ONBOARDING_STATUSES,
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
