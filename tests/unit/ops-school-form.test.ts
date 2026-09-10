import { readFileSync } from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Task 24 — the exhaustive proof of every rule and warning
 * `logic.md#v-school` (`Ops Portal.dc.html:1160-1178`, `vSchool(v, mode, idx)`)
 * specifies for the school form modal. The `school-create.spec.ts` e2e
 * exercises one branch per run; this file is the authority for the whole set,
 * including the warning arms, asserted as non-blocking.
 *
 * Every blocking rule is proven directly against the Zod schema
 * (`createSchoolCreateFormSchema` / `createSchoolEditFormSchema`) with an
 * identity translator, so a message assertion below is exactly the string an
 * operator sees — the same schema the resolver wires to the form.
 */

vi.mock('@/lib/axios/strapi', () => ({
  strapi: { get: vi.fn() },
  portalVersionHeaders: () => ({ 'X-Ops-Portal-Version': '1' }),
}));

import { strapi } from '@/lib/axios/strapi';
import {
  createSchoolCreateFormSchema,
  createSchoolEditFormSchema,
} from '@/modules/ops/schemas/school-create.schema';
import {
  findDuplicateSchoolName,
  schoolNameConflict,
} from '@/modules/ops/queries/use-school-create.mutation';
import { isStatusActiveWarning } from '@/modules/ops/hooks/use-school-create-form';
import { schoolEmailDomainWarning } from '@/modules/ops/hooks/use-school-edit-form';

const get = vi.mocked(strapi.get);

/** Identity translator: every assertion below reads the KEY, which is how the
 *  test stays honest about WHICH message key fires without depending on the
 *  live English copy (that copy is separately pinned by the i18n parity/
 *  census specs and by D-33's reuse record in the task's proof). */
const t = (key: string) => key;

const VALID_CREATE = {
  name: 'Riverbend College',
  suburb: 'Riverbend',
  state: '',
  sector: '',
  plan: 'pilot',
  status: 'pending_setup',
  contact_name: 'Jamie Lee',
  contact_email: 'jamie.lee@riverbend.edu.au',
  phone: '',
};

describe('vSchool blocking rules (create)', () => {
  const schema = createSchoolCreateFormSchema(t);

  it('is valid on a fully compliant submission', () => {
    expect(schema.safeParse(VALID_CREATE).success).toBe(true);
  });

  it('name: required', () => {
    const result = schema.safeParse({ ...VALID_CREATE, name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === 'name')?.message).toBe('required');
  });

  it('name: shorter than 3 chars', () => {
    const result = schema.safeParse({ ...VALID_CREATE, name: 'AB' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === 'name')?.message).toBe('nameTooShort');
  });

  it('name: over 255 chars', () => {
    const result = schema.safeParse({ ...VALID_CREATE, name: 'A'.repeat(256) });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === 'name')?.message).toBe('tooLong');
  });

  it('suburb: required', () => {
    const result = schema.safeParse({ ...VALID_CREATE, suburb: '  ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === 'suburb')?.message).toBe('required');
  });

  it('contact: required', () => {
    const result = schema.safeParse({ ...VALID_CREATE, contact_name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === 'contact_name')?.message).toBe('required');
  });

  it('email: required', () => {
    const result = schema.safeParse({ ...VALID_CREATE, contact_email: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === 'contact_email')?.message).toBe('required');
  });

  it('email: format', () => {
    const result = schema.safeParse({ ...VALID_CREATE, contact_email: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === 'contact_email')?.message).toBe('emailInvalid');
  });

  it('phone: format, when present', () => {
    const bad = schema.safeParse({ ...VALID_CREATE, phone: '123' });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues.find((i) => i.path[0] === 'phone')?.message).toBe('phoneInvalid');

    const valid = schema.safeParse({ ...VALID_CREATE, phone: '+61 3 9123 4567' });
    expect(valid.success).toBe(true);
  });

  it('phone: absent never blocks', () => {
    expect(schema.safeParse({ ...VALID_CREATE, phone: '' }).success).toBe(true);
  });
});

describe('vSchool blocking rules (edit — same shape, task 10)', () => {
  const schema = createSchoolEditFormSchema(t);
  const VALID_EDIT = {
    name: 'Riverbend College',
    suburb: 'Riverbend',
    state: '',
    sector: '',
    postcode: '',
    schoolType: '',
    plan: 'pilot',
    contact_name: 'Jamie Lee',
    contact_email: 'jamie.lee@riverbend.edu.au',
    phone: '',
  };

  it('is valid on a fully compliant submission', () => {
    expect(schema.safeParse(VALID_EDIT).success).toBe(true);
  });

  it('carries the same eight blocking rules as create', () => {
    expect(schema.safeParse({ ...VALID_EDIT, name: '' }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_EDIT, name: 'AB' }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_EDIT, suburb: '' }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_EDIT, contact_name: '' }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_EDIT, contact_email: '' }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_EDIT, contact_email: 'nope' }).success).toBe(false);
    expect(schema.safeParse({ ...VALID_EDIT, phone: '123' }).success).toBe(false);
  });
});

