import { act, type ReactElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { ComingSoonPanel } from '@/modules/teacher/components/ComingSoonPanel';
import { BackButton } from '@/modules/teacher/components/v2/BackButton';
import { Breadcrumbs } from '@/modules/teacher/components/v2/Breadcrumbs';
import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import { TeacherPageCard } from '@/modules/teacher/components/v2/TeacherPageCard';
import { TeacherPageHeader } from '@/modules/teacher/components/v2/TeacherPageHeader';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: { children?: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

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
});

describe('Teacher v2 kit — layout pieces', () => {
  test('TeacherPageCard + TeacherPageHeader carry the surface markers and the header slots', () => {
    const view = render(
      <TeacherPageCard data-surface="probe" data-status="ready">
        <TeacherPageHeader title="Title" subtitle="Sub" meta="Meta" actions={<button type="button">Act</button>} />
      </TeacherPageCard>,
    );
    const card = view.querySelector('[data-slot="teacher-page-card"]');
    expect(card?.getAttribute('data-surface')).toBe('probe');
    expect(card?.getAttribute('data-status')).toBe('ready');
    expect(card?.className).toContain('rounded-[14px]');
    expect(view.querySelector('h1')?.textContent).toBe('Title');
    expect(view.querySelector('[data-slot="teacher-page-meta"]')?.textContent).toBe('Meta');
    expect(view.querySelector('button')?.textContent).toBe('Act');
  });

  test('SectionCard renders its heading, description and body on the design-system panel', () => {
    const view = render(
      <SectionCard title="Panel" description="Describes">
        <p>Body</p>
      </SectionCard>,
    );
    const panel = view.querySelector('[data-kit="section-card"]');
    expect(panel?.tagName).toBe('SECTION');
    expect(panel?.querySelector('h2')?.textContent).toBe('Panel');
    expect(panel?.textContent).toContain('Describes');
    expect(panel?.textContent).toContain('Body');
  });

  test('BackButton is a link with a route and a button without one', () => {
    const onBack = vi.fn();
    const view = render(
      <div>
        <BackButton href="/dashboard/results" title="Back to list" />
        <BackButton onClick={onBack} />
      </div>,
    );
    const [link, button] = [...view.querySelectorAll('[data-slot="back-button"]')];
    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('href')).toBe('/dashboard/results');
    expect(link?.textContent).toBe('Back');
    expect(button?.tagName).toBe('BUTTON');
    act(() => (button as HTMLButtonElement | undefined)?.click());
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('Breadcrumbs link the ancestors and mark the current page', () => {
    const view = render(
      <Breadcrumbs
        back={{ href: '/dashboard/results' }}
        items={[{ label: 'Classes', href: '/dashboard/results' }, { label: 'Current' }]}
      />,
    );
    const nav = view.querySelector('nav[data-slot="breadcrumb"]');
    expect(nav).not.toBeNull();
    const links = [...view.querySelectorAll('a')].map((node) => node.textContent);
    expect(links).toEqual(['Back', 'Classes']);
    expect(view.querySelector('[aria-current="page"]')?.textContent).toBe('Current');
    expect(view.querySelector('[data-slot="breadcrumb-separator"]')?.textContent).toBe('/');
  });

  test('ComingSoonPanel draws the title, the body and the skill chips', () => {
    const view = render(<ComingSoonPanel title="Soon title" description="Soon body" showSkillChips />);
    const panel = view.querySelector('[data-slot="coming-soon-panel"]');
    const headingId = panel?.getAttribute('aria-labelledby') ?? '';
    expect(panel?.querySelector('h2')?.id).toBe(headingId);
    expect(panel?.textContent).toContain('Soon body');
    expect(view.querySelectorAll('[data-slot="skill-status-chip"]')).toHaveLength(4);
    expect(view.querySelector('[data-state="live"]')?.className).toContain('bg-[#E9F6EF]');
  });
});
