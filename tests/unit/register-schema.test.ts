import { jsx } from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

import messages from '@/i18n/messages/en.json';
import { RegisterSection } from '@/modules/eald/components/RegisterSection';
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

describe('registration layout', () => {
  it('keeps the five labelled fields and adds the real privacy link and founding-school photo', () => {
    const client = new QueryClient();
    const html = renderToStaticMarkup(
      jsx(QueryClientProvider, {
        client,
        children: jsx(NextIntlClientProvider, {
          locale: 'en',
          messages,
          children: jsx(RegisterSection, {}),
        }),
      }),
    );
    const container = document.createElement('div');
    container.innerHTML = html;
    expect(
      Array.from(container.querySelectorAll('form label input, form label select')).map((field) =>
        field.getAttribute('name'),
      ),
    ).toEqual(['name', 'school', 'role', 'email', 'students']);
    expect(container.querySelector('a[href="/privacy-policy"]')).not.toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelectorAll('li')).toHaveLength(3);
    expect(container.querySelector('button[type="submit"]')?.textContent).toBe(
      messages.Eald.home.register.submitButton,
    );
    client.clear();
  });
});
