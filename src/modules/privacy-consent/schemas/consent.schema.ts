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

// ---- W4-21 (D5 S1, S3): school attestation and student erasure ----------------

/** The two purposes a school may attest. Recording and monitoring is never school-attestable. */
export const consentAttestationTypeSchema = z.enum(['data_collection', 'ai_processing']);

export const CONSENT_ATTESTATION_REFERENCE_MAX = 120;

// The optional `consent_attestation` object W4-14 accepts on the school create and
// on the import commit (schooltest-api/src/api/school/lib/students-consent.ts).
// `reference` is part of the contract; this client has no field for one yet, so it
// is never set here.
export const consentAttestationBodySchema = z.strictObject({
  consent_types: z.array(consentAttestationTypeSchema).min(1).max(2),
  reference: z.string().trim().min(1).max(CONSENT_ATTESTATION_REFERENCE_MAX).optional(),
});

/** The only two channels and the one verification method the school route accepts (W4-20). */
export const ERASE_CHANNELS = ['school_initiated', 'guardian_email'] as const;
export const eraseChannelSchema = z.enum(ERASE_CHANNELS);

export const ERASE_REFERENCE_MAX = 120;

// POST /api/schools/me/children/:documentId/erase body. The school detail never
// exposes `student_key`, so the student is confirmed with the typed given name.
export const eraseStudentBodySchema = z.strictObject({
  confirm_given_name: z.string().trim().min(1).max(200),
  request: z.strictObject({
    channel: eraseChannelSchema,
    reference: z.string().trim().min(1).max(ERASE_REFERENCE_MAX),
    received_at: z.iso.datetime({ offset: true }),
    verification_method: z.literal('school_admin_authenticated'),
  }),
});

// The API also answers `student_key`. It is deliberately not part of this schema,
// so it is stripped on parse and never reaches component state or the cache.
export const eraseStudentResponseSchema = z.object({
  data: z.object({
    erased: z.boolean(),
    counts: z.record(z.string(), z.number().int().nonnegative()),
  }),
});
