import { z } from 'zod';
import {
  BANNER_MESSAGE_MAX,
  RATE_LIMIT_MAX_MAX,
  RATE_LIMIT_MAX_MIN,
  RATE_LIMIT_WINDOW_MAX_MS,
  RATE_LIMIT_WINDOW_MIN_MS,
  announcementLevelSchema,
} from '@schooltest/ops-contracts';

// Ledger 9 — the Flags console's two form schemas.
//
// Both are FACTORIES rather than constants because their messages are
// translated: the schema is the single place that decides what is valid, and
// the copy still comes from the catalog (the `createSchoolEditFormSchema`
// precedent in this module).

/**
 * Re-exported, not restated: the bound IS the contract's settings-read
 * projection cap (600), so this client check and the read the portal renders
 * are one number by construction. The previous literal here was 2000 — a
 * drift that let an editor accept ~1400 characters the read-side parse
 * refuses to render. The unit suite pins the two together
 * (tests/unit/ops-flags-console-bounds.test.ts), so the claim survives
 * without trusting this comment.
 */
export { BANNER_MESSAGE_MAX };

/**
 * A banner that is ON must say something — an enabled empty banner renders a
 * blank bar to every visitor. Turning one OFF needs no message, so the rule is
 * conditional rather than a blanket required field.
 */
export function createBannerFormSchema(messageRequired: string, tooLong: string) {
  return z
    .object({
      enabled: z.boolean(),
      message: z.string().max(BANNER_MESSAGE_MAX, tooLong),
      level: announcementLevelSchema,
    })
    .superRefine((values, ctx) => {
      if (values.enabled && values.message.trim().length === 0) {
        ctx.addIssue({ code: 'custom', path: ['message'], message: messageRequired });
      }
    });
}

export type BannerFormValues = z.infer<ReturnType<typeof createBannerFormSchema>>;

/**
 * The bounds mirror the API controller's own validation, sourced from the
 * contract so a client check cannot drift into permitting what the server
 * refuses.
 *
 * NOT coerced, deliberately: the inputs convert through `valueAsNumber` (the
 * `OpsSettingsControl` precedent), so the form value is already a number and a
 * non-numeric entry arrives as NaN — which fails the base `z.number()` with
 * the same bounds message instead of slipping through. A `z.coerce` schema
 * would also widen the resolver's input type to `unknown` and stop matching
 * the form's own type.
 */
export function createRateLimitFormSchema(maxMessage: string, windowMessage: string) {
  return z.object({
    max: z
      .number({ message: maxMessage })
      .int(maxMessage)
      .min(RATE_LIMIT_MAX_MIN, maxMessage)
      .max(RATE_LIMIT_MAX_MAX, maxMessage),
    window_ms: z
      .number({ message: windowMessage })
      .int(windowMessage)
      .min(RATE_LIMIT_WINDOW_MIN_MS, windowMessage)
      .max(RATE_LIMIT_WINDOW_MAX_MS, windowMessage),
  });
}

export type RateLimitFormValues = z.infer<ReturnType<typeof createRateLimitFormSchema>>;
