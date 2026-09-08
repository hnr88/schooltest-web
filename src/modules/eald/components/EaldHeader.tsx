import { Shield } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button, Container, Logo } from '@/modules/design-system';
import { EALD_NAV_LINKS } from '@/modules/eald/constants/eald.constants';
import { PublicSiteBanner, getPublicSettings } from '@/modules/settings';
import type { EaldPage } from '@/modules/eald/types/eald.types';

import { EaldMobileNav } from './EaldMobileNav';
import { SiteSearchField } from './SiteSearchField';

import type { EaldHeaderProps } from '@/modules/eald/types/components.types';

async function EaldHeader({ activePage }: EaldHeaderProps) {
  const t = await getTranslations();
  // C-SET-01: the maintenance / announcement banner is part of the public
  // chrome, so it renders with the header on every public page rather than
  // being remembered per page.
  const settings = await getPublicSettings();

  return (
    <>
      {/* WCAG 2.4.1 bypass block. Task 14/15 acceptance found the skip link
          living on only one of the five pages — each page task looked correct
          in isolation; the shared chrome is the one place that cannot drift.
          First focusable element on every page that mounts the header. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-6 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        {t('Eald.nav.label')}
      </a>
      <div className="bg-navy-950">
        <Container className="flex max-w-eald flex-wrap items-center gap-x-6 gap-y-1 py-2">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-navy-muted">
            <Shield aria-hidden="true" className="size-3.5 shrink-0 text-teal-500" />
            {t('Eald.nav.utilityTagline')}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link
              href="/dashboard/search"
              className="py-1 text-xs font-medium text-navy-soft transition-colors duration-150 hover:text-white hover:underline"
            >
              {t('Eald.nav.schoolSearch')}
            </Link>
            <Link
              href="/#register"
              className="py-1 text-xs font-medium text-navy-soft transition-colors duration-150 hover:text-white hover:underline"
            >
              {t('Eald.nav.contact')}
            </Link>
            <Link
              href="/sign-in"
              className="py-1 text-xs font-medium text-navy-soft transition-colors duration-150 hover:text-white hover:underline"
            >
              {t('Eald.nav.signIn')}
            </Link>
          </div>
        </Container>
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-background/88 backdrop-blur">
        <Container className="flex max-w-eald flex-wrap items-center gap-x-8 gap-y-3 py-4">
          <Link href="/" className="flex shrink-0 items-center gap-4">
            <Logo alt={t('Eald.footer.logoAlt')} />
            <span aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />
            <span className="hidden max-w-56 text-body-sm font-medium leading-snug text-body xl:block">
              {t('Eald.nav.mastheadTagline')}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <SiteSearchField />
            <EaldMobileNav activePage={activePage} />
          </div>
        </Container>

        <nav aria-label={t('Eald.nav.label')} className="hidden border-t lg:block">
          <Container className="flex max-w-eald items-stretch">
            {EALD_NAV_LINKS.map(({ href, key, page }) => (
              <Link
                key={key}
                href={href}
                aria-current={activePage === page ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center border-b-3 px-4 py-3.5 text-body-md font-semibold transition-colors duration-150',
                  activePage === page
                    ? 'border-b-primary text-navy-900'
                    : 'border-b-transparent text-navy-800 hover:text-navy-900',
                )}
              >
                {t(`Eald.${key}`)}
              </Link>
            ))}
            <Button
              href="/#register"
              className="my-auto ml-auto h-11 shrink-0 rounded-lg px-5 shadow-primary-glow transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {t('Eald.nav.registerInterest')}
            </Button>
          </Container>
        </nav>
      </header>

      <PublicSiteBanner settings={settings} />
    </>
  );
}

export { EaldHeader };
