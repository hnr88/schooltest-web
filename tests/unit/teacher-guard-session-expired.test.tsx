import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, type Mock } from 'vitest';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { TeacherGuard } from '@/modules/auth/components/TeacherGuard';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { useRequireTeacher } from '@/modules/auth/hooks/use-require-teacher';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// U-25 — the teacher twin of ops-guard-session-expired.test.tsx (GAP-6): the
// guard's expired branch renders the design-drawn card over the kept-alive
// tree, while a normal session renders the children with no card at all. The
// deliberate sign-out path is the store's own contract: an explicit token
// write clears the expired flag, so the normal redirect paths stay intact.
// The card reads the configured session timeout (D-14), so the harness mounts
// a real, isolated QueryClient — the same harness ops-staff-invitation-actions
// uses; the read stays pending/errors in jsdom and the body renders its
// no-timeout sentence.
vi.mock('@/modules/auth/hooks/use-require-teacher', () => ({
  useRequireTeacher: vi.fn(),
}));

const useRequireTeacherMock = useRequireTeacher as unknown as Mock;

// The body copy moved to the Capabilities namespace (D-14) and comes in two
// variants — with and without the configured minutes. Both end in the same
// tail, so the shared sentence is DERIVED from the catalog, never hard-coded.
const EXPIRED_BODY_TAIL = (
  (enMessages as { Ops: { capabilities: Record<string, string> } }).Ops.capabilities
    .sessionExpiredBodyNoTimeout as string
)
  .split('. ')
  .pop() as string;

let host: HTMLElement | undefined;
let root: Root | undefined;
let queryClient: QueryClient;

function renderGuard(childText = 'guarded-content'): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
          <TeacherGuard>
            <section data-slot="guarded">{childText}</section>
          </TeacherGuard>
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );
  });
  return host;
}

beforeEach(() => {
  host = undefined;
  root = undefined;
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ token: 'jwt', hydrated: true, sessionExpired: false });
  useRequireTeacherMock.mockReset();
});

afterEach(() => {
  if (root !== undefined && host !== undefined) {
    act(() => root!.unmount());
    host!.remove();
  }
});

describe('TeacherGuard session-expired branch (U-25)', () => {
  test('the expired flag renders the drawn card over the still-mounted tree', () => {
    useRequireTeacherMock.mockReturnValue({
      isReady: true,
      isTeacher: true,
      roleType: 'teacher',
      sessionExpired: true,
    });
    useAuthStore.setState({ sessionExpired: true });
    const host = renderGuard();
    const card = host.querySelector('[data-slot="ops-session-expired"]');
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain('Your session has expired');
    expect(card!.textContent).toContain(EXPIRED_BODY_TAIL);
    expect(card!.textContent).toContain('Sign in again');
    // the tree beneath stays mounted — nothing is torn down
    expect(host.querySelector('[data-slot="guarded"]')?.textContent).toBe('guarded-content');
  });

  test('the expired card renders even while the guard is still pending', () => {
    useRequireTeacherMock.mockReturnValue({
      isReady: false,
      isTeacher: null,
      roleType: null,
      sessionExpired: true,
    });
    useAuthStore.setState({ sessionExpired: true });
    const host = renderGuard();
    expect(host.querySelector('[data-slot="ops-session-expired"]')).not.toBeNull();
    expect(host.querySelector('[data-slot="teacher-guard-pending"]')).not.toBeNull();
    expect(host.querySelector('[data-slot="guarded"]')).toBeNull();
  });

  test('a normal session renders children with no card', () => {
    useRequireTeacherMock.mockReturnValue({
      isReady: true,
      isTeacher: true,
      roleType: 'teacher',
      sessionExpired: false,
    });
    const host = renderGuard();
    expect(host.querySelector('[data-slot="ops-session-expired"]')).toBeNull();
    expect(host.querySelector('[data-slot="guarded"]')?.textContent).toBe('guarded-content');
  });

  test('a pending normal session renders the skeleton, never the card', () => {
    useRequireTeacherMock.mockReturnValue({
      isReady: false,
      isTeacher: null,
      roleType: null,
      sessionExpired: false,
    });
    const host = renderGuard();
    expect(host.querySelector('[data-slot="ops-session-expired"]')).toBeNull();
    expect(host.querySelector('[data-slot="teacher-guard-pending"]')).not.toBeNull();
  });

  test('a deliberate sign-out still clears the flag — the redirects stay intact', () => {
    // the axios boundary raises the flag through the module-level subscription
    useAuthStore.getState().markSessionExpired();
    expect(useAuthStore.getState().sessionExpired).toBe(true);
    // deliberate sign-out: any explicit setToken clears the expired state, so
    // the tokenless → /sign-in redirect is back in charge — never the wall
    useAuthStore.getState().setToken(null);
    expect(useAuthStore.getState().sessionExpired).toBe(false);
    // a fresh sign-in clears it too
    useAuthStore.getState().markSessionExpired();
    useAuthStore.getState().setToken('fresh-jwt');
    expect(useAuthStore.getState().sessionExpired).toBe(false);
  });
});
