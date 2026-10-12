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
