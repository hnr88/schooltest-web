import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button, Container, Logo } from '@/modules/design-system';
import { MobileNav } from '@/modules/landing/components/MobileNav';
import { NAV_LINKS } from '@/modules/landing/constants/landing.constants';

async function LandingHeader() {
  const t = await getTranslations('Home');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/88 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-6 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        {t('skipToContent')}
      </a>
      <Container className="flex h-16 items-center gap-7">
        <Link href="/" className="shrink-0">
          <Logo alt={t('footer.logoAlt')} />
        </Link>
        <nav aria-label={t('nav.label')} className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ href, key }) => (
            <a
              key={key}
              href={href}
              className="rounded-lg px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(key)}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Button variant="ghost" render={<a href="#cta" />} className="h-11 px-4">
            {t('nav.signIn')}
          </Button>
          <Button render={<a href="#pricing" />} className="h-11 px-5">
            {t('nav.startFree')}
          </Button>
        </div>
        <MobileNav />
      </Container>
    </header>
  );
}

export { LandingHeader };
