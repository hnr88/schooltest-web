import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { NextIntlClientProvider } from 'next-intl';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { strapi, writeClientToken } from '@/lib/axios/strapi';
import { ClassImportStudentsDialog } from '@/modules/classes/components/ClassImportStudentsDialog';
import { PrivacyConsentPanel } from '@/modules/privacy-consent';
import { buildEraseBody, typedGivenNameMatches } from '@/modules/privacy-consent/lib/erase-request';
import { eraseStudentResponseSchema } from '@/modules/privacy-consent/schemas/consent.schema';
import { SchoolStudentForm } from '@/modules/school-students/components/SchoolStudentForm';
import type { ConsentAudience } from '@/modules/privacy-consent';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// W4-21 (D5 S1, S3). The real panel, erase dialog, add-student form, import dialog,
// flow hooks, mutations and config query run against the strapi axios request
// adapter (the repo's REST boundary seam, as privacy-consent-panel.test.tsx). Only
// the toast sink is replaced, so a message can be asserted without a Toaster.

const toast = vi.hoisted(() => vi.fn());
vi.mock('@/modules/ops/actions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/ops/actions')>();
  return { ...actual, showOpsToast: toast };
});

interface Reply {
  status: number;
  body: unknown;
}
interface Seen {
  method: string;
  url: string;
  body: unknown;
  params: unknown;
}
type Handler = (request: Seen) => Reply;

const originalAdapter = strapi.defaults.adapter;
const STUDENT = 'student-doc-1';
let seen: Seen[] = [];

function useAdapter(handler: Handler) {
  strapi.defaults.adapter = async (requestConfig: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const body =
      typeof requestConfig.data === 'string' ? JSON.parse(requestConfig.data) : requestConfig.data;
    const request: Seen = {
      method: String(requestConfig.method).toUpperCase(),
      url: requestConfig.url ?? '',
      body,
      params: requestConfig.params,
    };
    seen.push(request);
    const { status, body: data } = handler(request);
    const response: AxiosResponse = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config: requestConfig,
    };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError('request failed', 'ERR_BAD_REQUEST', requestConfig, undefined, response);
  };
}

const STATEMENTS = [
  { key: 'data_collection@1', type: 'data_collection', text: 'API wording for data collection.' },
  { key: 'ai_processing@1', type: 'ai_processing', text: 'API wording for AI-assisted marking.' },
];

const config = (over: Record<string, unknown> = {}) => ({
  consent_records_enabled: false,
  guardian_consent_required: false,
  ai_consent_required: false,
  ai_consent_source: 'off',
  minimised_student_profile: false,
  student_erasure_enabled: false,
  policy: { slug: 'privacy-policy', version: '2.1' },
  statements: STATEMENTS,
  ...over,
});

const errorBody = (status: number, details: Record<string, unknown> = {}) => ({
  data: null,
  error: { status, name: 'Err', message: 'raw server string', details },
});

const STUDENT_ROW = {
  documentId: 'new-student-1',
  given_name: 'Mia',
  family_name: 'Chen',
  student_status: 'active',
  email_fix_requested: false,
  class: null,
  date_of_birth: null,
  year_level: null,
  email: 'mia@example.com',
  school: { documentId: 'school-1' },
};

// A tiny server: config, the consent ledger read, the erase route, create and import.
interface ServerOptions {
  config: Record<string, unknown>;
  erase?: Reply;
  create?: Reply;
  commit?: Reply;
}
function server(options: ServerOptions): Handler {
  return (request) => {
    if (request.url === '/api/consents/config') return { status: 200, body: { data: options.config } };
    if (request.method === 'GET' && request.url === '/api/consents') return { status: 200, body: { data: [] } };
    if (request.method === 'POST' && /\/api\/schools\/me\/children\/[^/]+\/erase$/.test(request.url)) {
      return (
        options.erase ?? {
          status: 200,
          body: { data: { student_key: 'SK-123', erased: true, counts: { student: 1 } } },
        }
      );
    }
    if (request.method === 'POST' && request.url === '/api/schools/me/children') {
      return options.create ?? { status: 200, body: { data: STUDENT_ROW } };
    }
    if (request.method === 'POST' && request.url === '/api/schools/me/import-students/preview') {
      return {
        status: 200,
        body: {
          data: {
            create: [
              {
                row: 1,
                student_key: null,
                given_name: 'Ada',
                family_name: 'Lovelace',
                email: 'ada.lovelace@test.invalid',
                date_of_birth: '2012-12-10',
                year_level: 8,
                first_language: 'english',
              },
            ],
            skip_existing: [],
            reject: [],
          },
        },
      };
    }
    if (request.method === 'POST' && request.url === '/api/schools/me/import-students/commit') {
      return (
        options.commit ?? {
          status: 200,
          body: { data: { created: 1, skipped: 0, rejected: [], import_documentId: 'imp-1' } },
        }
      );
    }
    return { status: 404, body: errorBody(404) };
  };
}

