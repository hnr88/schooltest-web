import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

import { NextIntlClientProvider } from 'next-intl';

import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';

// The capture half of tests/e2e/sa-05-confirm-toast-captures.spec.ts — proof
// tooling for school-admin/05, modelled on the 01-figure-kit harness.
//
// school-admin/05 ships the advisory and two-step variants BEFORE any surface
// consumes them (the bulk scopes that render "Nothing to <action>" are later
// waves; their U-24 seam comments name this task). The behavioural proof that
// the variant works is tests/unit/confirm-dialog-variants.test.tsx; this piece
// exists only so the PROOF screenshot can show the real component's advisory
// form in the app's real styling. It mounts the REAL OpsConfirmDialog — same
// import the portal uses — into a host element, client-side, exactly the way
// the unit test mounts it.
//
// No JSX: this file is bundled by a vite lib build without the app's plugins,
// so it is written in createElement form like 01-figure-kit-harness.piece.tsx.

import enMessages from '../../src/i18n/messages/en.json';

export function mountAdvisory(host: HTMLElement): void {
  const providerProps: Omit<Parameters<typeof NextIntlClientProvider>[0], 'children'> = {
    locale: 'en',
    messages: enMessages,
  };
  const root = createRoot(host);
  flushSync(() => {
    root.render(
      createElement(
        NextIntlClientProvider,
        providerProps as Parameters<typeof NextIntlClientProvider>[0],
        createElement(OpsConfirmDialog, {
          open: true,
          onOpenChange: () => undefined,
          title: 'Nothing to pause',
          description: 'Every selected class is already paused, so there is nothing to do.',
          confirmLabel: 'Close',
          cancelLabel: 'Close',
          variant: 'advisory',
          onConfirm: () => undefined,
        }),
      ),
    );
  });
}

// Self-mount: the capture spec loads this bundle AFTER a #host div exists in
// the page, so the dialog is on screen the moment the script finishes.
const host = document.getElementById('host');
if (host) mountAdvisory(host);
