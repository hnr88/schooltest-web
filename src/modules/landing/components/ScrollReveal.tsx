'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import styles from './ScrollReveal.module.css';

type ScrollRevealVariant = 'rise' | 'scale';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: ScrollRevealVariant;
}

type RevealStyle = CSSProperties & {
  '--scroll-reveal-delay': string;
};

/**
 * A progressive-enhancement reveal: content stays visible until the browser has
 * JavaScript, then uses IntersectionObserver to animate each major page block
 * once as it enters view. Reduced-motion users and unsupported browsers keep
 * the static, fully visible layout.
 */
function ScrollReveal({ children, className, delay = 0, variant = 'rise' }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isPrepared, setIsPrepared] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!element || prefersReducedMotion || !('IntersectionObserver' in window)) {
      return;
    }

    let frame: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        observer.disconnect();
        frame = window.requestAnimationFrame(() => setIsRevealed(true));
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    setIsPrepared(true);
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      ref={elementRef}
      data-slot="scroll-reveal"
      className={cn(
        styles.root,
        styles[variant],
        isPrepared && styles.prepared,
        isRevealed && styles.revealed,
        className,
      )}
      style={{ '--scroll-reveal-delay': `${delay}ms` } as RevealStyle}
      onFocusCapture={() => setIsRevealed(true)}
    >
      {children}
    </div>
  );
}

export { ScrollReveal };
