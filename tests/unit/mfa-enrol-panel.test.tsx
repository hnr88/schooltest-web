import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { NextIntlClientProvider } from 'next-intl';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { readClientToken, strapi, writeClientToken } from '@/lib/axios/strapi';
import { MfaEnrolPanel } from '@/modules/auth/components/MfaEnrolPanel';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// W3-22 (D3 MFA-3). The strapi axios instance is driven through a request
// adapter (the repo's rest-boundary seam, as tests/unit/mfa-step-up.test.tsx).
// The live default-OFF path is tests/e2e/mfa-settings-default-off.spec.ts.

interface Reply {
  status: number;
  body: unknown;
}
type Handler = (config: InternalAxiosRequestConfig, body: unknown) => Reply;

const originalAdapter = strapi.defaults.adapter;
let requests: { method: string; url: string; body: unknown }[] = [];

function useAdapter(handler: Handler) {
  strapi.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    requests.push({ method: String(config.method).toUpperCase(), url: config.url ?? '', body });
    const { status, body: data } = handler(config, body);
    const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError('request failed', 'ERR_BAD_REQUEST', config, undefined, response);
  };
}

const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
const URI = 'otpauth://totp/SchoolTest:ops%40example.test?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=SchoolTest';
const RECOVERY = Array.from({ length: 8 }, (_, i) => `AB${i}CD-EF${i}GH`);
const STEP_UP_JWT = 'step-up-jwt-value';

const status = (over: Record<string, unknown> = {}) => ({
  available: true,
  enrolled: false,
  required: false,
  optional: true,
  enrolledAt: null,
  recoveryCodesRemaining: 0,
  verifiedThisSession: false,
  ...over,
});

function errorBody(code: number, details: Record<string, unknown> = {}) {
  return { data: null, error: { status: code, name: 'Err', message: 'raw server string', details } };
}

let host: HTMLElement | undefined;
let root: Root | undefined;
let queryClient: QueryClient;

function renderPanel(): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root!.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
          <MfaEnrolPanel />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
  return host;
}

// The query resolves over several microtask turns; a short real timer covers them.
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
}

