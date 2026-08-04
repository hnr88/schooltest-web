import { z } from 'zod';

import {
  CONTACT_METHOD_VALUES,
  PHONE_PATTERN,
  RELATIONSHIP_VALUES,
} from '@/modules/onboarding/constants/parent-profile.constants';

import type { ParentProfileSchema, ProfileSchemaTranslator } from '@/modules/onboarding/types/schemas.types';

// Client mirror of the C-PAR-UPDATE-ME whitelist rules (schooltest-api
// update-me.ts). The 10 completion-rule fields are required here; the 5
// optional ones accept '' (the server treats '' as "clear").
export function createParentProfileSchema(t: ProfileSchemaTranslator) {
  const requiredPhone = z
    .string()
    .trim()
    .min(1, t('required'))
    .max(50, t('tooLong'))
    .regex(PHONE_PATTERN, t('phoneInvalid'));

  return z.object({
    first_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    last_name: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    relationship_to_student: z.enum(RELATIONSHIP_VALUES, { error: t('required') }),
    occupation: z.string().trim().max(120, t('tooLong')),
    phone: requiredPhone,
    secondary_phone: z.union([
      z.literal(''),
      z.string().trim().max(50, t('tooLong')).regex(PHONE_PATTERN, t('phoneInvalid')),
    ]),
    preferred_contact_method: z.enum(CONTACT_METHOD_VALUES, { error: t('required') }),
    address_line: z.string().trim().min(1, t('required')).max(255, t('tooLong')),
    city: z.string().trim().min(1, t('required')).max(120, t('tooLong')),
    state_region: z.string().trim().max(120, t('tooLong')),
    postal_code: z.string().trim().max(32, t('tooLong')),
    country_of_residence: z
      .string()
      .min(1, t('required'))
      .regex(/^[A-Za-z]{2}$/, t('countryInvalid')),
    emergency_contact_name: z.string().trim().min(1, t('required')).max(120, t('tooLong')),
    emergency_contact_phone: requiredPhone,
    emergency_contact_relationship: z.string().trim().max(80, t('tooLong')),
  });
}

// PUT /api/users/me responds with the bare sanitized user (no envelope, no
// role) plus `profileCompleted` for parents. Loose schema: the form relies only
// on the completion flag; the whitelist fields merge into the me cache as sent.
export const updateMeResponseSchema = z
  .object({
    id: z.number(),
    profileCompleted: z.boolean().optional(),
  })
  .loose();
