import { z } from 'zod';

import {
  australianStateSchema,
  portalPlanSchema,
  sectorSchema,
} from '@schooltest/ops-contracts';

import type { SchoolCreateSchemaTranslator } from '@/modules/ops/types/school-create.types';

/**
 * Task 24 (`vSchool`, `Ops Portal.dc.html:1160-1178`) — a single field carries
 * three distinct blocking rules (empty / too short / too long); superRefine
 * keeps them to exactly one issue instead of zod's chained `.min().min()`
 * emitting one per failing check.
 */
function nameField(t: SchoolCreateSchemaTranslator) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value.length === 0) {
        ctx.addIssue({ code: 'custom', message: t('required') });
      } else if (value.length < 3) {
        ctx.addIssue({ code: 'custom', message: t('nameTooShort') });
      } else if (value.length > 255) {
        ctx.addIssue({ code: 'custom', message: t('tooLong') });
      }
    });
}

/** `vSchool`: phone is optional, but a non-empty value must look like a phone number. */
const PHONE_PATTERN = /^[+(]?[\d][\d\s()+-]{7,}$/;

function phoneField(t: SchoolCreateSchemaTranslator) {
  return z
    .string()
    .trim()
    .max(40, t('tooLong'))
    .superRefine((value, ctx) => {
      if (value !== '' && !PHONE_PATTERN.test(value)) {
        ctx.addIssue({ code: 'custom', message: t('phoneInvalid') });
      }
    });
}

/**
 * OPS-013 Create School modal. The enum OPTIONS come from the shared contract
 * so the dialog can never offer a value the versioned route would reject; the
 * empty-string union members are the "not chosen yet" state of the optional
 * selects and are stripped before the POST body is built.
 * `name` min 3 mirrors the server's schoolCreateSchema, not the visual's bare
 * "required" — a 1–2 char name must fail here, not as a 400 after submit.
 * The name-duplicate and email-domain/status-active checks are NOT here:
 * duplicate is an async server-directory pre-check run at submit time
 * (`use-school-create-form.ts`), and the two warnings never block, so they
 * cannot live in a schema that gates submission.
 */
export function createSchoolCreateFormSchema(t: SchoolCreateSchemaTranslator) {
  return z.object({
    name: nameField(t),
    suburb: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    state: z.union([australianStateSchema, z.literal('')]),
    sector: z.union([sectorSchema, z.literal('')]),
    plan: portalPlanSchema,
    status: z.enum(['pending_setup', 'trial', 'active']),
    contact_name: z.string().trim().min(1, t('required')).max(200, t('tooLong')),
    contact_email: z
      .string()
      .trim()
      .min(1, t('required'))
      .max(255, t('emailTooLong'))
      .pipe(z.email(t('emailInvalid'))),
    phone: phoneField(t),
  });
}

export type SchoolCreateFormValues = z.infer<ReturnType<typeof createSchoolCreateFormSchema>>;

/**
 * Task 10 — the EDIT mode reuses the SAME form shape; `status` (a
 * status-at-creation decision) is a CREATE-only control, and the plan is the
 * school's stored portal tier. The empty-string unions are the "not chosen"
 * state of optional selects; '' is stripped before the PATCH body is built.
 */
export function createSchoolEditFormSchema(t: SchoolCreateSchemaTranslator) {
  return z.object({
    name: nameField(t),
    suburb: z.string().trim().min(1, t('required')).max(100, t('tooLong')),
    state: z.union([australianStateSchema, z.literal('')]),
    sector: z.union([sectorSchema, z.literal('')]),
    postcode: z.string().trim().max(10, t('tooLong')),
    schoolType: z.union([z.enum(['combined', 'primary', 'secondary']), z.literal('')]),
    plan: portalPlanSchema,
    contact_name: z.string().trim().min(1, t('required')).max(200, t('tooLong')),
    contact_email: z
      .string()
      .trim()
      .min(1, t('required'))
      .max(255, t('emailTooLong'))
      .pipe(z.email(t('emailInvalid'))),
    phone: phoneField(t),
  });
}

export type SchoolEditFormValues = z.infer<ReturnType<typeof createSchoolEditFormSchema>>;
