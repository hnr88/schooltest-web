import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { vi, type Mock } from 'vitest';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { OpsGuard } from '@/modules/auth/components/OpsGuard';
import { OpsSessionExpiredCard } from '@/modules/auth/components/OpsSessionExpiredCard';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { useRequireOps } from '@/modules/auth/hooks/use-require-ops';
import { usePlatformSettingsQuery } from '@/modules/ops/queries/use-platform-settings.query';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// GAP-6 — the guard's expired branch: the store's sessionExpired flag (raised
// by the axios boundary's auth-invalid signal) renders the design-drawn card
// over the kept-alive tree, while a normal session renders the children with
// no card at all. The deliberate sign-out path is the hook's redirect effect
// with the flag at false — asserted via the mocked hook's contract below.
vi.mock('@/modules/auth/hooks/use-require-ops', () => ({
  useRequireOps: vi.fn(),
}));

// The card's D-14 read is mocked at the hook boundary: a REAL read here would
// carry a live token into the axios auth boundary, whose auth-invalid handling
// writes the very store under test. The hook's fetch/parse contract is owned
// by the settings-read spec and the C-OPS-PORTAL-067 e2e coverage.
vi.mock('@/modules/ops/queries/use-platform-settings.query', () => ({
  usePlatformSettingsQuery: vi.fn(),
}));

const useRequireOpsMock = useRequireOps as unknown as Mock;
const useSettingsMock = usePlatformSettingsQuery as unknown as Mock;

let host: HTMLElement | undefined;
let root: Root | undefined;

// Only `data` is read by the card; the rest mirrors the hook's result shape.
const SETTINGS_READ = (minutes: number | undefined) => ({
  data:
    minutes === undefined
      ? undefined
      : {
          documentId: 'settingsdoc000000000000000',
          site_name: 'SchoolTest',
          session_timeout_minutes: minutes,
          updatedAt: '2026-09-09T00:00:00.000Z',
        },
});

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

// The teacher wall is the same pure card rendered by TeacherGuard with no
// timeout prop and no provider of reads — rendered here exactly so.
function renderCard(): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
        <OpsSessionExpiredCard />
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
  useSettingsMock.mockReset();
  useSettingsMock.mockReturnValue(SETTINGS_READ(undefined));
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

  // D-14: the wall names the CONFIGURED timeout, never a hardcoded number.
  // The read is disabled at expiry (`enabled: false`) — the number the card
  // shows is the guard's last good cached answer.
  test('the wall names the configured session timeout from the settings read', () => {
    useRequireOpsMock.mockReturnValue({ isReady: true, isOps: true, roleType: 'ops', sessionExpired: true });
    useAuthStore.setState({ sessionExpired: true });
    useSettingsMock.mockReturnValue(SETTINGS_READ(60));
    const host = renderGuard();
    const card = host.querySelector('[data-slot="ops-session-expired"]');
    expect(card!.textContent).toContain('Your session ended after 60 minutes of inactivity');
    expect(card!.textContent).not.toContain('30 minutes');
    expect(useSettingsMock).toHaveBeenCalledWith(false);
  });

  test('while the settings read is pending the wall renders without a number', () => {
    useRequireOpsMock.mockReturnValue({ isReady: true, isOps: true, roleType: 'ops', sessionExpired: true });
    useAuthStore.setState({ sessionExpired: true });
    useSettingsMock.mockReturnValue(SETTINGS_READ(undefined));
    const host = renderGuard();
    const card = host.querySelector('[data-slot="ops-session-expired"]');
    // the sentence still tells the operator why, minus the number it cannot know
    expect(card!.textContent).toContain('nothing you saved was lost');
    expect(card!.textContent).not.toMatch(/after \d+ minutes/);
    expect(useSettingsMock).toHaveBeenCalledWith(false);
  });

  test('a live ops session keeps the settings read enabled', () => {
    useRequireOpsMock.mockReturnValue({ isReady: true, isOps: true, roleType: 'ops', sessionExpired: false });
    renderGuard();
    expect(useSettingsMock).toHaveBeenCalledWith(true);
  });

  test('the teacher wall renders the fallback copy and never requests the settings read', () => {
    // TeacherGuard mounts the same pure card with no timeout prop: the wall
    // renders, the sentence carries no number, and the ops-only read is never
    // so much as invoked — a teacher session cannot be answered for it.
    const host = renderCard();
    const card = host.querySelector('[data-slot="ops-session-expired"]');
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain('Your session has expired');
    expect(card!.textContent).toContain('after a period of inactivity');
    expect(card!.textContent).toContain('nothing you saved was lost');
    expect(card!.textContent).not.toMatch(/after \d+ minutes/);
    expect(useSettingsMock).not.toHaveBeenCalled();
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
