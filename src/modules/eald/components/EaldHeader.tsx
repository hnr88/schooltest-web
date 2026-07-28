import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button, Container, Logo } from '@/modules/design-system';
import { EALD_NAV_LINKS } from '@/modules/eald/constants/eald.constants';
import type { EaldPage } from '@/modules/eald/types/eald.types';

import { EaldMobileNav } from './EaldMobileNav';

interface EaldHeaderProps {
  readonly activePage?: EaldPage;
}

async function EaldHeader({ activePage }: EaldHeaderProps) {
  const t = await getTranslations('Eald');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/88 backdrop-blur">
      <Container className="flex h-16 max-w-eald items-center gap-7">
        <Link href="/" className="shrink-0 py-2">
          <Logo alt={t('footer.logoAlt')} />
        </Link>

        <nav aria-label={t('nav.label')} className="hidden items-center gap-1 lg:flex">
          {EALD_NAV_LINKS.map(({ href, key, page }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                'inline-flex min-h-11 items-center rounded-lg px-3.5 text-body-md font-medium text-body transition-colors duration-150 hover:bg-surface-inset hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                activePage === page && 'bg-blue-50 font-semibold text-foreground',
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            href="/dashboard/search"
            className="h-11 rounded-lg px-4 font-semibold text-navy-800 transition-colors duration-150 hover:bg-surface-inset"
          >
            {t('nav.schoolSearch')}
          </Button>
          <Button
            href="/#register"
            className="h-11 rounded-lg px-5 shadow-primary-glow transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {t('nav.registerInterest')}
          </Button>
        </div>

        <EaldMobileNav activePage={activePage} />
      </Container>
    </header>
  );
}

export { EaldHeader };