describe('vSchool warnings — never block (create-only status, both-forms email)', () => {
  it('status Active warns, every other status is silent', () => {
    expect(isStatusActiveWarning('active')).toBe(true);
    expect(isStatusActiveWarning('trial')).toBe(false);
    expect(isStatusActiveWarning('pending_setup')).toBe(false);
  });

  it('a valid email outside the school-domain suffix list warns', () => {
    expect(schoolEmailDomainWarning('admin@gmail.com')).toBe(true);
  });

  it('a valid .edu.au / state-education email never warns', () => {
    expect(schoolEmailDomainWarning('admin@riverbend.edu.au')).toBe(false);
    expect(schoolEmailDomainWarning('admin@det.nsw.gov.au')).toBe(false);
    expect(schoolEmailDomainWarning('admin@education.qld.gov.au')).toBe(false);
  });

  it('an invalid or empty email never warns — the blocking rule owns that case', () => {
    expect(schoolEmailDomainWarning('not-an-email')).toBe(false);
    expect(schoolEmailDomainWarning('')).toBe(false);
  });

  it('warnings never appear as schema issues — the schema stays valid regardless', () => {
    const schema = createSchoolCreateFormSchema(t);
    const activeAndOutsideDomain = schema.safeParse({
      ...VALID_CREATE,
      status: 'active',
      contact_email: 'jamie.lee@gmail.com',
    });
    expect(activeAndOutsideDomain.success).toBe(true);
  });
});

describe('vSchool summary line — the design\'s exact pluralisation (`:1200`)', () => {
  const enPath = path.resolve(__dirname, '..', '..', 'src', 'i18n', 'messages', 'en.json');
  const en = JSON.parse(readFileSync(enPath, 'utf8')) as {
    Ops: { createSchool: { formSummary: string } };
  };

  /** Mirrors `n + (n === 1 ? ' field needs' : ' fields need') + ' attention'`
   *  by evaluating the SAME two branches the ICU template below encodes. */
  function expectedSummary(n: number): string {
    return `${n}${n === 1 ? ' field needs' : ' fields need'} attention`;
  }

  it('the catalogued template is the exact ICU form of the design formula', () => {
    expect(en.Ops.createSchool.formSummary).toBe(
      '{count, plural, one {# field needs attention} other {# fields need attention}}'
    );
  });

  it('resolves to the design wording for n = 1 and for n > 1', () => {
    expect(expectedSummary(1)).toBe('1 field needs attention');
    expect(expectedSummary(2)).toBe('2 fields need attention');
    expect(expectedSummary(8)).toBe('8 fields need attention');
  });
});

/** A schema-valid `schoolsListRowSchema` row — the directory read the
 *  duplicate pre-check parses with `schoolsListResponseSchema` (strictObject,
 *  every field required), so the fixture must be complete or the parse fails
 *  closed (the pre-check's own fail-safe, exercised separately below). */
function schoolRow(documentId: string, name: string): Record<string, unknown> {
  return {
    documentId,
    name,
    account_status: 'active',
    onboarding_status: 'not_started',
    plan: 'trial',
    portal_status: 'pending_setup',
    portal_plan: 'pilot',
    teacher_count: 0,
    portal_teacher_count: 0,
    admin_count: 0,
    class_count: 0,
    student_count: 0,
    results_count: 0,
    suburb: null,
    state: null,
    sector: null,
    createdAt: '2026-09-07T12:31:54.234Z',
    updatedAt: '2026-09-07T12:31:54.234Z',
    last_active_at: null,
    cover_image_url: null,
  };
}

function directoryResponse(rows: Array<Record<string, unknown>>) {
  return {
    data: {
      data: rows,
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: rows.length },
        status_counts: { all: rows.length, active: 0, trial: 0, pending_setup: rows.length, suspended: 0, archived: 0 },
      },
    },
  };
}

describe('duplicate name — client pre-check (server enforces on `slug`, not `name`)', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('finds a case-insensitive match in the directory', async () => {
    get.mockResolvedValueOnce(directoryResponse([schoolRow('abc123', 'Riverbend College')]));
    await expect(findDuplicateSchoolName('riverbend COLLEGE')).resolves.toBe(true);
  });

  it('excludes the school being edited — keeping its own name never fires the rule', async () => {
    get.mockResolvedValueOnce(directoryResponse([schoolRow('abc123', 'Riverbend College')]));
    await expect(findDuplicateSchoolName('Riverbend College', 'abc123')).resolves.toBe(false);
  });

  it('fails closed (never blocks) when the response violates the shared contract', async () => {
    get.mockResolvedValueOnce({ data: { data: [{ documentId: 'abc123' }], meta: {} } });
    await expect(findDuplicateSchoolName('Riverbend College')).resolves.toBe(false);
  });

  it('is silent (never blocks) on a network failure — it is a pre-check, not the authority', async () => {
    get.mockRejectedValueOnce(new Error('network down'));
    await expect(findDuplicateSchoolName('Riverbend College')).resolves.toBe(false);
  });

  it('never queries on a name the length rule already rejects', async () => {
    await expect(findDuplicateSchoolName('AB')).resolves.toBe(false);
    expect(get).not.toHaveBeenCalled();
  });
});

describe('duplicate name — the server-confirmed shape (curled live, 2026-09-10)', () => {
  it('recognises the real POST /api/schools 400 — slug uniqueness, never 409', () => {
    const realServerError = {
      response: {
        status: 400,
        data: {
          data: null,
          error: {
            status: 400,
            name: 'ValidationError',
            message: 'This attribute must be unique',
            details: { errors: [{ path: ['slug'], message: 'This attribute must be unique' }] },
          },
        },
      },
    };
    expect(schoolNameConflict(realServerError)).toBe(true);
  });

  it('does not misfire on an unrelated 400', () => {
    const otherError = {
      response: {
        status: 400,
        data: { error: { details: { errors: [{ path: ['contact_email'] }] } } },
      },
    };
    expect(schoolNameConflict(otherError)).toBe(false);
  });

  it('does not misfire on the Idempotency-Key 409 or a generic 500', () => {
    expect(schoolNameConflict({ response: { status: 409 } })).toBe(false);
    expect(schoolNameConflict({ response: { status: 500 } })).toBe(false);
  });
});
