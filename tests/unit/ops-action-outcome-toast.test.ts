import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ExternalToast } from 'sonner';

const sonner = vi.hoisted(() => ({
  success: vi.fn<(message: string, options?: ExternalToast) => string>(() => 'ok-id'),
  warning: vi.fn<(message: string, options?: ExternalToast) => string>(() => 'warn-id'),
  error: vi.fn<(message: string, options?: ExternalToast) => string>(() => 'error-id'),
  dismiss: vi.fn<(id?: string | number) => void>(),
}));

vi.mock('sonner', () => ({ toast: sonner }));

import { outcomeToast } from '@/modules/ops/actions/lib/ops-toast';
import type { OpsActionSummary } from '@/modules/ops/actions/types/ops-action.types';

beforeEach(() => vi.clearAllMocks());

function summary(overrides: Partial<OpsActionSummary> = {}): OpsActionSummary {
  return {
    succeeded: 0,
    failed: 0,
    notStarted: 0,
    uncertain: 0,
    allSucceeded: false,
    hasUnresolved: false,
    ...overrides,
  };
}

describe('outcomeToast', () => {
  test('all succeeded: success tone, counts from the run, undo action attached', () => {
    const undo = { label: 'Undo', run: vi.fn() };
    outcomeToast(
      summary({ succeeded: 2, allSucceeded: true }),
      'school',
      undo,
    );

    expect(sonner.success).toHaveBeenCalledTimes(1);
    const [message, options] = sonner.success.mock.calls[0] as [string, ExternalToast];
    expect(message).toBe('2 schools updated.');
    expect(options).toMatchObject({
      duration: 6_000,
      action: { label: 'Undo' },
    });
  });

  test('unresolved items: warning tone, reconciliation message, Refresh offered instead of a verdict', () => {
    const undo = { label: 'Undo', run: vi.fn() };
    outcomeToast(
      summary({ succeeded: 1, uncertain: 2, hasUnresolved: true }),
      'school',
      undo,
    );

    expect(sonner.warning).toHaveBeenCalledTimes(1);
    const [message, options] = sonner.warning.mock.calls[0] as [string, ExternalToast];
    expect(message).toContain('1 school confirmed.');
    expect(message).toContain('could not be confirmed');
    const action = (options as { action?: { label: string; onClick: () => void } }).action;
    expect(action?.label).toBe('Refresh');
    expect(typeof action?.onClick).toBe('function');
  });

  test('nothing succeeded and nothing unresolved: error tone, no action', () => {
    outcomeToast(summary({ failed: 3 }), 'school');

    expect(sonner.error).toHaveBeenCalledTimes(1);
    const [message, options] = sonner.error.mock.calls[0] as [string, ExternalToast];
    expect(message).toBe('Nothing was changed. 3 schools were refused.');
    expect((options as { action?: unknown }).action).toBeUndefined();
  });

  test('partial run: warning tone carrying refused and not-started counts from the results', () => {
    outcomeToast(
      summary({ succeeded: 2, failed: 1, notStarted: 1 }),
      'school',
    );

    expect(sonner.warning).toHaveBeenCalledTimes(1);
    const [message] = sonner.warning.mock.calls[0] as [string, ExternalToast];
    expect(message).toBe('2 schools updated, 1 refused, 1 school not started.');
  });
});
