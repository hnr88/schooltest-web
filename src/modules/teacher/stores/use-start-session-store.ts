'use client';

import { create } from 'zustand';

import type { StartSessionState } from '@/modules/teacher/types/start-session.types';

const NO_STUDENTS: readonly string[] = [];

// One Start-new-session modal serves every teacher screen (Classes header, Live
// sessions header, a class's Test day tab). Screens publish the request here;
// the modal mounts once and subscribes, so no screen carries the modal itself.
export const useStartSessionStore = create<StartSessionState>((set) => ({
  isOpen: false,
  classId: null,
  mode: null,
  studentIds: NO_STUDENTS,
  tab: null,
  editSittingId: null,
  openCount: 0,
  open: (options = {}) =>
    set((state) => ({
      isOpen: true,
      classId: options.classId ?? null,
      mode: options.editSittingId ? 'later' : (options.mode ?? null),
      studentIds: options.studentIds ?? NO_STUDENTS,
      tab: options.tab ?? null,
      editSittingId: options.editSittingId ?? null,
      openCount: state.openCount + 1,
    })),
  close: () => set({ isOpen: false }),
}));