let host: HTMLElement | undefined;
let root: Root | undefined;
let queryClient: QueryClient;

function mount(node: React.ReactNode): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root!.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
          {node}
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
  return host;
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

async function click(el: Element) {
  await act(async () => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await settle();
}

async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function choose(el: HTMLSelectElement, value: string) {
  await act(async () => {
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const byId = <T extends HTMLElement>(id: string) => document.body.querySelector<T>(`#${id}`);
const buttonByText = (text: string) =>
  [...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as
    | HTMLButtonElement
    | undefined;
const box = (type: string) =>
  document.body.querySelector<HTMLElement>(`[data-consent-type="${type}"] [role="checkbox"]`);
const boxLabel = (type: string) =>
  document.body.querySelector<HTMLElement>(`[data-consent-type="${type}"] label`);
const postsTo = (url: string) => seen.filter((r) => r.method === 'POST' && r.url === url);

const T = enMessages.PrivacyConsent;
const E = enMessages.PrivacyConsent.erase;
const A = enMessages.PrivacyConsent.attestation;

beforeEach(() => {
  seen = [];
  toast.mockClear();
  writeClientToken('held-token');
});

afterEach(() => {
  strapi.defaults.adapter = originalAdapter;
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host.remove();
  }
  root = undefined;
  host = undefined;
  document.body.innerHTML = '';
  writeClientToken(null);
  vi.restoreAllMocks();
});

const ARCHIVED = {
  studentStatus: 'archived',
  studentGivenName: 'Mia',
  studentFamilyName: 'Chen',
} as const;

function panel(audience: ConsentAudience = 'school_admin', props: Record<string, unknown> = ARCHIVED) {
  return <PrivacyConsentPanel studentDocumentId={STUDENT} audience={audience} {...props} />;
}

const ON = { consent_records_enabled: true, student_erasure_enabled: true };

describe('erase entry on the school student page', () => {
  test('is offered for an archived student only while student_erasure_enabled is ON', async () => {
    useAdapter(server({ config: config(ON) }));
    const el = mount(panel());
    await settle();
    expect(el.querySelector('[data-slot="erase-student"]')).not.toBeNull();
    expect(buttonByText(E.entry)).toBeDefined();
  });

  test.each([
    ['an active student', { ...ARCHIVED, studentStatus: 'active' }, ON],
    ['the flag OFF', ARCHIVED, { ...ON, student_erasure_enabled: false }],
    ['a student with no given name', { ...ARCHIVED, studentGivenName: null }, ON],
    ['a page that passes no student', {}, ON],
  ])('is not offered for %s', async (_label, props, flags) => {
    useAdapter(server({ config: config(flags) }));
    const el = mount(panel('school_admin', props));
    await settle();
    expect(buttonByText(E.entry)).toBeUndefined();
    expect(el.querySelector('[data-slot="erase-student"]')).toBeNull();
  });

  test('is never offered to a parent, even with the flag ON and an archived student', async () => {
    useAdapter(server({ config: config(ON) }));
    mount(panel('parent'));
    await settle();
    expect(buttonByText(E.entry)).toBeUndefined();
  });

  test('with every switch OFF the panel renders nothing at all', async () => {
    useAdapter(server({ config: config() }));
    const el = mount(panel());
    await settle();
    expect(el.textContent).toBe('');
  });

  test('stands alone when consent records are OFF but erasure is ON (the panel itself stays hidden)', async () => {
    useAdapter(server({ config: config({ student_erasure_enabled: true }) }));
    const el = mount(panel());
    await settle();
    expect(el.querySelector('[data-slot="privacy-consent-panel"]')).toBeNull();
    expect(el.querySelector('[data-slot="privacy-erase-panel"]')).not.toBeNull();
    expect(buttonByText(E.entry)).toBeDefined();
    // No consent ledger row is read for the hidden panel.
    expect(seen.some((r) => r.url === '/api/consents')).toBe(false);
  });

  test('shows the tombstoned record as done and offers nothing more', async () => {
    useAdapter(server({ config: config(ON) }));
    const el = mount(panel('school_admin', { ...ARCHIVED, studentGivenName: 'Erased', studentFamilyName: null }));
    await settle();
    expect(el.querySelector('[data-slot="erase-done"]')?.textContent).toBe(E.erasedNote);
    expect(buttonByText(E.entry)).toBeUndefined();
  });

  test('a real student called Erased with a family name is not treated as erased', async () => {
    useAdapter(server({ config: config(ON) }));
    const el = mount(panel('school_admin', { ...ARCHIVED, studentGivenName: 'Erased', studentFamilyName: 'Smith' }));
    await settle();
    expect(el.querySelector('[data-slot="erase-done"]')).toBeNull();
    expect(buttonByText(E.entry)).toBeDefined();
  });
});

describe('erase dialog', () => {
  async function openDialog() {
    useAdapter(server({ config: config(ON) }));
    mount(panel());
    await settle();
    await click(buttonByText(E.entry)!);
  }

  test('says what is removed and what is kept, with the backup window in one string', async () => {
    await openDialog();
    const dialog = document.body.querySelector('[data-slot="ops-dialog-content"]')!;
    expect(dialog.textContent).toContain(E.dialog.removed.dateOfBirth);
    expect(dialog.textContent).toContain(E.dialog.removed.login);
    expect(dialog.textContent).toContain(E.dialog.kept.yearAndClass);
    expect(dialog.textContent).toContain('190 days');
  });

  test('keeps the confirm disabled until the typed name matches and a reference is entered', async () => {
    await openDialog();
    const confirm = () => buttonByText(E.dialog.confirm)!;
    expect(confirm().disabled).toBe(true);

    await typeInto(byId<HTMLInputElement>('erase-confirm-name')!, 'Mi');
    expect(document.body.textContent).toContain(E.dialog.nameMismatch);
    expect(confirm().disabled).toBe(true);

    // Case does not matter, exactly as the server compares.
    await typeInto(byId<HTMLInputElement>('erase-confirm-name')!, ' mIA ');
    expect(document.body.textContent).not.toContain(E.dialog.nameMismatch);
    // The name alone is not enough: the request needs a reference.
    expect(confirm().disabled).toBe(true);

    await typeInto(byId<HTMLInputElement>('erase-reference')!, 'TICKET-42');
    expect(confirm().disabled).toBe(false);

    await typeInto(byId<HTMLInputElement>('erase-reference')!, '   ');
    expect(confirm().disabled).toBe(true);
  });

  test('does not send anything while the confirm is disabled', async () => {
    await openDialog();
    await click(buttonByText(E.dialog.confirm)!);
    expect(seen.some((r) => r.url.endsWith('/erase'))).toBe(false);
  });

  test('posts the exact request body, never a student_key, then re-reads the student and consents', async () => {
    await openDialog();
    await typeInto(byId<HTMLInputElement>('erase-confirm-name')!, 'Mia');
    await choose(byId<HTMLSelectElement>('erase-channel')!, 'guardian_email');
    await typeInto(byId<HTMLInputElement>('erase-reference')!, 'Guardian email 12 Oct');
    await typeInto(byId<HTMLInputElement>('erase-received-on')!, '2026-10-12');
    const consentReads = seen.filter((r) => r.method === 'GET' && r.url === '/api/consents').length;
    const invalidated = vi.spyOn(queryClient, 'invalidateQueries');

    await click(buttonByText(E.dialog.confirm)!);

    const posts = postsTo(`/api/schools/me/children/${STUDENT}/erase`);
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({
      confirm_given_name: 'Mia',
      request: {
        channel: 'guardian_email',
        reference: 'Guardian email 12 Oct',
        received_at: '2026-10-12T00:00:00.000Z',
        verification_method: 'school_admin_authenticated',
      },
    });
    expect(JSON.stringify(posts[0].body)).not.toContain('student_key');
    expect(JSON.stringify(posts[0].body)).not.toContain('confirm_student_key');

    const keys = invalidated.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(['school-students']));
    expect(keys).toContain(JSON.stringify(['privacy-consent', 'student-consents']));
    expect(seen.filter((r) => r.method === 'GET' && r.url === '/api/consents').length).toBeGreaterThan(
      consentReads,
    );
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ tone: 'ok', message: E.successToast }));
    // The dialog closed.
    expect(document.body.querySelector('[data-slot="erase-student-form"]')).toBeNull();
  });

  test.each([
    ['ERASURE_DISABLED', 409, E.error.erasureDisabled],
    ['STUDENT_NOT_ARCHIVED', 409, E.error.notArchived],
    ['STUDENT_IN_SESSION', 409, E.error.inSession],
    ['LEGAL_HOLD', 409, E.error.legalHold],
    ['CONFIRMATION_MISMATCH', 400, E.error.confirmation],
  ])('shows the %s refusal in its own words and stays open', async (code, status, message) => {
    useAdapter(
      server({ config: config(ON), erase: { status, body: errorBody(status, { code }) } }),
    );
    mount(panel());
    await settle();
    await click(buttonByText(E.entry)!);
    await typeInto(byId<HTMLInputElement>('erase-confirm-name')!, 'Mia');
    await typeInto(byId<HTMLInputElement>('erase-reference')!, 'REF-1');
    await click(buttonByText(E.dialog.confirm)!);

    const alert = document.body.querySelector('[data-slot="ops-dialog-footer"] [role="alert"]');
    expect(alert?.textContent).toBe(message);
    expect(document.body.querySelector('[data-slot="erase-student-form"]')).not.toBeNull();
    expect(toast).not.toHaveBeenCalled();
  });

  test('the erase answer is parsed without student_key, so it never reaches component state', () => {
    const parsed = eraseStudentResponseSchema.parse({
      data: { student_key: 'SK-123', erased: true, counts: { student: 1 } },
    });
    expect(Object.keys(parsed.data).sort()).toEqual(['counts', 'erased']);
  });

  test('typed-name rule is the server rule: trimmed and case-insensitive, never empty', () => {
    expect(typedGivenNameMatches('  mia ', 'Mia')).toBe(true);
    expect(typedGivenNameMatches('Mi', 'Mia')).toBe(false);
    expect(typedGivenNameMatches('', '')).toBe(false);
    expect(typedGivenNameMatches('x', null)).toBe(false);
    expect(
      buildEraseBody({
        typedName: ' Mia ',
        channel: 'school_initiated',
        reference: ' R1 ',
        receivedOn: '2026-10-13',
      }),
    ).toEqual({
      confirm_given_name: 'Mia',
      request: {
        channel: 'school_initiated',
        reference: 'R1',
        received_at: '2026-10-13T00:00:00.000Z',
        verification_method: 'school_admin_authenticated',
      },
    });
  });
});

