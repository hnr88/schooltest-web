'use client';

import { create } from 'zustand';

import { askAiTargetOf } from '@/modules/teacher/lib/teacher-overlays';
import type { ClassOverlaysStoreState } from '@/modules/teacher/types/class-overlays.types';

// The class-detail header's "Reports and data" and "Ask AI" buttons publish the
// request here; each overlay mounts once and subscribes, so the header never
// carries an overlay itself. Opening one closes the other. The student page opens
// Ask AI with its student as the target; the header's bare call is the class.
export const useClassOverlaysStore = create<ClassOverlaysStoreState>((set) => ({
  reportsOpen: false,
  askAiOpen: false,
  askAiTarget: { scope: 'class' },
  openReports: () => set({ reportsOpen: true, askAiOpen: false }),
  openAskAi: (target) => set({ reportsOpen: false, askAiOpen: true, askAiTarget: askAiTargetOf(target) }),
  close: () => set({ reportsOpen: false, askAiOpen: false }),
}));
