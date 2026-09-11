import { afterEach, describe, expect, test } from 'vitest';

import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';

afterEach(() => {
  useStartSessionStore.getState().close();
});

describe('useStartSessionStore', () => {
  test('open() with no options opens the modal unscoped', () => {
    useStartSessionStore.getState().open();
    expect(useStartSessionStore.getState()).toMatchObject({
      isOpen: true,
      classId: null,
      mode: null,
      studentIds: [],
    });
  });

  test('open() carries the class, mode and students; close() hides it', () => {
    useStartSessionStore.getState().open({ classId: 'class-id', mode: 'later', studentIds: ['a', 'b'] });
    expect(useStartSessionStore.getState()).toMatchObject({
      isOpen: true,
      classId: 'class-id',
      mode: 'later',
      studentIds: ['a', 'b'],
    });
    useStartSessionStore.getState().close();
    expect(useStartSessionStore.getState().isOpen).toBe(false);
  });
});