const FILLED = { name: 'Mia', email: 'mia@example.com' };

function addForm() {
  return (
    <SchoolStudentForm
      target={{ mode: 'create' }}
      classes={[]}
      showAcaraPhase={false}
      onCancel={vi.fn()}
      onDone={vi.fn()}
    />
  );
}

async function fillAndSubmit() {
  await typeInto(byId<HTMLInputElement>('student-given-name')!, FILLED.name);
  await typeInto(byId<HTMLInputElement>('student-email')!, FILLED.email);
  await click(buttonByText(enMessages.SchoolStudents.form.submitCreate)!);
}

describe('guardian-consent attestation on the add-student form', () => {
  test('with every switch OFF the form shows no attestation and sends exactly today\'s body', async () => {
    useAdapter(server({ config: config() }));
    const el = mount(addForm());
    await settle();
    expect(el.querySelector('[data-slot="consent-attestation"]')).toBeNull();

    await fillAndSubmit();
    const posts = postsTo('/api/schools/me/children');
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({ given_name: 'Mia', email: 'mia@example.com' });
    expect(Object.keys(posts[0].body as object)).not.toContain('consent_attestation');
  });

  test('with records ON it shows two separate unticked boxes carrying the API wording', async () => {
    useAdapter(server({ config: config({ consent_records_enabled: true }) }));
    const el = mount(addForm());
    await settle();
    expect(el.querySelector('[data-slot="consent-attestation"]')).not.toBeNull();
    expect(el.textContent).toContain('API wording for data collection.');
    expect(el.textContent).toContain('API wording for AI-assisted marking.');
    expect(box('data_collection')?.getAttribute('aria-checked')).toBe('false');
    expect(box('ai_processing')?.getAttribute('aria-checked')).toBe('false');
    expect(el.textContent).toContain(A.optional);
  });

  test('with records ON and nothing ticked the body still carries no attestation key', async () => {
    useAdapter(server({ config: config({ consent_records_enabled: true }) }));
    mount(addForm());
    await settle();
    await fillAndSubmit();
    const body = postsTo('/api/schools/me/children')[0].body as Record<string, unknown>;
    expect('consent_attestation' in body).toBe(false);
  });

  test('sends only the ticked purposes as consent_attestation', async () => {
    useAdapter(server({ config: config({ consent_records_enabled: true }) }));
    mount(addForm());
    await settle();
    await click(boxLabel('ai_processing')!);
    await fillAndSubmit();
    expect(postsTo('/api/schools/me/children')[0].body).toEqual({
      given_name: 'Mia',
      email: 'mia@example.com',
      consent_attestation: { consent_types: ['ai_processing'] },
    });
  });

  test('guardian consent required: nothing is sent until data collection is ticked', async () => {
    useAdapter(
      server({ config: config({ consent_records_enabled: true, guardian_consent_required: true }) }),
    );
    const el = mount(addForm());
    await settle();
    expect(el.textContent).toContain(A.required);

    await fillAndSubmit();
    expect(postsTo('/api/schools/me/children')).toHaveLength(0);
    expect(el.textContent).toContain(A.requiredError);

    await click(boxLabel('data_collection')!);
    await click(buttonByText(enMessages.SchoolStudents.form.submitCreate)!);
    expect(postsTo('/api/schools/me/children')[0].body).toEqual({
      given_name: 'Mia',
      email: 'mia@example.com',
      consent_attestation: { consent_types: ['data_collection'] },
    });
  });

  test('a ticked AI box alone does not satisfy the guardian rule', async () => {
    useAdapter(
      server({ config: config({ consent_records_enabled: true, guardian_consent_required: true }) }),
    );
    mount(addForm());
    await settle();
    await click(boxLabel('ai_processing')!);
    await fillAndSubmit();
    expect(postsTo('/api/schools/me/children')).toHaveLength(0);
  });

  test('a 409 GUARDIAN_CONSENT_REQUIRED from the server is shown next to the boxes', async () => {
    useAdapter(
      server({
        config: config({ consent_records_enabled: true }),
        create: { status: 409, body: errorBody(409, { code: 'GUARDIAN_CONSENT_REQUIRED' }) },
      }),
    );
    const el = mount(addForm());
    await settle();
    await fillAndSubmit();
    expect(el.querySelector('[data-slot="consent-attestation"]')?.textContent).toContain(
      A.refusal.guardianRequired,
    );
  });

  test('the edit form never shows the attestation', async () => {
    useAdapter(server({ config: config({ consent_records_enabled: true }) }));
    const student: SchoolStudent = {
      documentId: STUDENT,
      given_name: 'Mia',
      family_name: 'Chen',
      student_status: 'active',
      email_fix_requested: false,
      first_language: null,
      acara_phase: null,
      diagnostic_status: null,
      class: null,
    };
    const el = mount(
      <SchoolStudentForm
        target={{ mode: 'edit', student }}
        classes={[]}
        showAcaraPhase={false}
        onCancel={vi.fn()}
        onDone={vi.fn()}
      />,
    );
    await settle();
    expect(el.querySelector('[data-slot="consent-attestation"]')).toBeNull();
  });
});