function buttonByText(el: HTMLElement, text: string): HTMLButtonElement {
  const found = [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
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

async function typeAndSubmit(el: HTMLElement, inputId: string, text: string) {
  const input = el.querySelector<HTMLInputElement>(`#${inputId}`)!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => {
    input.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await settle();
}

const PHASE = (el: HTMLElement) =>
  el.querySelector('[data-slot="mfa-enrol-panel"]')?.getAttribute('data-phase') ?? null;

let setItemSpies: MockInstance[] = [];

beforeEach(() => {
  requests = [];
  writeClientToken('held-token');
  useAuthStore.setState({ token: 'held-token', hydrated: true, sessionExpired: false, mfaRequired: false });
  setItemSpies = [
    vi.spyOn(Storage.prototype, 'setItem'),
    ...(localStorage instanceof Storage ? [] : [vi.spyOn(localStorage, 'setItem')]),
  ];
});

afterEach(() => {
  strapi.defaults.adapter = originalAdapter;
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host.remove();
  }
  root = undefined;
  host = undefined;
  writeClientToken(null);
  vi.restoreAllMocks();
});

describe('availability', () => {
  test('renders nothing and makes no request beyond the status read when available is false', async () => {
    useAdapter(() => ({ status: 200, body: status({ available: false, optional: false }) }));
    const el = renderPanel();
    await settle();
    expect(el.querySelector('[data-slot="mfa-enrol-panel"]')).toBeNull();
    expect(el.textContent).toBe('');
    expect(requests).toEqual([{ method: 'GET', url: '/api/auth/mfa/status', body: undefined }]);
  });

  test('a failed status read renders nothing and does not retry', async () => {
    useAdapter(() => ({ status: 500, body: errorBody(500) }));
    const el = renderPanel();
    await settle();
    expect(el.querySelector('[data-slot="mfa-enrol-panel"]')).toBeNull();
    expect(requests).toHaveLength(1);
  });

  test('renders the panel when the status says available', async () => {
    useAdapter(() => ({ status: 200, body: status() }));
    const el = renderPanel();
    await settle();
    expect(PHASE(el)).toBe('idle');
    expect(buttonByText(el, enMessages.Auth.mfaSendCodeButton)).toBeTruthy();
  });
});

describe('enrolment state machine', () => {
  test('idle -> emailSent -> secretShown -> confirmed -> done, once, in memory only', async () => {
    useAdapter((config, body) => {
      if (config.url === '/api/auth/mfa/status') {
        return { status: 200, body: status() };
      }
      if (config.url === '/api/auth/mfa/enrol/start') {
        return (body as { emailCode?: string }).emailCode === undefined
          ? { status: 200, body: { sent: true, expiresInSeconds: 900 } }
          : { status: 200, body: { secret: SECRET, otpauthUri: URI, issuer: 'SchoolTest', account: 'ops@example.test' } };
      }
      if (config.url === '/api/auth/mfa/enrol/confirm') {
        return { status: 200, body: { recoveryCodes: RECOVERY, jwt: STEP_UP_JWT, expiresInSeconds: 3600 } };
      }
      return { status: 404, body: errorBody(404) };
    });
    const el = renderPanel();
    await settle();
    expect(PHASE(el)).toBe('idle');

    await click(buttonByText(el, enMessages.Auth.mfaSendCodeButton));
    expect(PHASE(el)).toBe('emailSent');
    expect(requests.at(-1)).toMatchObject({ url: '/api/auth/mfa/enrol/start', body: {} });

    await typeAndSubmit(el, 'mfa-email-code', '12345678');
    expect(PHASE(el)).toBe('secretShown');
    expect(requests.at(-1)).toMatchObject({ url: '/api/auth/mfa/enrol/start', body: { emailCode: '12345678' } });
    expect(el.querySelector('[data-slot="mfa-secret-key"]')?.textContent).toBe(
      'JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP',
    );
    expect(el.querySelector('[data-slot="mfa-secret-uri"]')?.textContent).toBe(URI);
    expect(el.querySelector('img, canvas, svg[data-qr]')).toBeNull();

    await typeAndSubmit(el, 'mfa-confirm-code', '654321');
    expect(PHASE(el)).toBe('confirmed');
    expect(requests.some((r) => r.url === '/api/auth/mfa/enrol/confirm' && JSON.stringify(r.body) === '{"code":"654321"}')).toBe(true);
    expect(readClientToken()).toBe(STEP_UP_JWT);
    expect(el.querySelectorAll('[data-slot="mfa-recovery-codes"] li')).toHaveLength(8);
    expect(el.textContent).toContain(RECOVERY[0]);
    expect(el.querySelector('[data-slot="mfa-secret"]')).toBeNull();

    await click(buttonByText(el, enMessages.Auth.mfaRecoveryAck));
    expect(PHASE(el)).toBe('done');
    expect(el.textContent).not.toContain(RECOVERY[0]);
    expect(el.textContent).not.toContain(SECRET.slice(0, 8));
    expect(el.querySelector('[data-slot="mfa-recovery-codes"]')).toBeNull();

    // The secret and codes are in component state only: no storage write, no cache entry.
    const sensitive = [SECRET, URI, ...RECOVERY];
    for (const spy of setItemSpies) {
      for (const call of spy.mock.calls) {
        const written = JSON.stringify(call);
        for (const value of sensitive) expect(written).not.toContain(value);
      }
    }
    const stored = JSON.stringify([
      Object.entries(localStorage),
      Object.entries(sessionStorage),
      queryClient.getQueryCache().getAll().map((q) => q.state.data),
      queryClient.getMutationCache().getAll().map((m) => m.state.data),
    ]);
    for (const value of sensitive) expect(stored).not.toContain(value);
  });

  test('a wrong emailed code keeps the person on the code step with an error', async () => {
    useAdapter((config) =>
      config.url === '/api/auth/mfa/status'
        ? { status: 200, body: status() }
        : (config.data as string).includes('emailCode')
          ? { status: 400, body: errorBody(400, { attemptsRemaining: 2 }) }
          : { status: 200, body: { sent: true, expiresInSeconds: 900 } },
    );
    const el = renderPanel();
    await settle();
    await click(buttonByText(el, enMessages.Auth.mfaSendCodeButton));
    await typeAndSubmit(el, 'mfa-email-code', '00000000');
    expect(PHASE(el)).toBe('emailSent');
    expect(el.querySelector('#mfa-email-code-error')?.textContent).toContain(enMessages.Auth.mfaInvalidCode);
  });

  test('a malformed code is refused locally without a request', async () => {
    useAdapter(() => ({ status: 200, body: status() }));
    const el = renderPanel();
    await settle();
    useAdapter((config) =>
      config.url === '/api/auth/mfa/status'
        ? { status: 200, body: status() }
        : { status: 200, body: { sent: true, expiresInSeconds: 900 } },
    );
    await click(buttonByText(el, enMessages.Auth.mfaSendCodeButton));
    const before = requests.length;
    await typeAndSubmit(el, 'mfa-email-code', '123');
    expect(requests).toHaveLength(before);
    expect(PHASE(el)).toBe('emailSent');
  });
});

describe('already enrolled', () => {
  const enrolled = status({
    enrolled: true,
    enrolledAt: '2026-10-01T02:00:00.000Z',
    recoveryCodesRemaining: 6,
    verifiedThisSession: false,
  });

  test('shows the enrolled status and the replace action', async () => {
    useAdapter(() => ({ status: 200, body: enrolled }));
    const el = renderPanel();
    await settle();
    const text = el.querySelector('[data-slot="mfa-enrolled-status"]')?.textContent ?? '';
    expect(text).toContain('Authenticator app set up on');
    expect(text).toContain('6 recovery codes remaining');
    expect(buttonByText(el, enMessages.Auth.mfaReplaceButton)).toBeTruthy();
    expect(el.textContent).not.toContain(enMessages.Auth.mfaSendCodeButton);
  });

  test('replace without proof asks the W3-20 host for the step-up dialog', async () => {
    useAdapter((config) =>
      config.url === '/api/auth/mfa/status'
        ? { status: 200, body: enrolled }
        : { status: 403, body: errorBody(403, { code: 'MFA_REQUIRED' }) },
    );
    const el = renderPanel();
    await settle();
    expect(useAuthStore.getState().mfaRequired).toBe(false);
    await click(buttonByText(el, enMessages.Auth.mfaReplaceButton));
    expect(useAuthStore.getState().mfaRequired).toBe(true);
    expect(el.textContent).toContain(enMessages.Auth.mfaReplaceNeedsStepUp);
    expect(PHASE(el)).toBe('idle');
  });

  test('replace with proof goes straight to the new secret', async () => {
    useAdapter((config) =>
      config.url === '/api/auth/mfa/status'
        ? { status: 200, body: { ...enrolled, verifiedThisSession: true } }
        : { status: 200, body: { secret: SECRET, otpauthUri: URI, issuer: 'SchoolTest', account: 'ops@example.test' } },
    );
    const el = renderPanel();
    await settle();
    await click(buttonByText(el, enMessages.Auth.mfaReplaceButton));
    expect(PHASE(el)).toBe('secretShown');
    expect(requests.at(-1)).toMatchObject({ url: '/api/auth/mfa/enrol/start', body: {} });
  });
});
