import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/modules/design-system';

import { SPLIT_STATS } from '@/modules/auth/constants/components.constants';
import type { AuthSplitLayoutProps } from '@/modules/auth/types/components.types';

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const t = useTranslations('Auth');
  const tShell = useTranslations('Shell.sidebar');

  return (
    <main className="flex flex-1 bg-background">
      <aside className="relative hidden w-auth-wide shrink-0 flex-col justify-between overflow-hidden bg-[#0A1A3C] lg:flex">
        <Image
          src="/images/auth-portal.webp"
          alt=""
          fill
          priority
          sizes="560px"
          className="object-cover opacity-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg,rgba(10,26,60,.88) 0%,rgba(10,26,60,.72) 40%,rgba(10,26,60,.94) 100%)',
          }}
        />
        <div className="relative px-12 pt-10">
          <Link
            href="/"
            className="inline-flex items-center rounded-sm no-underline transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-on-dark motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <Logo theme="white" alt={tShell('logoAlt')} height={32} />
          </Link>
        </div>
        <div className="relative max-w-[560px] animate-in px-12 pb-12 duration-700 ease-out-expo fill-mode-both fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
          <span className="inline-block text-[11.5px] font-bold tracking-[0.14em] text-[#5EEAD4] uppercase">
            {t('split.eyebrow')}
          </span>
          <p className="mt-4 text-[30px] leading-[1.22] font-bold tracking-[-0.022em] text-balance text-white">
            {t('split.title')}
          </p>
          <dl className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-px overflow-hidden rounded-2xl border border-white/16 bg-white/16">
            {SPLIT_STATS.map((stat) => (
              <div key={stat.labelKey} className="bg-[rgba(10,26,60,.75)] px-5 py-[18px]">
                <dt className="text-[11px] font-bold tracking-[0.09em] text-[#8FA3C7] uppercase">
                  {t(stat.labelKey)}
                </dt>
                <dd className="mt-[6px] text-[20px] font-bold text-white">{t(stat.valueKey)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-7 max-w-[52ch] text-[12.5px] leading-relaxed text-[#8FA3C7]">
            {t('split.acknowledgement')}
          </p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-12 lg:py-14">
        <div className="mx-auto w-full max-w-auth">
          <nav aria-label={t('chrome.breadcrumbLabel')} className="text-[12.5px] text-[#64748B]">
            <Link
              href="/"
              className="font-semibold text-[#475569] no-underline hover:text-[#0E2350] hover:underline"
            >
              {t('chrome.breadcrumbHome')}
            </Link>
            <span className="px-2">/</span>
            {t('chrome.breadcrumbCurrent')}
          </nav>
          {children}
          <footer className="mt-9 flex flex-wrap gap-5 border-t border-[#EEF2F7] pt-5">
            <Link
              href="/privacy-policy"
              className="text-[12.5px] text-[#64748B] no-underline hover:text-[#0E2350] hover:underline"
            >
              {t('chrome.footerPrivacy')}
            </Link>
            <Link
              href="/"
              className="text-[12.5px] text-[#64748B] no-underline hover:text-[#0E2350] hover:underline"
            >
              {t('chrome.footerAccessibility')}
            </Link>
            <span className="ms-auto text-[12.5px] text-[#64748B]">{t('chrome.copyright')}</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
