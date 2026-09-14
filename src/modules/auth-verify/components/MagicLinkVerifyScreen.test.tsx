import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { MagicLinkVerifyScreen } from '@/modules/auth-verify/components/MagicLinkVerifyScreen';
import { useMagicLinkVerify } from '@/modules/auth-verify/queries/use-magic-link-verify.query';

vi.mock('@/modules/auth-verify/queries/use-magic-link-verify.query', () => ({
  useMagicLinkVerify: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: { children?: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// The three designed states of the web fallback, driven through the hook's
// return (the query/claim itself is the API's contract, not this screen's).
function mockHook(returnValue: Record<string, unknown>) {
  vi.mocked(useMagicLinkVerify).mockReturnValue(returnValue as never);
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(ui: ReactElement): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  host = container;
  root = createRoot(container);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>,
    );
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.clearAllMocks();
});

const TOKEN = 'a'.repeat(64);

const STUDENT_SUCCESS = {
  name: 'Mia',
  detail: '3/4A — Ms Smith · Greenfield Public School',
};

describe('MagicLinkVerifyScreen — the three designed states', () => {
  test('pending shows the signing-in status and nothing else', () => {
    mockHook({ data: undefined, isPending: true, isError: false });
    const view = render(<MagicLinkVerifyScreen variant="student" token={TOKEN} />);
    const screen = view.querySelector('[data-slot="magic-link-verify"]');
    expect(screen?.getAttribute('data-state')).toBe('pending');
    expect(screen?.textContent).toContain('Signing you in…');
    // the token must never be rendered
    expect(view.textContent).not.toContain(TOKEN);
  });

  test('success greets the student by name with class and school, and a home button', () => {
    mockHook({ data: STUDENT_SUCCESS, isPending: false, isError: false });
    const view = render(<MagicLinkVerifyScreen variant="student" token={TOKEN} />);
    const screen = view.querySelector('[data-slot="magic-link-verify"]');
    expect(screen?.getAttribute('data-state')).toBe('success');
    expect(screen?.textContent).toContain("You're signed in");
    expect(screen?.textContent).toContain('Mia');
    expect(screen?.textContent).toContain('Greenfield Public School');
    expect(screen?.querySelector('a')?.getAttribute('href')).toBe('/');
  });

  test('error is the same screen for both variants, with variant copy and no retry of a spent token', () => {
    mockHook({ data: undefined, isPending: false, isError: true });
    const student = render(<MagicLinkVerifyScreen variant="student" token="" />);
    expect(
      student.querySelector('[data-slot="magic-link-verify"]')?.getAttribute('data-state'),
    ).toBe('error');
    expect(student.textContent).toContain("We couldn't sign you in");
    expect(student.textContent).toContain('Ask your parent to send a new one.');

    mockHook({ data: undefined, isPending: false, isError: true });
    const teacher = render(<MagicLinkVerifyScreen variant="teacher" token={TOKEN} />);
    expect(teacher.textContent).toContain('Ask for a new trial link.');
  });
});
