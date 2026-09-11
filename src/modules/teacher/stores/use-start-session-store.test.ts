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
      tab: null,
      editSittingId: null,
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

  test('a catch-up opens on the Students tab; an edit is always a scheduled window', () => {
    useStartSessionStore.getState().open({ classId: 'c', studentIds: ['a'], tab: 'students' });
    expect(useStartSessionStore.getState().tab).toBe('students');
    useStartSessionStore.getState().open({ editSittingId: 'booking-id', mode: 'now' });
    expect(useStartSessionStore.getState()).toMatchObject({ editSittingId: 'booking-id', mode: 'later' });
  });

  test('every open() bumps openCount so the modal re-seeds its form', () => {
    const before = useStartSessionStore.getState().openCount;
    useStartSessionStore.getState().open();
    useStartSessionStore.getState().open({ classId: 'c' });
    expect(useStartSessionStore.getState().openCount).toBe(before + 2);
  });
});
