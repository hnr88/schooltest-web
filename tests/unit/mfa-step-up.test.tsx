import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { NextIntlClientProvider } from 'next-intl';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { readClientToken, strapi, writeClientToken } from '@/lib/axios/strapi';
import enMessages from '@/i18n/messages/en.json';
import { MfaStepUpHost } from '@/modules/auth/components/MfaStepUpHost';
import { classifyMfaError } from '@/modules/auth/lib/classify-mfa-error';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// W3-20 (D3 MFA-3). The strapi axios instance is driven through a request
// adapter (the repo's rest-boundary seam: no network, no environment beyond
// jsdom). The e2e spec mfa-default-off.spec.ts covers the live default-OFF path.

type Handler = (config: InternalAxiosRequestConfig) => { status: number; body: unknown };

const originalAdapter = strapi.defaults.adapter;
let requests: { url: string; data: unknown; authorization: unknown }[] = [];

function useAdapter(handler: Handler) {
  strapi.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    requests.push({
      url: config.url ?? '',
      data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      authorization: config.headers?.Authorization,
    });
    const { status, body } = handler(config);
    const response: AxiosResponse = { data: body, status, statusText: String(status), headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError('request failed', 'ERR_BAD_REQUEST', config, undefined, response);
  };
}

const MFA_REQUIRED_BODY = {
  data: null,
  error: { status: 403, name: 'ForbiddenError', message: 'Forbidden', details: { code: 'MFA_REQUIRED' } },
};

function errorBody(status: number, details: Record<string, unknown> = {}) {
  return { data: null, error: { status, name: 'Err', message: 'raw server string', details } };
}

let host: HTMLElement | undefined;
let root: Root | undefined;

function renderHost(): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root!.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
          <MfaStepUpHost />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
  return host;
}

function typeInto(input: HTMLInputElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function submit(form: HTMLFormElement) {
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  requests = [];
  writeClientToken('held-token');
  useAuthStore.setState({ token: 'held-token', hydrated: true, sessionExpired: false, mfaRequired: false });
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
});

describe('axios boundary raises the MFA step-up flag', () => {
  test('a 403 MFA_REQUIRED sets the flag, keeps the token and does not sign out', async () => {
    useAdapter(() => ({ status: 403, body: MFA_REQUIRED_BODY }));
    await strapi.get('/api/users/me').catch(() => undefined);
    expect(useAuthStore.getState().mfaRequired).toBe(true);
    expect(useAuthStore.getState().sessionExpired).toBe(false);
    expect(readClientToken()).toBe('held-token');
  });

  test('a plain 403 does not raise the flag', async () => {
    useAdapter(() => ({ status: 403, body: errorBody(403, {}) }));
    await strapi.get('/api/ops/users').catch(() => undefined);
    expect(useAuthStore.getState().mfaRequired).toBe(false);
  });

  test('a 403 MFA_NOT_AVAILABLE does not raise the flag', async () => {
    useAdapter(() => ({ status: 403, body: errorBody(403, { code: 'MFA_NOT_AVAILABLE' }) }));
    await strapi.get('/api/ops/users').catch(() => undefined);
    expect(useAuthStore.getState().mfaRequired).toBe(false);
  });

  test('a 401 is the expired signal, not the MFA one', async () => {
    useAdapter(() => ({ status: 401, body: errorBody(401) }));
    await strapi.get('/api/users/me').catch(() => undefined);
    expect(useAuthStore.getState().mfaRequired).toBe(false);
    expect(useAuthStore.getState().sessionExpired).toBe(true);
  });

  test('MFA_REQUIRED answered by the MFA surface itself never re-raises the flag', async () => {
    useAdapter(() => ({ status: 403, body: MFA_REQUIRED_BODY }));
    await strapi.post('/api/auth/mfa/verify', { code: '123456' }).catch(() => undefined);
    expect(useAuthStore.getState().mfaRequired).toBe(false);
  });

  test('any explicit token write clears the flag', () => {
    useAuthStore.getState().markMfaRequired();
    expect(useAuthStore.getState().mfaRequired).toBe(true);
    useAuthStore.getState().setToken('other');
    expect(useAuthStore.getState().mfaRequired).toBe(false);
  });
});

