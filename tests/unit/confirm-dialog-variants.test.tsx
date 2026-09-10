import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';

// school-admin/05 — the portal has ONE confirm (U-24 / R-19), so this pins all
// four variants and both slots on the single component. A seventh confirm
// dialog is forbidden; these cases are what make that safe to enforce.
//
// The dialog renders through a portal, so every query goes against
// document.body rather than the mount container.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(ui: React.ReactElement) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>{ui}</NextIntlClientProvider>,
    ),
  );
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = '';
});

const BASE = {
  open: true,
  onOpenChange: () => {},
  title: 'Remove Ada Lovelace',
  description: 'Their access ends immediately.',
  confirmLabel: 'Remove',
  cancelLabel: 'Cancel',
  onConfirm: () => {},
};

function buttonTexts(): string[] {
  return [...document.body.querySelectorAll('button')].map((b) => b.textContent?.trim() ?? '');
}

describe('OpsConfirmDialog — four variants from one component', () => {
  test('neutral: both buttons, no warning icon', () => {
    mount(<OpsConfirmDialog {...BASE} />);
    expect(buttonTexts()).toContain('Remove');
    expect(buttonTexts()).toContain('Cancel');
    // the warning icon is the destructive tone's marker, not the neutral one's
    expect(document.body.querySelector('svg')).toBeNull();
  });

  test('destructive: keeps both buttons and adds the warning icon', () => {
    mount(<OpsConfirmDialog {...BASE} tone="destructive" />);
    expect(buttonTexts()).toContain('Remove');
    expect(buttonTexts()).toContain('Cancel');
    expect(document.body.querySelector('svg')).not.toBeNull();
  });

  test('advisory: ONE button and no action at all', () => {
    const onConfirm = vi.fn();
    mount(
      <OpsConfirmDialog
        {...BASE}
        variant="advisory"
        cancelLabel="Close"
        onConfirm={onConfirm}
      />,
    );
    expect(buttonTexts()).toEqual(['Close']);
    expect(buttonTexts()).not.toContain('Remove');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('two-step: the action survives until dispatched, then cannot be re-fired', () => {
    mount(<OpsConfirmDialog {...BASE} variant="two-step" dispatched={false} />);
    expect(buttonTexts()).toContain('Remove');
    act(() => root!.unmount());
    host!.remove();

    // Once dispatched, the request is in the air and the dialog must not offer
    // to send it again — a confirm cannot recall a dispatch (§A-confirm).
    mount(<OpsConfirmDialog {...BASE} variant="two-step" dispatched />);
    expect(buttonTexts()).toEqual(['Cancel']);
  });
});

describe('OpsConfirmDialog — the two slots', () => {
  test('notice renders when supplied and collapses to nothing when not', () => {
    mount(
      <OpsConfirmDialog
        {...BASE}
        notice={{ title: 'They still have reporting duties', body: 'Reassign them first.' }}
      />,
    );
    expect(document.body.textContent).toContain('They still have reporting duties');
    expect(document.body.textContent).toContain('Reassign them first.');
    act(() => root!.unmount());
    host!.remove();

    mount(<OpsConfirmDialog {...BASE} />);
    expect(document.body.textContent).not.toContain('They still have reporting duties');
  });

  test('media renders when supplied and collapses to nothing when not', () => {
    mount(<OpsConfirmDialog {...BASE} media={<span data-testid="tile">!</span>} />);
    expect(document.body.querySelector('[data-testid="tile"]')).not.toBeNull();
    act(() => root!.unmount());
    host!.remove();

    mount(<OpsConfirmDialog {...BASE} />);
    expect(document.body.querySelector('[data-testid="tile"]')).toBeNull();
  });
});

describe('OpsConfirmDialog — pending disables both buttons', () => {
  test('neither button can fire while a write is in flight', () => {
    mount(<OpsConfirmDialog {...BASE} tone="destructive" pending />);
    const buttons = [...document.body.querySelectorAll('button')];
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((b) => b.disabled)).toBe(true);
  });
});
