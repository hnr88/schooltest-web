import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Toaster } from 'sonner';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { showOpsToast } from '@/modules/ops/actions/lib/ops-toast';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<Toaster />));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('rendered ops success action', () => {
  test('renders Undo and one click runs the supplied thunk exactly once', async () => {
    const undo = vi.fn();
    await act(async () => {
      showOpsToast({
        tone: 'ok',
        message: '1 school updated.',
        action: { label: 'Undo', run: undo },
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    const toast = document.querySelector('[data-sonner-toast]');
    expect(toast?.textContent).toContain('1 school updated.');
    const button = Array.from(toast?.querySelectorAll('button') ?? []).find(
      (candidate) => candidate.textContent === 'Undo',
    );
    expect(button).toBeDefined();
    await act(async () => button?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(undo).toHaveBeenCalledOnce();
  });
});
