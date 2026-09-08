import { getFormatter, getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Container, Logo } from '@/modules/design-system';
import { EALD_FOOTER_COLUMNS, PAGE_LAST_UPDATED } from '@/modules/eald/constants/eald.constants';
import { getPublicSettings } from '@/modules/settings';

async function EaldFooter() {
  // Root-scoped: the footer mixes Eald.* copy with the shared Navigation.*
  // legal labels, so the keys in EALD_FOOTER_COLUMNS are fully qualified.
  const t = await getTranslations();
  // The last-updated date is formatted per active locale by next-intl's
  // Intl-backed formatter — never toLocaleDateString with a pinned locale.
  const format = await getFormatter();
  // C-SET-01: the site name and tagline are ops-editable, so they come from the
  // settings row. The catalog value is the fallback for the tagline only —
  // site_name is required server-side and always present.
  const settings = await getPublicSettings();

  return (
    <footer className="bg-navy-900 text-slate-400">
      <Container className="max-w-eald py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo theme="white" alt={settings.site_name} />
            <p className="mt-4 max-w-xs text-sm">{settings.site_tagline ?? t('Eald.footer.tagline')}</p>
          </div>
          {EALD_FOOTER_COLUMNS.map((column) => (
            <nav key={column.titleKey} aria-label={t(column.titleKey)}>
              <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                {t(column.titleKey)}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    {link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="inline-block py-1.5 text-blue-200 transition-colors hover:text-white"
                      >
                        {t(link.labelKey)}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="inline-block py-1.5 text-blue-200 transition-colors hover:text-white"
                      >
                        {t(link.labelKey)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        {/* Acknowledgement of Country (Home v2:381) — above the bottom row,
            capped at reading width. */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="max-w-prose text-sm leading-relaxed">{t('Eald.footer.acknowledgement')}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 pb-6 text-sm">
          <p>{t('Eald.footer.copyright')}</p>
          <p>
            {t('Eald.footer.lastUpdated', {
              date: format.dateTime(PAGE_LAST_UPDATED, { dateStyle: 'long', timeZone: 'UTC' }),
            })}
          </p>
          <p className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1 ring-white/15">
            <span aria-hidden="true" className="size-2 rounded-full bg-teal-400" />
            {t('Eald.footer.status')}
          </p>
        </div>
      </Container>
    </footer>
  );
}

export { EaldFooter };
