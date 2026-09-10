'use client';

import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { OpsOverviewTab } from '@/modules/ops/components/OpsOverviewTab';
import { OpsSchoolCountCards } from '@/modules/ops/components/OpsSchoolCountCards';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// ops/12 — offline regression for the school-detail pass-two surfaces: the
// design's FOUR stat cards (the classes and admins counts moved onto their tab
// badges) and the Overview tab's six-row details card with its inline Edit.
// The activity feed is mocked at its own boundary — its empty and populated
// states are covered by the school-activity spec; here it only needs to
// render inside the tab.

vi.mock('@/modules/ops/components/OpsSchoolActivity', () => ({
  OpsSchoolActivity: ({ documentId }: { documentId: string }) => (
    <div data-testid="ops-activity-mock" data-document-id={documentId} />
  ),
}));

// A render test needs only the fields these two components read; the full
// SchoolDetail contract row is exercised by the wire-typed fixtures in the
// e2e spec, so the fixture is cast rather than carrying 30 irrelevant fields.
const SCHOOL = {
  documentId: 'ops12schooldoc000000001',
  name: 'Fixture College',
  suburb: 'Riverview',
  state: 'NSW',
  sector: 'non-government',
  contact_name: 'Joan Example',
  contact_email: 'joan@fixture.schooltest.local',
  phone: null,
  portal_plan: 'standard',
  last_active_at: null as string | null,
  admin_count: 2,
  portal_teacher_count: 1,
  class_count: 0,
  student_count: 7,
  results_count: 3,
} as unknown as import('@schooltest/ops-contracts').SchoolDetail;

let host: HTMLElement | undefined;
let root: Root | undefined;

function renderSurface(element: React.ReactElement): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
        {element}
      </NextIntlClientProvider>,
    );
  });
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
});

describe('the four stat cards (ops/12)', () => {
  test('renders exactly the design’s four labels, all as plain figures (ops/43, R-23)', () => {
    const host = renderSurface(<OpsSchoolCountCards school={SCHOOL} />);

    const labels = [...host.querySelectorAll('[data-count-label]')].map((node) =>
      node.getAttribute('data-count-label'),
    );
    expect(labels).toEqual(['Students', 'Teachers', 'Tests this term', 'Last activity']);

    // R-23: no card is a click-through any more — teachers live in the drawn
    // Teachers tab, not behind a stat card.
    expect(host.querySelectorAll('[data-slot="ops-count-card"]').length).toBe(4);

    // The class count is GONE from the strip — it lives on the Classes tab
    // badge now (the design's placement), so no card may render it.
    expect(host.textContent).not.toContain('Classes');
  });

  test('a null last_active_at renders the catalogue "Never", never a date', () => {
    const host = renderSurface(<OpsSchoolCountCards school={SCHOOL} />);
    const lastActivityCard = host.querySelector('[data-count-label="Last activity"]');
    expect(lastActivityCard?.textContent).toContain('Never');
    expect(lastActivityCard?.textContent).not.toMatch(/\d{4}/);
  });
});

describe('the Overview tab body (ops/12)', () => {
  test('renders the design’s six rows with the inline Edit and the activity feed', () => {
    const host = renderSurface(<OpsOverviewTab school={SCHOOL} />);

    const details = host.querySelector('[data-slot="ops-overview-details"]');
    expect(details).not.toBeNull();
    for (const label of ['Sector', 'Location', 'Plan', 'Primary contact', 'Email', 'Phone']) {
      expect(details!.textContent).toContain(label);
    }
    // The old Last-activity ROW is gone — it is a stat card now.
    expect(details!.textContent).not.toContain('Last activity');

    const edit = details!.querySelector<HTMLButtonElement>('[data-testid="ops-overview-edit"]');
    expect(edit?.textContent).toBe('Edit');

    // The joined location renders suburb + state; the phone null renders the
    // D-33 unknown copy, whose en value is "unavailable".
    expect(details!.textContent).toContain('Riverview NSW');
    expect(details!.textContent).toContain('unavailable');

    expect(host.querySelector('[data-testid="ops-activity-mock"]')?.getAttribute('data-document-id')).toBe(
      SCHOOL.documentId,
    );
  });
});
