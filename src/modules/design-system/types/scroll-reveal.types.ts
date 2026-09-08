import type { ReactNode } from 'react';

type ScrollRevealVariant = 'rise' | 'scale';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: ScrollRevealVariant;
}

export type { ScrollRevealProps, ScrollRevealVariant };
