import { getTranslations } from 'next-intl/server';

import { Container, Logo } from '@/modules/design-system';
import { LocaleSwitcher } from '@/modules/i18n';
import { LinkedInIcon, XIcon, YouTubeIcon } from '@/modules/landing/components/SocialIcons';
import { FOOTER_COLUMNS, FOOTER_SOCIALS } from '@/modules/landing/constants/landing.constants';

const SOCIAL_ICONS = {
  x: XIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon,
} as const;

async function LandingFooter() {
  const t = await getTranslations('Home');

  return (
    <footer className="bg-navy-900 text-slate-400">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo theme="white" alt={t('footer.logoAlt')} />
            <p className="mt-4 max-w-xs text-sm">{t('footer.tagline')}</p>
            <div className="mt-6 flex gap-2.5">
              {FOOTER_SOCIALS.map((social) => {
                const Icon = SOCIAL_ICONS[social.key];
                return (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={t(social.labelKey)}
                    className="grid size-11 place-items-center rounded-lg bg-navy-800 text-slate-300 transition-colors hover:text-white"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.titleKey} aria-label={t(column.titleKey)}>
              <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                {t(column.titleKey)}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <a
                      href={link.href}
                      className="inline-block py-1.5 text-blue-200 transition-colors hover:text-white"
                    >
                      {t(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10">
          <LocaleSwitcher />
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm">
          <p>{t('footer.copyright')}</p>
          <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1 ring-white/15">
            <span aria-hidden="true" className="size-2 rounded-full bg-green-500" />
            {t('footer.status')}
          </p>
        </div>
      </Container>
    </footer>
  );
}

export { LandingFooter };
