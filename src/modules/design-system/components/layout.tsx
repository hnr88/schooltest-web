import { cn } from '@/lib/utils';

import type {
  ContainerProps,
  SectionProps,
} from '@/modules/design-system/types/design-system.types';

function Container({ children, className }: ContainerProps) {
  return (
    <div data-slot="container" className={cn('mx-auto w-full max-w-landing px-6', className)}>
      {children}
    </div>
  );
}

function Section({ id, children, className }: SectionProps) {
  return (
    <section data-slot="section" id={id} className={cn('py-16 sm:py-20', className)}>
      {children}
    </section>
  );
}

export { Container, Section };
