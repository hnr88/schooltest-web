import { z } from 'zod';

// Web mirror of the API contract (schooltest-api/src/contracts/consents.ts, W4-06 and
// W4-11). It is mirrored, never imported from the API repo (D5). Every response is
// parsed, so a renamed, retyped or missing field fails loudly instead of rendering
// a half-true consent state. Unknown extra fields are stripped, so an additive API
// change never takes the panel down.
const nonEmpty = z.string().min(1);

export const consentTypeSchema = z.enum(['data_collection', 'ai_processing', 'recording_monitoring']);

export const consentSourceSchema = z.enum([
  'parent_wizard',
  'parent_portal',
  'school_attestation',
  'import',
  'ops',
]);

const consentGrantedByRoleSchema = z.enum(['parent', 'school_admin', 'ops']);

// `<consent_type>@<version>`, for example `ai_processing@1`.
const consentStatementKeySchema = z.string().regex(/^[a-z_]+@[1-9]\d*$/);

export const consentConfigSchema = z.object({
  consent_records_enabled: z.boolean(),
  guardian_consent_required: z.boolean(),
  ai_consent_required: z.boolean(),
  ai_consent_source: z.enum(['flag', 'env', 'off']),
  minimised_student_profile: z.boolean(),
  student_erasure_enabled: z.boolean(),
  policy: z.object({ slug: nonEmpty, version: nonEmpty }),
  statements: z.array(
    z.object({ key: consentStatementKeySchema, type: consentTypeSchema, text: nonEmpty }),
  ),
});

export const consentRecordSchema = z.object({
  documentId: nonEmpty,
  consent_type: consentTypeSchema,
  student_document_id: nonEmpty,
  school_document_id: z.string().nullable(),
  granted_by_role: consentGrantedByRoleSchema,
  source: consentSourceSchema,
  policy_slug: z.string().nullable(),
  policy_version: z.string().nullable(),
  statement_key: consentStatementKeySchema,
  granted_at: nonEmpty,
  withdrawn_at: z.string().nullable(),
  withdrawn_reason: z.string().nullable(),
});

export const consentConfigResponseSchema = z.object({ data: consentConfigSchema });
export const consentListResponseSchema = z.object({ data: z.array(consentRecordSchema) });
export const consentRecordResponseSchema = z.object({ data: consentRecordSchema });

// POST /api/consents body. A guardian sends no evidence (the API answers 400 if one
// does), so this client never builds one.
export const consentGrantBodySchema = z.object({
  student_document_id: nonEmpty,
  consent_type: consentTypeSchema,
  statement_key: consentStatementKeySchema,
});

// POST /api/consents/:documentId/withdraw body: the reason is optional and this
// panel has no field for one, so the body is empty.
export const consentWithdrawBodySchema = z.object({ reason: z.string().max(200).optional() });
