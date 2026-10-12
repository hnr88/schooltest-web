import { z } from 'zod';

// W3-20: mirrors schooltest-api/src/contracts/mfa.ts (C-MFA verify) by hand.
// Messages are Auth-namespace keys (change-password.schema.ts pattern). The
// request is STRICT with exactly one of the two factors, as the API's is; the
// response is read tolerantly so an additive server field cannot strand a
// person who has just verified.

/** Six digits exactly, as typed from an authenticator app. */
export const mfaCodeSchema = z.string().regex(/^\d{6}$/, 'mfaInvalidCode');

/** Recovery codes are shown `XXXXX-XXXXX`; the server ignores case, dashes and spaces. */
export const mfaRecoveryCodeSchema = z.string().min(10, 'mfaInvalidCode').max(24, 'mfaInvalidCode');

export const mfaVerifyRequestSchema = z.union([
  z.object({ code: mfaCodeSchema }).strict(),
  z.object({ recoveryCode: mfaRecoveryCodeSchema }).strict(),
]);

export const mfaVerifyResponseSchema = z.object({
  jwt: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});

export type MfaVerifyInput = z.infer<typeof mfaVerifyRequestSchema>;

// W3-22: the enrolment surface of the same contract (status, enrol start, enrol
// confirm). Requests are STRICT as the API's are; responses are read tolerantly
// (unknown keys are stripped) so an additive server field cannot strand a
// person part-way through enrolment. The secret and recovery codes are
// secret-bearing: nothing here is persisted, the panel holds them in component
// state only.

/** The eight-digit code mailed to the account address. */
export const MFA_EMAIL_CODE_DIGITS = 8;
export const mfaEmailCodeSchema = z
  .string()
  .regex(new RegExp(`^\\d{${MFA_EMAIL_CODE_DIGITS}}$`), 'mfaInvalidCode');

/** GET /api/auth/mfa/status. */
export const mfaStatusResponseSchema = z.object({
  available: z.boolean(),
  enrolled: z.boolean().default(false),
  required: z.boolean().default(false),
  optional: z.boolean().default(false),
  enrolledAt: z.string().nullable().default(null),
  recoveryCodesRemaining: z.number().int().min(0).default(0),
  verifiedThisSession: z.boolean().default(false),
});

/** POST /api/auth/mfa/enrol/start - empty body asks for the emailed code. */
export const mfaEnrolStartRequestSchema = z
  .object({ emailCode: mfaEmailCodeSchema.optional() })
  .strict();

export const mfaEnrolCodeSentResponseSchema = z.object({
  sent: z.literal(true),
  expiresInSeconds: z.number().int().positive(),
});

export const mfaEnrolSecretResponseSchema = z.object({
  secret: z.string().min(16),
  otpauthUri: z.string().startsWith('otpauth://totp/'),
  issuer: z.string().min(1),
  account: z.string().min(1),
});

export const mfaEnrolStartResponseSchema = z.union([
  mfaEnrolCodeSentResponseSchema,
  mfaEnrolSecretResponseSchema,
]);

/** POST /api/auth/mfa/enrol/confirm. */
export const mfaEnrolConfirmRequestSchema = z.object({ code: mfaCodeSchema }).strict();

export const mfaEnrolConfirmResponseSchema = z.object({
  recoveryCodes: z.array(z.string().min(1)).length(8),
  jwt: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});

export type MfaStatusResponse = z.infer<typeof mfaStatusResponseSchema>;
export type MfaEnrolStartInput = z.infer<typeof mfaEnrolStartRequestSchema>;
export type MfaEnrolStartResponse = z.infer<typeof mfaEnrolStartResponseSchema>;
export type MfaEnrolSecretResponse = z.infer<typeof mfaEnrolSecretResponseSchema>;
export type MfaEnrolConfirmInput = z.infer<typeof mfaEnrolConfirmRequestSchema>;
export type MfaEnrolConfirmResponse = z.infer<typeof mfaEnrolConfirmResponseSchema>;
