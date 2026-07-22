// Canonical 2a §3a "Recent results" is a four-row table under its uppercase head
// row, and canonical never lets a panel grow past the 780px content budget.
export const RECENT_STUDENTS_LIMIT = 4;
// Canonical AvatarStack (§03) shows five discs then a "+N".
export const FAMILY_AVATAR_LIMIT = 5;
// Canonical Parent overview (App Screens 2a §2) puts TWO child cards on the
// screen, side by side — never a wall of them. The rest of the family is reached
// through the roster panel below and the "View my children" link, exactly as the
// canonical screen does. Four cards is what made this surface read as one
// component repeated.
export const FEATURED_STUDENTS_LIMIT = 2;
export const RECENTLY_ADDED_DAYS = 7;
// Canonical ledger list (2a:2501) shows four rows and closes with a bare link.
export const ACTIVITY_ROWS_LIMIT = 4;

// Entrance stagger for grids/rows — literal classes so Tailwind's scanner keeps them.
export const STAGGER_DELAYS = ['delay-0', 'delay-75', 'delay-150', 'delay-200'] as const;

// The six ticks of the per-child readiness rail (spec 01 §4.5 geometry, Amendment
// A1 data). Message keys are spelled out rather than built from the field name so
// next-intl still type-checks every one of them.
export const READINESS_FIELD_LABEL_KEYS = {
  familyName: 'readinessFieldFamilyName',
  email: 'readinessFieldEmail',
  nationality: 'readinessFieldNationality',
  yearLevel: 'readinessFieldYearLevel',
  entryYear: 'readinessFieldEntryYear',
  entryTerm: 'readinessFieldEntryTerm',
} as const;

// "Recommended this week" (spec 01 §6.2) is a three-row list.
export const RECOMMENDATION_LIMIT = 3;

// Copy for each recommendation kind, spelled out per kind so next-intl still
// type-checks every message key.
export const RECOMMENDATION_COPY_KEYS = {
  addChild: {
    title: 'recommendAddChildTitle',
    meta: 'recommendAddChildMeta',
    action: 'recommendAddChildAction',
  },
  setPlan: {
    title: 'recommendSetPlanTitle',
    meta: 'recommendSetPlanMeta',
    action: 'recommendOpenAction',
  },
  completeProfile: {
    title: 'recommendCompleteProfileTitle',
    meta: 'recommendCompleteProfileMeta',
    action: 'recommendOpenAction',
  },
  exploreSchools: {
    title: 'recommendExploreSchoolsTitle',
    meta: 'recommendExploreSchoolsMeta',
    action: 'recommendExploreSchoolsAction',
  },
} as const;

// Transform-only entrance: a fade would leave elements at partial opacity while an
// axe pass runs and report every child as a contrast failure.
export const METRIC_ENTER =
  'animate-in fill-mode-backwards duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none';
