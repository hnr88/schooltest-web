import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { vi, type Mock } from 'vitest';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { OpsGuard } from '@/modules/auth/components/OpsGuard';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { useRequireOps } from '@/modules/auth/hooks/use-require-ops';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// GAP-6 — the guard's expired branch: the store's sessionExpired flag (raised
// by the axios boundary's auth-invalid signal) renders the design-drawn card
// over the kept-alive tree, while a normal session renders the children with
// no card at all. The deliberate sign-out path is the hook's redirect effect
// with the flag at false — asserted via the mocked hook's contract below.
vi.mock('@/modules/auth/hooks/use-require-ops', () => ({
  useRequireOps: vi.fn(),
}));

const useRequireOpsMock = useRequireOps as unknown as Mock;

let host: HTMLElement | undefined;
let root: Root | undefined;

function renderGuard(childText = 'guarded-content'): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
        <OpsGuard>
          <section data-slot="guarded">{childText}</section>
        </OpsGuard>
      </NextIntlClientProvider>,
    );
  });
  return host;
}

beforeEach(() => {
  host = undefined;
  root = undefined;
  useAuthStore.setState({ token: 'jwt', hydrated: true, sessionExpired: false });
  useRequireOpsMock.mockReset();
});

afterEach(() => {
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host!.remove();
  }
});

describe('OpsGuard session-expired branch (GAP-6)', () => {
  test('the expired flag renders the drawn card over the still-mounted tree', () => {
    useRequireOpsMock.mockReturnValue({ isReady: true, isOps: true, roleType: 'ops', sessionExpired: true });
    useAuthStore.setState({ sessionExpired: true });
    const host = renderGuard();
    const card = host.querySelector('[data-slot="ops-session-expired"]');
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain('Your session has expired');
    expect(card!.textContent).toContain('nothing you saved was lost');
    expect(card!.textContent).toContain('Sign in again');
    // the tree beneath stays mounted — nothing is torn down
    expect(host.querySelector('[data-slot="guarded"]')?.textContent).toBe('guarded-content');
  });

  test('the expired card renders even while the guard is still pending', () => {
    useRequireOpsMock.mockReturnValue({ isReady: false, isOps: null, roleType: null, sessionExpired: true });
    useAuthStore.setState({ sessionExpired: true });
    const host = renderGuard();
    expect(host.querySelector('[data-slot="ops-session-expired"]')).not.toBeNull();
    expect(host.querySelector('[data-slot="ops-guard-pending"]')).not.toBeNull();
    expect(host.querySelector('[data-slot="guarded"]')).toBeNull();
  });

  test('a normal session renders children with no card', () => {
    useRequireOpsMock.mockReturnValue({ isReady: true, isOps: true, roleType: 'ops', sessionExpired: false });
    const host = renderGuard();
    expect(host.querySelector('[data-slot="ops-session-expired"]')).toBeNull();
    expect(host.querySelector('[data-slot="guarded"]')?.textContent).toBe('guarded-content');
  });

  test('a pending normal session renders the skeleton, never the card', () => {
    useRequireOpsMock.mockReturnValue({ isReady: false, isOps: null, roleType: null, sessionExpired: false });
    const host = renderGuard();
    expect(host.querySelector('[data-slot="ops-session-expired"]')).toBeNull();
    expect(host.querySelector('[data-slot="ops-guard-pending"]')).not.toBeNull();
  });

  test('the store raises the flag from the auth-invalid signal and clears it on an explicit token write', () => {
    // the axios boundary calls this through the module-level subscription
    useAuthStore.getState().markSessionExpired();
    expect(useAuthStore.getState().sessionExpired).toBe(true);
    // deliberate sign-out: any explicit setToken clears the expired state
    useAuthStore.getState().setToken(null);
    expect(useAuthStore.getState().sessionExpired).toBe(false);
    // a fresh sign-in clears it too
    useAuthStore.getState().markSessionExpired();
    useAuthStore.getState().setToken('fresh-jwt');
    expect(useAuthStore.getState().sessionExpired).toBe(false);
  });
});
