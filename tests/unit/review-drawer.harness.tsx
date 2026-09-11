import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import enMessages from '@/i18n/messages/en.json';

// Shared mount helpers for the review drawer's unit tests. The drawer portals
// into document.body, so every helper reads and drives the body.

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | null = null;
let root: Root | null = null;

export function renderDrawer(element: ReactElement): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="Australia/Sydney">
        <QueryClientProvider client={client}>{element}</QueryClientProvider>
      </NextIntlClientProvider>,
    );
  });
  return document.body;
}

export function unmountDrawer(): void {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
}

/** Lets the query and mutation promises settle and React commit. */
export async function settle(): Promise<void> {
  for (let tick = 0; tick < 4; tick += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

/** Types into a controlled textarea the way a keyboard does: value, then input. */
export function typeInto(field: HTMLTextAreaElement | null, value: string): void {
  if (field === null) throw new Error('no field to type into');
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

export function press(element: Element | null): void {
  if (!(element instanceof HTMLElement)) throw new Error('nothing to press');
  act(() => element.click());
}

/** Fills a catalog template's {placeholders} for plain (non-plural) keys. */
export const fill = (template: string, values: Record<string, string | number>): string =>
  Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, String(value)), template);
