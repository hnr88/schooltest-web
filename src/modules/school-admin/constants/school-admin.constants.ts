// Lifecycle enum values exactly as the api::school.school schema declares them
// (schooltest-api/src/api/school/content-types/school/schema.json). C-SCH-01
// returns them verbatim, so the portal maps them to chips without translation.
export const SCHOOL_ACCOUNT_STATUSES = [
  'prospect',
  // `invited` (mission st-ops-onboarding): the ops user has sent the school its
  // onboarding magic link and nobody has redeemed it yet.
  'invited',
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

// Plan tiers exactly as the api::school.school schema declares them
// (schooltest-api/src/api/school/content-types/school/schema.json). The plan is
// stored on the SCHOOL record and drives test allowances, which analytics
// sections are available and what the Account page shows. Distinct from the
// entitlement's `plan_code`, which is the ops-facing commercial SKU string.
export const SCHOOL_PLANS = ['trial', 'full_license'] as const;
