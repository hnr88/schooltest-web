// Lifecycle enum values exactly as the api::school.school schema declares them
// (schooltest-api/src/api/school/content-types/school/schema.json). C-SCH-01
// returns them verbatim, so the portal maps them to chips without translation.
export const SCHOOL_ACCOUNT_STATUSES = [
  'prospect',
  'invoiced',
  'active',
  'suspended',
  'closed',
] as const;

export const SCHOOL_ONBOARDING_STATUSES = [
  'not_started',
  'link_sent',
  'in_progress',
  'submitted',
  'complete',
] as const;

// C-ENT-01 allowance test_type values (D-02/Q3), in display order.
export const TEST_TYPES = ['reading', 'listening', 'writing', 'speaking'] as const;