describe('MfaStepUpHost', () => {
  test('renders nothing and issues no request while the flag is clear', () => {
    useAdapter(() => ({ status: 200, body: {} }));
    const el = renderHost();
    expect(el.querySelector('[data-slot="mfa-step-up"]')).toBeNull();
    expect(requests).toHaveLength(0);
  });

  test('renders the blocking dialog when the flag is set', () => {
    useAuthStore.setState({ mfaRequired: true });
    const el = renderHost();
    const dialog = el.querySelector('[data-slot="mfa-step-up"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).toContain('Verify your identity');
    const input = dialog!.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.getAttribute('inputmode')).toBe('numeric');
  });

  test('a valid code stores the step-up token, clears the flag and closes the dialog', async () => {
    useAuthStore.setState({ mfaRequired: true });
    useAdapter(() => ({ status: 200, body: { jwt: 'step-up-jwt', expiresInSeconds: 900 } }));
    const el = renderHost();
    typeInto(el.querySelector('input') as HTMLInputElement, '123456');
    await submit(el.querySelector('form') as HTMLFormElement);
    expect(requests[0]).toMatchObject({
      url: '/api/auth/mfa/verify',
      data: { code: '123456' },
      authorization: 'Bearer held-token',
    });
    expect(readClientToken()).toBe('step-up-jwt');
    expect(useAuthStore.getState().token).toBe('step-up-jwt');
    expect(useAuthStore.getState().mfaRequired).toBe(false);
    expect(el.querySelector('[data-slot="mfa-step-up"]')).toBeNull();
  });

  test('the recovery toggle sends { recoveryCode } only', async () => {
    useAuthStore.setState({ mfaRequired: true });
    useAdapter(() => ({ status: 200, body: { jwt: 'step-up-jwt', expiresInSeconds: 900 } }));
    const el = renderHost();
    const toggle = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('recovery code'),
    )!;
    act(() => toggle.click());
    typeInto(el.querySelector('input') as HTMLInputElement, 'ABCDE-FGHJK');
    await submit(el.querySelector('form') as HTMLFormElement);
    expect(requests[0].data).toEqual({ recoveryCode: 'ABCDE-FGHJK' });
    expect(readClientToken()).toBe('step-up-jwt');
  });

  test('a wrong code shows the translated message with attempts, never the raw string', async () => {
    useAuthStore.setState({ mfaRequired: true });
    useAdapter(() => ({ status: 400, body: errorBody(400, { attemptsRemaining: 3 }) }));
    const el = renderHost();
    typeInto(el.querySelector('input') as HTMLInputElement, '000000');
    await submit(el.querySelector('form') as HTMLFormElement);
    const text = el.querySelector('[data-slot="mfa-step-up"]')!.textContent ?? '';
    expect(text).toContain('That code is not correct');
    expect(text).toContain('3 attempts left');
    expect(text).not.toContain('raw server string');
    expect(readClientToken()).toBe('held-token');
    expect(useAuthStore.getState().mfaRequired).toBe(true);
  });

  test('a malformed code is rejected locally with no request', async () => {
    useAuthStore.setState({ mfaRequired: true });
    useAdapter(() => ({ status: 200, body: {} }));
    const el = renderHost();
    typeInto(el.querySelector('input') as HTMLInputElement, '12ab');
    await submit(el.querySelector('form') as HTMLFormElement);
    expect(requests).toHaveLength(0);
    expect(el.textContent).toContain('That code is not correct');
  });
});

describe('classifyMfaError', () => {
  function failure(status: number | null, details: Record<string, unknown> = {}) {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    const response =
      status === null
        ? undefined
        : ({ data: errorBody(status, details), status, statusText: '', headers: {}, config } as AxiosResponse);
    return new AxiosError('x', 'ERR', config, undefined, response);
  }

  test.each([
    [400, {}, { key: 'invalidCode' }],
    [400, { attemptsRemaining: 2 }, { key: 'invalidCode', attemptsRemaining: 2 }],
    [
      400,
      { attemptsRemaining: 0, unlockAt: '2026-10-12T01:00:00.000Z', retryAfterSeconds: 900 },
      { key: 'locked', unlockAt: '2026-10-12T01:00:00.000Z' },
    ],
    [400, { code: 'MFA_NOT_ENROLLED' }, { key: 'notAvailable' }],
    [403, { code: 'MFA_NOT_AVAILABLE' }, { key: 'notAvailable' }],
    [403, {}, { key: 'server' }],
    [429, { retryAfterSeconds: 30 }, { key: 'tooManyRequests' }],
    [null, {}, { key: 'offline' }],
    [500, {}, { key: 'server' }],
  ])('status %s %j', (status, details, expected) => {
    expect(classifyMfaError(failure(status, details))).toEqual(expected);
  });

  test('a non-axios error is a server failure', () => {
    expect(classifyMfaError(new Error('boom'))).toEqual({ key: 'server' });
  });
});
