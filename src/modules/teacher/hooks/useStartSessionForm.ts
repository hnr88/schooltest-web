'use client';

import { useState } from 'react';

import type {
  StartSessionFormActions,
  StartSessionFormState,
} from '@/modules/teacher/types/start-session-modal.types';

function toggled<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

/**
 * The modal's own UI state (`mWhen`, `mTab`, `mClass`, `mTest`, `mScope`,
 * `mMembers`, `mSettings`, `mDate/mStart/mEnd`, `mSecs`). The body is keyed by
 * the store's `openCount`, so `initial` seeds a fresh form on every open.
 */
export function useStartSessionForm(
  initial: StartSessionFormState,
): { form: StartSessionFormState } & StartSessionFormActions {
  const [form, setForm] = useState(initial);
  const patch = (next: Partial<StartSessionFormState>) => setForm((current) => ({ ...current, ...next }));

  return {
    form,
    setMode: (mode) => patch({ mode }),
    setTab: (tab) => patch({ tab }),
    // Picks belong to one class's roster; a new class starts with none.
    setClass: (classId) => patch({ classId, picked: [] }),
    setTest: (formId) => patch({ formId }),
    setScope: (scope) => patch({ scope }),
    setDate: (date) => patch({ date }),
    setOpens: (opens) => patch({ opens }),
    setCloses: (closes) => patch({ closes }),
    setTimeLimit: (timeLimit) =>
      setForm((current) => ({ ...current, settings: { ...current.settings, timeLimit } })),
    toggleSetting: (key) =>
      setForm((current) => ({ ...current, settings: { ...current.settings, [key]: !current.settings[key] } })),
    toggleStudent: (id) => setForm((current) => ({ ...current, picked: toggled(current.picked, id) })),
    toggleSection: (id) =>
      setForm((current) => ({ ...current, openSections: toggled(current.openSections, id) })),
  };
}
