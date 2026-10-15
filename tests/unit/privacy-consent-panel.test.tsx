import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { NextIntlClientProvider } from 'next-intl';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { strapi, writeClientToken } from '@/lib/axios/strapi';
import { PrivacyConsentPanel } from '@/modules/privacy-consent';
import { buildConsentRows } from '@/modules/privacy-consent/lib/consent-rows';
import { classifyConsentError } from '@/modules/privacy-consent/lib/classify-consent-error';
import type { ConsentAudience } from '@/modules/privacy-consent';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// W4-17 (D5 S1). The strapi axios instance is driven through a request adapter, the
// repo's rest-boundary seam (as tests/unit/mfa-enrol-panel.test.tsx): the product
// code path (queries, schemas, panel) has no mock. The live default-OFF path is the
// existing child-detail and school-student-detail specs.

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

const originalAdapter = strapi.defaults.adapter;
const STUDENT = 'student-doc-1';
let seen: Seen[] = [];

type Handler = (request: Seen) => Reply;

function useAdapter(handler: Handler) {
  strapi.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const request: Seen = {
      method: String(config.method).toUpperCase(),
      url: config.url ?? '',
      body,
      params: config.params,
    };
    seen.push(request);
    const { status, body: data } = handler(request);
    const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError('request failed', 'ERR_BAD_REQUEST', config, undefined, response);
  };
}

const STATEMENTS = [
  { key: 'data_collection@1', type: 'data_collection', text: 'Statement served by the API for data collection.' },
  { key: 'ai_processing@1', type: 'ai_processing', text: 'Statement served by the API for AI marking.' },
  { key: 'recording_monitoring@1', type: 'recording_monitoring', text: 'Statement served by the API for recording.' },
];

const config = (over: Record<string, unknown> = {}) => ({
  consent_records_enabled: true,
  guardian_consent_required: false,
  ai_consent_required: false,
  ai_consent_source: 'off',
  minimised_student_profile: false,
  student_erasure_enabled: false,
  policy: { slug: 'privacy-policy', version: '1.1' },
  statements: STATEMENTS,
  ...over,
});

const record = (over: Record<string, unknown> = {}) => ({
  documentId: 'rec-1',
  consent_type: 'data_collection',
  student_document_id: STUDENT,
  school_document_id: 'school-1',
  granted_by_role: 'parent',
  source: 'parent_portal',
  policy_slug: 'privacy-policy',
  policy_version: '1.1',
  statement_key: 'data_collection@1',
  granted_at: '2026-09-01T02:00:00.000Z',
  withdrawn_at: null,
  withdrawn_reason: null,
  ...over,
});

const errorBody = (status: number, details: Record<string, unknown> = {}) => ({
  data: null,
  error: { status, name: 'Err', message: 'raw server string', details },
});

// A tiny in-memory ledger behind the adapter: GET lists it, POST grant appends,
// POST withdraw stamps `withdrawn_at`. Every answer is the contract's wire shape.
function ledgerServer(cfg: unknown, rows: Record<string, unknown>[]): Handler {
  const ledger = [...rows];
  return (request) => {
    if (request.url === '/api/consents/config') return { status: 200, body: { data: cfg } };
    if (request.method === 'GET' && request.url === '/api/consents') {
      return { status: 200, body: { data: ledger } };
    }
    if (request.method === 'POST' && request.url === '/api/consents') {
      const body = request.body as { consent_type: string; statement_key: string };
      const created = record({
        documentId: `rec-${ledger.length + 1}`,
        consent_type: body.consent_type,
        statement_key: body.statement_key,
        granted_at: '2026-10-12T01:00:00.000Z',
      });
      ledger.push(created);
      return { status: 200, body: { data: created } };
    }
    const withdraw = /^\/api\/consents\/([^/]+)\/withdraw$/.exec(request.url);
    if (request.method === 'POST' && withdraw) {
      const row = ledger.find((r) => r.documentId === withdraw[1]);
      if (!row) return { status: 404, body: errorBody(404) };
      row.withdrawn_at = '2026-10-12T03:00:00.000Z';
      return { status: 200, body: { data: row } };
    }
    return { status: 404, body: errorBody(404) };
  };
}

let host: HTMLElement | undefined;
let root: Root | undefined;
let queryClient: QueryClient;

function renderPanel(audience: ConsentAudience = 'parent'): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root!.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
          <PrivacyConsentPanel studentDocumentId={STUDENT} audience={audience} />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
  return host;
}

