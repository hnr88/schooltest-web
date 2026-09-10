import { describe, expect, test, vi } from 'vitest';

import { describeRunOutcome } from '@/modules/ops/actions/lib/ops-action-feedback';

describe('ops action feedback', () => {
  test('a fully proven success carries the caller-supplied Undo action', () => {
    const action = { label: 'Undo', run: vi.fn() };
    expect(
      describeRunOutcome(
        {
          succeeded: 1,
          failed: 0,
          notStarted: 0,
          uncertain: 0,
          allSucceeded: true,
          hasUnresolved: false,
        },
        'school',
        action,
      ),
    ).toEqual({
      tone: 'success',
      message: '1 school updated.',
      needsReconciliation: false,
      action,
    });
  });

  test('the unresolved wording remains byte-identical and never receives Undo', () => {
    expect(
      describeRunOutcome(
        {
          succeeded: 2,
          failed: 0,
          notStarted: 0,
          uncertain: 1,
          allSucceeded: false,
          hasUnresolved: true,
        },
        'school',
        { label: 'Undo', run: vi.fn() },
      ),
    ).toEqual({
      tone: 'warning',
      message:
        '2 schools confirmed. 1 school could not be confirmed. Refresh to see the current state before retrying.',
      needsReconciliation: true,
    });
  });

  test('the partial wording remains byte-identical and never receives Undo', () => {
    expect(
      describeRunOutcome(
        {
          succeeded: 2,
          failed: 1,
          notStarted: 1,
          uncertain: 0,
          allSucceeded: false,
          hasUnresolved: false,
        },
        'school',
        { label: 'Undo', run: vi.fn() },
      ),
    ).toEqual({
      tone: 'warning',
      message: '2 schools updated, 1 refused, 1 school not started.',
      needsReconciliation: false,
    });
  });
});
