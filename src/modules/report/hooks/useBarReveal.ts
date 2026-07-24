'use client';

import { useEffect, useState } from 'react';

// The bars mount only after the C-4 read resolves, so their final width is
// already correct on first paint and a CSS transition would have nothing to
// animate from. One frame of `false` gives the transition its start state.
export function useBarReveal(): boolean {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return revealed;
}
