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
  open: (options = {}) =>
    set({
      isOpen: true,
      classId: options.classId ?? null,
      mode: options.mode ?? null,
      studentIds: options.studentIds ?? NO_STUDENTS,
    }),
  close: () => set({ isOpen: false }),
}));
