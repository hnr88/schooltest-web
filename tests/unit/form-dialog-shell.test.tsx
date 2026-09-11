import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { DialogContent, DialogTitle } from '@/modules/design-system';
import { FormDialogShell } from '@/modules/forms';

// school-admin/04 — U-20, the dirty-close guard. A clean close goes straight
// through; a dirty close raises the portal's ONE confirm (U-24) as a sibling
// overlay; a discarded close fires onOpenChange(false) exactly once. The dialog
// and the confirm render through portals, so queries run against document.body.

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const DISCARD = {
  title: 'Discard your changes?',
  description: 'The edits on this form will be lost.',
  confirmLabel: 'Discard',
  cancelLabel: 'Keep editing',
};

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(isDirty: boolean, onOpenChange: (next: boolean) => void) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <FormDialogShell open onOpenChange={onOpenChange} isDirty={isDirty} discard={DISCARD}>
          <DialogContent>
            <DialogTitle>Edit school</DialogTitle>
          </DialogContent>
        </FormDialogShell>
      </NextIntlClientProvider>,
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

function clickDialogClose() {
  const close = document.body.querySelector<HTMLElement>(
    '[data-slot="dialog-content"] [data-slot="dialog-close"]',
  );
  expect(close).not.toBeNull();
  act(() => close!.click());
}

function buttonNamed(label: string): HTMLButtonElement | undefined {
  return [...document.body.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === label,
  );
}

describe('FormDialogShell', () => {
  test('a clean close goes straight through and never raises the discard confirm', () => {
    const onOpenChange = vi.fn();
    mount(false, onOpenChange);
    clickDialogClose();
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.body.textContent).not.toContain(DISCARD.title);
  });

  test('a dirty close opens the discard confirm and leaves the dialog open', () => {
    const onOpenChange = vi.fn();
    mount(true, onOpenChange);
    clickDialogClose();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain(DISCARD.title);
  });

  test('confirming the discard fires onOpenChange(false) exactly once', () => {
    const onOpenChange = vi.fn();
    mount(true, onOpenChange);
    clickDialogClose();
    const discard = buttonNamed(DISCARD.confirmLabel);
    expect(discard).toBeDefined();
    act(() => discard!.click());
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('keeping the edits dismisses only the confirm — nothing closes', () => {
    const onOpenChange = vi.fn();
    mount(true, onOpenChange);
    clickDialogClose();
    const keep = buttonNamed(DISCARD.cancelLabel);
    expect(keep).toBeDefined();
    act(() => keep!.click());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
  });
});
