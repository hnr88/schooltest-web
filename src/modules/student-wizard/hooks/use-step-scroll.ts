'use client';

import { useEffect, useRef, type RefObject } from 'react';

// At 375 the card is taller than the viewport, so pressing Continue would otherwise
// leave the parent halfway down the NEXT step with the heading off-screen. Returns
// the screen to its own top whenever the step changes — never on mount, where the
// page is already there and scrolling would only hide the page title. Honours
// prefers-reduced-motion by jumping instead of gliding.
export function useStepScroll(target: RefObject<HTMLElement | null>, step: number) {
  const previous = useRef(step);

  useEffect(() => {
    if (previous.current === step) {
      return;
    }
    previous.current = step;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  }, [step, target]);
}