const CSV = 'Ada,Lovelace,ada.lovelace@test.invalid,2012-12-10,8,english';

function importDialog() {
  return <ClassImportStudentsDialog classDocumentId="class-1" className="5A" onClose={vi.fn()} />;
}

async function pasteCsv() {
  await typeInto(byId<HTMLTextAreaElement>('student-import-csv')!, CSV);
}

describe('guardian-consent attestation in the import dialog', () => {
  const submitLabel = enMessages.Classes.detail.import.submit;

  test('with every switch OFF there is no attestation and the commit body is unchanged', async () => {
    useAdapter(server({ config: config() }));
    mount(importDialog());
    await settle();
    expect(document.body.querySelector('[data-slot="consent-attestation"]')).toBeNull();

    await pasteCsv();
    await click(buttonByText(submitLabel)!);
    const commits = postsTo('/api/schools/me/import-students/commit');
    expect(commits).toHaveLength(1);
    expect(commits[0].body).toEqual({ csv: CSV, class_documentId: 'class-1' });
  });

  test('with records ON the boxes start unticked and the ticked purposes go with the commit only', async () => {
    useAdapter(server({ config: config({ consent_records_enabled: true }) }));
    mount(importDialog());
    await settle();
    expect(box('data_collection')?.getAttribute('aria-checked')).toBe('false');
    expect(box('ai_processing')?.getAttribute('aria-checked')).toBe('false');

    await pasteCsv();
    await click(boxLabel('data_collection')!);
    await click(boxLabel('ai_processing')!);
    await click(buttonByText(submitLabel)!);

    const preview = postsTo('/api/schools/me/import-students/preview')[0].body as Record<string, unknown>;
    expect('consent_attestation' in preview).toBe(false);
    expect(postsTo('/api/schools/me/import-students/commit')[0].body).toEqual({
      csv: CSV,
      class_documentId: 'class-1',
      consent_attestation: { consent_types: ['data_collection', 'ai_processing'] },
    });
  });

  test('guardian consent required: the import is held until data collection is ticked', async () => {
    useAdapter(
      server({ config: config({ consent_records_enabled: true, guardian_consent_required: true }) }),
    );
    mount(importDialog());
    await settle();
    await pasteCsv();
    expect(buttonByText(submitLabel)!.disabled).toBe(true);
    expect(document.body.textContent).toContain(A.requiredError);

    await click(boxLabel('data_collection')!);
    expect(buttonByText(submitLabel)!.disabled).toBe(false);
  });

  test('a 409 GUARDIAN_CONSENT_REQUIRED on the commit gets the school-friendly message', async () => {
    useAdapter(
      server({
        config: config({ consent_records_enabled: true }),
        commit: { status: 409, body: errorBody(409, { code: 'GUARDIAN_CONSENT_REQUIRED' }) },
      }),
    );
    mount(importDialog());
    await settle();
    await pasteCsv();
    await click(buttonByText(submitLabel)!);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: 'error', message: A.refusal.guardianRequired }),
    );
  });
});

describe('catalogue', () => {
  test('the five non-English catalogues carry every new key (English text, PRIV-08)', async () => {
    const flat = (node: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(node).flatMap(([k, v]) =>
        v !== null && typeof v === 'object'
          ? flat(v as Record<string, unknown>, `${prefix}${k}.`)
          : [`${prefix}${k}`],
      );
    const wanted = flat({ erase: T.erase, attestation: T.attestation });
    expect(wanted.length).toBeGreaterThan(30);
    for (const locale of ['zh', 'ko', 'ms', 'vi', 'th']) {
      const catalogue = (await import(`@/i18n/messages/${locale}.json`)).default as {
        PrivacyConsent: Record<string, unknown>;
      };
      const present = new Set(flat(catalogue.PrivacyConsent));
      expect(wanted.filter((key) => !present.has(key)), locale).toEqual([]);
    }
  });
});
