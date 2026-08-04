import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button, Container, Logo } from '@/modules/design-system';
import { EALD_NAV_LINKS } from '@/modules/eald/constants/eald.constants';
import { PublicSiteBanner, getPublicSettings } from '@/modules/settings';
import type { EaldPage } from '@/modules/eald/types/eald.types';

import { EaldMobileNav } from './EaldMobileNav';

import type { EaldHeaderProps } from '@/modules/eald/types/components.types';

async function EaldHeader({ activePage }: EaldHeaderProps) {
  const t = await getTranslations();
  // C-SET-01: the maintenance / announcement banner is part of the public
  // chrome, so it renders with the header on every public page rather than
  // being remembered per page.
  const settings = await getPublicSettings();

  return (
    <>
      <PublicSiteBanner settings={settings} />
      <header className="sticky top-0 z-50 border-b border-border bg-background/88 backdrop-blur">
      <Container className="flex h-16 max-w-eald items-center gap-5">
        <Link href="/" className="shrink-0 py-2">
          <Logo alt={t('Eald.footer.logoAlt')} />
        </Link>

        <nav aria-label={t('Eald.nav.label')} className="hidden items-center gap-0.5 lg:flex">
          {EALD_NAV_LINKS.map(({ href, key, page }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                'inline-flex min-h-11 items-center rounded-lg px-3 text-body-md font-medium text-body transition-colors duration-150 hover:bg-surface-inset hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                activePage === page && 'bg-blue-50 font-semibold text-foreground',
              )}
            >
              {t(`Eald.${key}`)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-1.5 lg:flex">
          <Button
            variant="ghost"
            href="/dashboard/search"
            className="h-9 rounded-lg px-3 text-body-sm font-medium text-body transition-colors duration-150 hover:bg-surface-inset hover:text-foreground"
          >
            {t('Eald.nav.schoolSearch')}
          </Button>
          <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border" />
          <Button
            variant="ghost"
            href="/sign-in"
            className="h-11 rounded-lg px-4 font-semibold text-navy-800 transition-colors duration-150 hover:bg-surface-inset"
          >
            {t('Eald.nav.signIn')}
          </Button>
          <Button
            href="/#register"
            className="h-11 rounded-lg px-5 shadow-primary-glow transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {t('Eald.nav.registerInterest')}
          </Button>
        </div>

        <EaldMobileNav activePage={activePage} />
      </Container>
      </header>
    </>
  );
}

export { EaldHeader };
