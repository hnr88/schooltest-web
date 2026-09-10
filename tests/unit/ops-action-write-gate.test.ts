import { describe, expect, test } from 'vitest';

import { opsWriteBlockedReason } from '@/modules/ops/actions/hooks/use-ops-write-gate';

const COPY = { readOnly: 'READ_ONLY', offline: 'OFFLINE' };

describe('ops action write gate', () => {
  test.each([
    { readOnly: false, online: true, expected: null },
    { readOnly: false, online: false, expected: 'OFFLINE' },
    { readOnly: true, online: true, expected: 'READ_ONLY' },
    { readOnly: true, online: false, expected: 'READ_ONLY' },
  ])(
    'readOnly=$readOnly online=$online returns $expected',
    ({ readOnly, online, expected }) => {
      expect(opsWriteBlockedReason(readOnly, online, COPY)).toBe(expected);
    },
  );
});
