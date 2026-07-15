import { ArrowUpRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function LandingHeader() {
  const t = await getTranslations('Home');

  return (
    <header className="border-b border-divider bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-6 focus:z-50 focus:rounded-full focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink focus:outline-2 focus:outline-offset-4 focus:outline-rausch-500"
      >
        {t('skipToContent')}
      </a>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rausch-500"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-rausch-500 text-on-rausch">
            <GraduationCap aria-hidden className="size-5" strokeWidth={2.25} />
          </span>
          <span>
            {t('brandPrefix')}
            <span className="text-rausch-600">{t('brandAccent')}</span>
          </span>
        </Link>

        <nav
          aria-label={t('navigationLabel')}
          className="hidden items-center gap-8 text-sm font-medium text-ink-muted lg:flex"
        >
          <a
            href="#why-schooltest"
            className="hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rausch-500"
          >
            {t('nav.why')}
          </a>
          <a
            href="#assessment-preview"
            className="hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rausch-500"
          >
            {t('nav.plan')}
          </a>
          <a
            href="#what-to-expect"
            className="hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rausch-500"
          >
            {t('nav.expect')}
          </a>
        </nav>

        <a
          href="#assessment-preview"
          aria-label={t('headerCta')}
          className="inline-flex items-center gap-2 rounded-full bg-rausch-500 px-4 py-3 text-xs font-semibold text-on-rausch hover:bg-rausch-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rausch-500 sm:px-5 sm:text-sm"
        >
          <span className="sm:hidden">{t('headerCtaShort')}</span>
          <span className="hidden sm:inline">{t('headerCta')}</span>
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      </div>
    </header>
  );
}
