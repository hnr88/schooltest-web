import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { BandChip } from '@/modules/teacher/components/v2/BandChip';
import { ClassBadge } from '@/modules/teacher/components/v2/ClassBadge';
import { DeltaText } from '@/modules/teacher/components/v2/DeltaText';
import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { KpiCard } from '@/modules/teacher/components/v2/KpiCard';
import { PhaseChip } from '@/modules/teacher/components/v2/PhaseChip';
import { TeacherStatusPill } from '@/modules/teacher/components/v2/TeacherStatusPill';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';

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

describe('Teacher v2 kit — display pieces', () => {
  test('ToneChip draws the design pair on the design-system StatusPill', () => {
    const view = render(<ToneChip tone="scheduled" dot>Label</ToneChip>);
    const pill = view.querySelector('[data-slot="status-pill"]');
    expect(pill?.textContent).toBe('Label');
    expect(pill?.className).toContain('bg-[#FDF4E3]');
    expect(pill?.className).toContain('text-[#8A5A00]');
    expect(pill?.getAttribute('data-tone')).toBe('warning');
  });

  test('TeacherStatusPill: live badge, list dot, tile pill and header pill', () => {
    const view = render(
      <div>
        <TeacherStatusPill status="live" size="sm" />
        <TeacherStatusPill status="live" size="xs" />
        <TeacherStatusPill status="scheduled" />
        <TeacherStatusPill status="sittingNow" size="lg" />
        <TeacherStatusPill status="complete" appearance="dot" />
      </div>,
    );
    const pills = view.querySelectorAll('[data-slot="status-pill"]');
    expect(pills[0]?.textContent).toBe('LIVE NOW');
    expect(pills[0]?.className).toContain('bg-[#DC2626]');
    expect(pills[0]?.querySelector('.animate-om-pulse')).not.toBeNull();
    expect(pills[1]?.textContent).toBe('LIVE');
    expect(pills[2]?.textContent).toBe('Scheduled');
    expect(pills[3]?.textContent).toBe('Sitting now');
    expect(pills[3]?.querySelector('.animate-om-pulse-ring')).not.toBeNull();
    const dot = view.querySelector('[data-slot="teacher-status-dot"]');
    expect(dot?.textContent).toBe('Complete');
    expect(dot?.getAttribute('data-status-key')).toBe('complete');
  });

  test('ClassBadge is a decorative square code', () => {
    const view = render(<ClassBadge code="8B" size="md" />);
    const badge = view.querySelector('[data-slot="class-badge"]');
    expect(badge?.textContent).toBe('8B');
    expect(badge?.getAttribute('aria-hidden')).toBe('true');
    expect(badge?.className).toContain('size-10');
  });

  test('DeltaText spells the direction and the missing value', () => {
    const view = render(
      <div>
        <DeltaText value={4} />
        <DeltaText value={-2} format="signed" />
        <DeltaText value={null} />
      </div>,
    );
    const deltas = [...view.querySelectorAll('[data-slot="delta-text"]')];
    expect(deltas.map((node) => node.textContent)).toEqual(['↑4', '−2', '—']);
    expect(deltas.map((node) => node.getAttribute('data-direction'))).toEqual(['up', 'down', 'none']);
  });

  test('PhaseChip and BandChip read the catalog, null phase is "Not sat"', () => {
    const view = render(
      <div>
        <PhaseChip phase="developing" />
        <PhaseChip phase={null} />
        <BandChip band="notYet" />
      </div>,
    );
    const pills = view.querySelectorAll('[data-slot="status-pill"]');
    expect(pills[0]?.textContent).toBe('Developing');
    expect(pills[0]?.className).toContain('bg-[#EAF0FB]');
    expect(pills[1]?.textContent).toBe('Not sat');
    expect(pills[2]?.textContent).toBe('Not yet');
    expect(pills[2]?.className).toContain('text-[#B42318]');
  });

  test('InitialsAvatar derives initials; KpiCard count puts the value first', () => {
    const view = render(
      <div>
        <InitialsAvatar name="Kaveh B." size="md" />
        <KpiCard variant="count" label="Scored" value={7} tone="success" />
      </div>,
    );
    expect(view.querySelector('[data-slot="avatar-tint"]')?.textContent).toBe('KB');
    const card = view.querySelector('[data-slot="kpi-card"]');
    expect(card?.textContent).toBe('7Scored');
    expect(card?.firstElementChild?.className).toContain('text-[#1F7A4D]');
  });
});
