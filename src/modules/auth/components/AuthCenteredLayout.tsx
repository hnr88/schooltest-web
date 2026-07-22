import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/modules/design-system';

interface AuthCenteredLayoutProps {
  children: ReactNode;
  /** `wide` is the 560px register column; `narrow` the 420px card screens. */
  width?: 'narrow' | 'wide';
}

// Centred auth frame (design spec 06 §1.2 register / §1.3 forgot-password): the
// full-colour logo lockup sits alone at the top of the padded frame with the
// content column centred below it. Server component — layout chrome only.
export function AuthCenteredLayout({ children, width = 'narrow' }: AuthCenteredLayoutProps) {
  const tHome = useTranslations('Home');

  return (
    <main className="flex flex-1 flex-col items-center bg-background px-6 py-12 sm:py-14">
      <Link
        href="/"
        className="rounded-sm transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <Logo alt={tHome('footer.logoAlt')} height={34} />
      </Link>
      <div
        className={cn(
          'mt-9 flex w-full flex-1 flex-col justify-center',
          width === 'wide' ? 'max-w-auth-wide' : 'max-w-auth',
        )}
      >
        {children}
      </div>
    </main>
  );
}
