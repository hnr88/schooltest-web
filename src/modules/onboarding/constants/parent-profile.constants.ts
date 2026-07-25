import type { ParentRelationship, PreferredContactMethod } from '@/modules/auth';

// 1:1 with the C-PAR-UPDATE-ME enums (schooltest-api update-me.ts).
export const RELATIONSHIP_VALUES: readonly ParentRelationship[] = [
  'mother',
  'father',
  'guardian',
  'grandparent',
  'other',
];

export const CONTACT_METHOD_VALUES: readonly PreferredContactMethod[] = [
  'email',
  'phone',
  'whatsapp',
  'wechat',
];

// Legacy phone shape shared with the server: optional leading '+', then ≥6
// digits/spaces/()/-.
export const PHONE_PATTERN = /^\+?[\d\s()-]{6,}$/;
