import { describe, expect, it } from 'vitest';

import { registerSchema } from '@/modules/eald/schemas/register.schema';

/**
 * First user of the new unit tier (Lane J): the landing pilot-registration
 * schema. The client-side twin of the server validator in
 * schooltest-api/src/api/pilot-registration/lib/submit-schema.ts — its failure
 * modes are the exact ones the public endpoint must reject server-side too.
 * Offline by construction (pure Zod).
 */

const VALID = {
  name: 'Jane Smith',
  school: 'Test High School',
  role: 'Head of department',
  email: 'jane@school.edu.au',
  students: '21–50',
};

describe('registerSchema', () => {
  it('accepts a fully valid registration', () => {
    expect(registerSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects each missing required field with its i18n key', () => {
    const cases = [
      { key: 'name', msg: 'nameRequired' },
      { key: 'school', msg: 'schoolRequired' },
      { key: 'role', msg: 'roleRequired' },
      { key: 'students', msg: 'studentsRequired' },
    ] as const;
    for (const { key, msg } of cases) {
      const result = registerSchema.safeParse({ ...VALID, [key]: '' });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(JSON.stringify(result.error.issues)).toContain(msg);
    }
  });

  it('rejects a malformed email with the emailInvalid key', () => {
    const result = registerSchema.safeParse({ ...VALID, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(JSON.stringify(result.error.issues)).toContain('emailInvalid');
  });

  it('rejects whitespace-only required fields (client can never submit them)', () => {
    expect(registerSchema.safeParse({ ...VALID, name: '  ' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...VALID, school: '   ' }).success).toBe(false);
  });
});
