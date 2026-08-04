'use client';

import { create } from 'zustand';

import type { RecordCrumbState } from '@/modules/shell/types/shell.types';

// The topbar renders ABOVE {children} in the dashboard layout, so a record page
// cannot hand its crumb up through React context without a provider wrapping both.
// A module-level store is the seam: the page publishes, the topbar subscribes.
// The pathname is stored WITH the label so a stale crumb can never survive a route
// change — the topbar only reads a label that was published for the route it is
// currently rendering.
export const useRecordCrumbStore = create<RecordCrumbState>((set) => ({
  label: null,
  pathname: null,
  setRecordCrumb: (pathname, label) => set({ pathname, label }),
  clearRecordCrumb: (pathname) =>
    set((state) => (state.pathname === pathname ? { pathname: null, label: null } : state)),
}));
