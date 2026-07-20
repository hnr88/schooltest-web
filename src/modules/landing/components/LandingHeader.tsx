import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Button, Container, Logo } from '@/modules/design-system';
import { MobileNav } from '@/modules/landing/components/MobileNav';
import { NAV_LINKS } from '@/modules/landing/constants/landing.constants';

async function LandingHeader() {
  const t = await getTranslations('Home');

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/88 backdrop-blur">
      <Container className="flex h-16 items-center gap-7">
        <Link href="/" className="shrink-0 py-2">
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
          <Button variant="ghost" href="/sign-in" className="h-11 px-4">
            {t('nav.signIn')}
          </Button>
          <Button href="/sign-up" className="h-11 px-5">
            {t('nav.startFree')}
          </Button>
        </div>
        <MobileNav />
      </Container>
    </header>
  );
}

export { LandingHeader };
