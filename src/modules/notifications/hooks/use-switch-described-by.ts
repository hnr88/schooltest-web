'use client';

import { useEffect, useRef } from 'react';

// `aria-describedby` takes a LIST of ids, but the design-system ToggleRow (read-only
// from this module) renders the switch itself and declares only the id of the
// description it also renders. A row that adds a caveat — "SMS delivery is
// unavailable" — must still have that caveat announced with the switch, otherwise a
// screen-reader user can turn on a channel that cannot deliver with no warning.
// This appends the caveat id to whatever the row already declared; it never
// replaces it, and it re-asserts after every render so a re-render of the row can
// never drop the link.
function useSwitchDescribedBy<T extends HTMLElement>(describedById: string | null) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const control = ref.current?.querySelector('[role="switch"]');
    if (!control) return;
    const current = control.getAttribute('aria-describedby') ?? '';
    const ids = current.split(' ').filter((id) => id.length > 0 && id !== describedById);
    if (describedById !== null) ids.push(describedById);
    const next = ids.join(' ');
    if (next.length > 0 && next !== current) control.setAttribute('aria-describedby', next);
  });

  return ref;
}

export { useSwitchDescribedBy };
