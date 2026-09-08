import { describe, expect, it } from 'vitest';

import {
  BANNER_MESSAGE_MAX,
  platformSettingsSchema,
} from '@schooltest/ops-contracts';

import {
  BANNER_MESSAGE_MAX as CLIENT_BANNER_MESSAGE_MAX,
  createBannerFormSchema,
} from '@/modules/ops/schemas/flags-console.schema';

// The flags console's message bound is SOURCED from the contract, and this
// file is the teeth behind that claim. History: the client carried its own
// literal 2000 while the contract's settings-read projection caps the same
// field at 600 — an editor accepting ~1400 characters the read-side parse
// then refuses to render. A comment claimed the bound was "sourced from the
// contract"; the comment drifted with the code. So the assertions here do not
// compare constants with constants alone (both could drift together): they
// pin the shared constant to what the CONTRACT SCHEMA actually enforces on
// the wire field, and the client form schema to that same number.

describe('the flags console banner bound is the contract bound', () => {
  it('the client bound equals the number the contract exports', () => {
    expect(CLIENT_BANNER_MESSAGE_MAX).toBe(BANNER_MESSAGE_MAX);
  });

  it('the contract schema really enforces that number on the wire field', () => {
    // The projection's own field schema is the authority the client bound
    // must mirror — asserting against the shape, not the exported constant,
    // is what keeps this honest if someone edits either side.
    const field = platformSettingsSchema.shape.announcement_message;
    expect(field.safeParse('x'.repeat(BANNER_MESSAGE_MAX)).success).toBe(true);
    expect(field.safeParse('x'.repeat(BANNER_MESSAGE_MAX + 1)).success).toBe(false);
  });

  it('the client form schema rejects what the projection would refuse', () => {
    // The full drift scenario, end to end: the editor's own schema (the thing
    // that gates the Save button) must refuse a message one character past
    // the projection cap — the operator cannot type their way into a banner
    // the settings screen then fails to render.
    const schema = createBannerFormSchema('required', 'too long');
    expect(
      schema.safeParse({ enabled: true, message: 'x'.repeat(BANNER_MESSAGE_MAX + 1), level: 'info' })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({ enabled: true, message: 'x'.repeat(BANNER_MESSAGE_MAX), level: 'info' })
        .success,
    ).toBe(true);
  });
});
