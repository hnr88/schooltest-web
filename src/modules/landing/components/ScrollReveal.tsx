'use client';

import { cn } from '@/lib/utils';
import { useScrollReveal } from '@/modules/landing/hooks/use-scroll-reveal';
import type { ScrollRevealProps } from '@/modules/landing/types/scroll-reveal.types';

function ScrollReveal({ children, className, delay = 0, variant = 'rise' }: ScrollRevealProps) {
  const { elementRef, isPrepared, isRevealed, reveal } = useScrollReveal();

  return (
    <div
      ref={elementRef}
      data-slot="scroll-reveal"
      className={cn(
        'motion-safe:duration-500 motion-safe:ease-out-expo motion-safe:fill-mode-both motion-reduce:animate-none',
        isPrepared && !isRevealed && 'motion-safe:translate-y-4 motion-safe:opacity-0',
        isPrepared &&
          isRevealed &&
          'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4',
        isPrepared && isRevealed && variant === 'scale' && 'motion-safe:zoom-in-95',
        className,
      )}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
      onFocusCapture={reveal}
    >
      {children}
    </div>
  );
}

export { ScrollReveal };