async function settle() {
  await act(async () => {
    // Wait for the query client to go idle instead of sleeping a fixed 25ms:
    // under full-suite load that sleep once expired while the list request was
    // still in flight, and the 409-disabled test then read the panel's
    // 'loading' frame (title + description, no rows). Idle is only trusted
    // once it holds across a macrotask — a settling mutation immediately kicks
    // an invalidated refetch.
    for (let waited = 0; waited < 5_000; waited += 5) {
      const idle = () =>
        queryClient?.isFetching() === 0 && queryClient?.isMutating() === 0;
      if (idle()) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (idle()) break;
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  });
}

function buttonByText(scope: ParentNode, text: string): HTMLButtonElement {
  const found = [...scope.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!found) throw new Error(`no button "${text}"`);
  return found as HTMLButtonElement;
}

async function click(button: HTMLElement) {
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await settle();
}

const rowOf = (el: HTMLElement, type: string) =>
  el.querySelector<HTMLElement>(`[data-slot="consent-row"][data-consent-type="${type}"]`);

const T = enMessages.PrivacyConsent;
const day = (iso: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'Australia/Sydney' }).format(new Date(iso));
let storageSpies: MockInstance[] = [];

beforeEach(() => {
  seen = [];
  writeClientToken('held-token');
  storageSpies = [vi.spyOn(Storage.prototype, 'setItem')];
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

describe('visibility', () => {
  test('renders nothing and reads no consent rows while consent_records_enabled is OFF', async () => {
    useAdapter(ledgerServer(config({ consent_records_enabled: false }), [record()]));
    const el = renderPanel();
    await settle();
    expect(el.textContent).toBe('');
    expect(el.querySelector('[data-slot="privacy-consent-panel"]')).toBeNull();
    expect(seen.map((r) => `${r.method} ${r.url}`)).toEqual(['GET /api/consents/config']);
  });

  test('renders nothing when the config cannot be read (an API without the routes)', async () => {
    useAdapter(() => ({ status: 404, body: errorBody(404) }));
    const el = renderPanel();
    await settle();
    expect(el.textContent).toBe('');
  });

  test('a 409 CONSENT_RECORDS_DISABLED on the list hides the panel', async () => {
    useAdapter((request) =>
      request.url === '/api/consents/config'
        ? { status: 200, body: { data: config() } }
        : { status: 409, body: errorBody(409, { code: 'CONSENT_RECORDS_DISABLED' }) },
    );
    const el = renderPanel();
    await settle();
    expect(el.textContent).toBe('');
  });
});

describe('rows from the live API', () => {
  test('active, withdrawn and not recorded each render their own state, statement and date', async () => {
    useAdapter(
      ledgerServer(config({ ai_consent_required: true, ai_consent_source: 'flag' }), [
        record(),
        record({
          documentId: 'rec-2',
          consent_type: 'ai_processing',
          statement_key: 'ai_processing@1',
          withdrawn_at: '2026-10-01T02:00:00.000Z',
        }),
      ]),
    );
    const el = renderPanel();
    await settle();

    expect(el.querySelector('h2')?.textContent).toBe(T.title);
    expect(seen.find((r) => r.url === '/api/consents' && r.method === 'GET')?.params).toEqual({
      student: STUDENT,
    });

    const data = rowOf(el, 'data_collection')!;
    expect(data.getAttribute('data-state')).toBe('active');
    expect(data.textContent).toContain(STATEMENTS[0].text);
    expect(data.textContent).toContain(`Active since ${day('2026-09-01T02:00:00.000Z')}`);
    expect(data.textContent).toContain('privacy policy version 1.1');
    expect(buttonByText(data, T.withdraw.button)).toBeTruthy();

    const ai = rowOf(el, 'ai_processing')!;
    expect(ai.getAttribute('data-state')).toBe('withdrawn');
    expect(ai.textContent).toContain(`Withdrawn on ${day('2026-10-01T02:00:00.000Z')}`);
    expect(buttonByText(ai, T.grant.parent)).toBeTruthy();

    // Recording consent has no row: it is the student's own desktop modal.
    expect(rowOf(el, 'recording_monitoring')).toBeNull();
    // ai_consent_required is on, so the real W4-12 behaviour is stated.
    expect(el.textContent).toContain(T.aiRequiredNote);
  });

  test('a type with no record reads as not recorded and offers Give consent', async () => {
    useAdapter(ledgerServer(config(), []));
    const el = renderPanel();
    await settle();
    const ai = rowOf(el, 'ai_processing')!;
    expect(ai.getAttribute('data-state')).toBe('none');
    expect(ai.textContent).toContain(T.state.none);
    expect(buttonByText(ai, T.grant.parent)).toBeTruthy();
    expect(el.textContent).not.toContain(T.aiRequiredNote);
  });

  test('recording_monitoring is listed only when a record exists, and can be withdrawn but not granted', async () => {
    useAdapter(
      ledgerServer(config(), [
        record({ documentId: 'rec-9', consent_type: 'recording_monitoring', statement_key: 'recording_monitoring@1' }),
      ]),
    );
    const el = renderPanel();
    await settle();
    const rec = rowOf(el, 'recording_monitoring')!;
    expect(rec.getAttribute('data-state')).toBe('active');
    expect(buttonByText(rec, T.withdraw.button)).toBeTruthy();
    expect(() => buttonByText(rec, T.grant.parent)).toThrow();
  });

  test('a guardian withdrawal beats a school attestation still on file (the API gate rule)', () => {
    const parsed = config() as Parameters<typeof buildConsentRows>[0];
    const rows = buildConsentRows(parsed, [
      record({ documentId: 'p', granted_at: '2026-09-01T00:00:00.000Z', withdrawn_at: '2026-09-05T00:00:00.000Z' }),
      record({
        documentId: 's',
        source: 'school_attestation',
        granted_by_role: 'school_admin',
        granted_at: '2026-09-02T00:00:00.000Z',
      }),
    ] as Parameters<typeof buildConsentRows>[1]);
    const data = rows.find((r) => r.type === 'data_collection')!;
    expect(data.state).toBe('withdrawn');
    expect(data.withdrawnByGuardian).toBe(true);
    expect(data.withdrawTarget).toBeNull();
  });
});

describe('grant and withdraw', () => {
  test('Give consent posts the student, type and the statement key shown, then refreshes the row', async () => {
    useAdapter(ledgerServer(config(), []));
    const el = renderPanel();
    await settle();
    await click(buttonByText(rowOf(el, 'ai_processing')!, T.grant.parent));

    const post = seen.find((r) => r.method === 'POST')!;
    expect(post.url).toBe('/api/consents');
    expect(post.body).toEqual({
      student_document_id: STUDENT,
      consent_type: 'ai_processing',
      statement_key: 'ai_processing@1',
    });
    expect(rowOf(el, 'ai_processing')!.getAttribute('data-state')).toBe('active');
  });

  test('Withdraw asks first, says it applies going forward, and posts only after confirming', async () => {
    useAdapter(ledgerServer(config({ ai_consent_required: true }), [record()]));
    const el = renderPanel();
    await settle();

    await click(buttonByText(rowOf(el, 'data_collection')!, T.withdraw.button));
    expect(seen.some((r) => r.method === 'POST')).toBe(false);
    const dialog = document.body.querySelector('[role="alertdialog"]')!;
    expect(dialog.textContent).toContain(T.withdraw.description);
    expect(dialog.textContent).toContain('does not undo marking');

    await click(buttonByText(dialog, T.withdraw.confirm));
    const post = seen.find((r) => r.method === 'POST')!;
    expect(post.url).toBe('/api/consents/rec-1/withdraw');
    expect(post.body).toEqual({});
    expect(rowOf(el, 'data_collection')!.getAttribute('data-state')).toBe('withdrawn');
    expect(document.body.querySelector('[role="alertdialog"]')).toBeNull();
  });

  test('Keep consent closes the confirmation without any write', async () => {
    useAdapter(ledgerServer(config(), [record()]));
    const el = renderPanel();
    await settle();
    await click(buttonByText(rowOf(el, 'data_collection')!, T.withdraw.button));
    await click(buttonByText(document.body.querySelector('[role="alertdialog"]')!, T.withdraw.cancel));
    expect(seen.some((r) => r.method === 'POST')).toBe(false);
    expect(rowOf(el, 'data_collection')!.getAttribute('data-state')).toBe('active');
  });

  test('an already-withdrawn answer shows its own message inside the confirmation', async () => {
    useAdapter((request) => {
      if (request.url === '/api/consents/config') return { status: 200, body: { data: config() } };
      if (request.method === 'GET') return { status: 200, body: { data: [record()] } };
      return { status: 409, body: errorBody(409, { code: 'CONSENT_ALREADY_WITHDRAWN' }) };
    });
    const el = renderPanel();
    await settle();
    await click(buttonByText(rowOf(el, 'data_collection')!, T.withdraw.button));
    await click(buttonByText(document.body.querySelector('[role="alertdialog"]')!, T.withdraw.confirm));
    expect(document.body.textContent).toContain(T.error.alreadyWithdrawn);
  });
});

describe('school variant', () => {
  test('a school administrator sees Record school attestation, and no guardian wording', async () => {
    useAdapter(ledgerServer(config(), []));
    const el = renderPanel('school_admin');
    await settle();
    const data = rowOf(el, 'data_collection')!;
    expect(buttonByText(data, T.grant.school_admin)).toBeTruthy();
    expect(() => buttonByText(data, T.grant.parent)).toThrow();
    expect(el.querySelector('[data-audience="school_admin"]')).not.toBeNull();
  });

  test('a guardian withdrawal cannot be re-granted by the school', async () => {
    useAdapter(
      ledgerServer(config(), [
        record({ withdrawn_at: '2026-10-01T02:00:00.000Z' }),
        record({
          documentId: 'rec-s',
          source: 'school_attestation',
          granted_by_role: 'school_admin',
          granted_at: '2026-09-02T00:00:00.000Z',
        }),
      ]),
    );
    const el = renderPanel('school_admin');
    await settle();
    const data = rowOf(el, 'data_collection')!;
    expect(data.getAttribute('data-state')).toBe('withdrawn');
    expect(data.textContent).toContain(T.guardianWithdrew);
    expect(() => buttonByText(data, T.grant.school_admin)).toThrow();
    expect(() => buttonByText(data, T.withdraw.button)).toThrow();
  });
});

describe('error states', () => {
  test('a failed list read renders the error alert with a retry that re-reads', async () => {
    let failing = true;
    useAdapter((request) => {
      if (request.url === '/api/consents/config') return { status: 200, body: { data: config() } };
      return failing
        ? { status: 500, body: errorBody(500) }
        : { status: 200, body: { data: [] } };
    });
    const el = renderPanel();
    await settle();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(T.errorTitle);

    failing = false;
    await click(buttonByText(el, T.retry));
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(rowOf(el, 'data_collection')).not.toBeNull();
  });

  test('403 and 404 render the standard not-found alert', async () => {
    useAdapter((request) =>
      request.url === '/api/consents/config'
        ? { status: 200, body: { data: config() } }
        : { status: 404, body: errorBody(404) },
    );
    const el = renderPanel();
    await settle();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(T.notFoundTitle);
  });

  test('a drifted response fails loudly instead of rendering a half-true state', async () => {
    useAdapter((request) =>
      request.url === '/api/consents/config'
        ? { status: 200, body: { data: config() } }
        : { status: 200, body: { data: [{ documentId: 'x', consent_type: 'marketing' }] } },
    );
    const el = renderPanel();
    await settle();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(T.errorTitle);
    expect(rowOf(el, 'data_collection')).toBeNull();
  });

  test('classifyConsentError maps the contract codes', () => {
    const failure = (status: number, code?: string) =>
      new AxiosError('x', 'ERR', undefined, undefined, {
        status,
        data: errorBody(status, code ? { code } : {}),
      } as AxiosResponse);
    expect(classifyConsentError(failure(409, 'CONSENT_RECORDS_DISABLED'))).toBe('disabled');
    expect(classifyConsentError(failure(409, 'CONSENT_ALREADY_WITHDRAWN'))).toBe('alreadyWithdrawn');
    expect(classifyConsentError(failure(403))).toBe('notFound');
    expect(classifyConsentError(failure(404))).toBe('notFound');
    expect(classifyConsentError(failure(403, 'MFA_REQUIRED'))).toBe('generic');
    expect(classifyConsentError(new Error('boom'))).toBe('generic');
  });
});

describe('no browser storage (W4-04 guard)', () => {
  test('granting and withdrawing write nothing to storage and set no cookie', async () => {
    const cookieSet = vi.spyOn(document, 'cookie', 'set');
    useAdapter(ledgerServer(config(), [record()]));
    const el = renderPanel();
    await settle();
    await click(buttonByText(rowOf(el, 'ai_processing')!, T.grant.parent));
    await click(buttonByText(rowOf(el, 'data_collection')!, T.withdraw.button));
    await click(buttonByText(document.body.querySelector('[role="alertdialog"]')!, T.withdraw.confirm));

    // The auth token write is the only storage the page makes, and the test set it
    // before the panel mounted; the panel itself adds none.
    for (const spy of storageSpies) {
      expect(spy.mock.calls.filter(([key]) => String(key).toLowerCase().includes('consent'))).toEqual([]);
    }
    expect(cookieSet).not.toHaveBeenCalled();
  });
});
