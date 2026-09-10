import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ExternalToast } from 'sonner';

const sonner = vi.hoisted(() => ({
  success: vi.fn<(message: string, options?: ExternalToast) => string>(() => 'ok-id'),
  warning: vi.fn<(message: string, options?: ExternalToast) => string>(() => 'warn-id'),
  error: vi.fn<(message: string, options?: ExternalToast) => string>(() => 'error-id'),
  dismiss: vi.fn<(id?: string | number) => void>(),
}));

vi.mock('sonner', () => ({ toast: sonner }));

import { showOpsToast } from '@/modules/ops/actions/lib/ops-toast';

beforeEach(() => vi.clearAllMocks());

describe('ops toast', () => {
  test('maps all three tones and keeps a plain toast for 2.8 seconds', () => {
    showOpsToast({ tone: 'ok', message: 'Saved' });
    showOpsToast({ tone: 'warn', message: 'Check it' });
    showOpsToast({ tone: 'error', message: 'Refused' });

    expect(sonner.success).toHaveBeenCalledWith(
      'Saved',
      expect.objectContaining({ duration: 2_800, className: expect.stringContaining('navy-900') }),
    );
    expect(sonner.warning).toHaveBeenCalledWith(
      'Check it',
      expect.objectContaining({ className: expect.stringContaining('warning-ink') }),
    );
    expect(sonner.error).toHaveBeenCalledWith(
      'Refused',
      expect.objectContaining({ className: expect.stringContaining('destructive') }),
    );
  });

  test('keeps an action toast for 6 seconds, dismisses it and runs the thunk exactly once', () => {
    const run = vi.fn();
    showOpsToast({ tone: 'ok', message: 'School archived', action: { label: 'Undo', run } });

    const options = sonner.success.mock.calls[0]?.[1];
    expect(options).toEqual(
      expect.objectContaining({
        duration: 6_000,
        action: expect.objectContaining({ label: 'Undo' }),
      }),
    );
    const action = options?.action as { onClick: (event: never) => void } | undefined;
    action?.onClick({} as never);
    action?.onClick({} as never);
    expect(sonner.dismiss).toHaveBeenCalledOnce();
    expect(sonner.dismiss).toHaveBeenCalledWith('ok-id');
    expect(run).toHaveBeenCalledOnce();
  });
});
