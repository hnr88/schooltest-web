'use client';

import { useState } from 'react';

import { droppedByToggle, togglePick } from '@/modules/classes/lib/class-teacher-picker';

// The multi-pick state behind both teacher pickers. A class holds real teachers
// OR one invited teacher, so a toggle can untick other picks; `dropped` keeps
// what the last toggle took away so the picker can say so (BUG-005 a11y).
export function useTeacherPicks() {
  const [picks, setPicks] = useState<readonly string[]>([]);
  const [dropped, setDropped] = useState<readonly string[]>([]);

  function toggle(value: string, checked: boolean) {
    const next = togglePick(picks, value, checked);
    setDropped(droppedByToggle(picks, next, value));
    setPicks(next);
  }

  return { picks, dropped, toggle };
}
