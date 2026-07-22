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
              className="inline-flex min-h-11 items-center rounded-lg px-3.5 text-body-md font-medium text-body transition-colors duration-150 hover:bg-surface-inset hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {t(key)}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            href="/sign-in"
            className="h-11 rounded-lg px-4 font-semibold text-navy-800 transition-colors duration-150 hover:bg-surface-inset"
          >
            {t('nav.signIn')}
          </Button>
          <Button
            href="/sign-up"
            className="h-11 rounded-lg px-5 shadow-primary-glow transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {t('nav.startFree')}
          </Button>
        </div>
        <MobileNav />
      </Container>
    </header>
  );
}

export { LandingHeader };
