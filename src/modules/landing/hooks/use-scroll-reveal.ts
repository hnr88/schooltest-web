'use client';

import { useEffect, useRef, useState } from 'react';

function useScrollReveal() {
  const elementRef = useRef<HTMLDivElement>(null);
  const isPreparedRef = useRef(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const reveal = () => setIsRevealed(true);

  useEffect(() => {
    const element = elementRef.current;

    if (
      !element ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (isPreparedRef.current) reveal();
          else setIsRevealed(true);
          observer.disconnect();
          return;
        }

        isPreparedRef.current = true;
        setIsPrepared(true);
      },
      { threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { elementRef, isPrepared, isRevealed, reveal };
}

export { useScrollReveal };
