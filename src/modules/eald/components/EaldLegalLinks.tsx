'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { EALD_LEGAL_LINKS } from '@/modules/eald/constants/eald.constants';

interface EaldLegalLinksProps {
  readonly onNavigate?: () => void;
}

// The legal link group used inside the mobile navigation sheet (C-LEG-02).
// Extracted so EaldMobileNav stays inside the 120-line component cap.
function EaldLegalLinks({ onNavigate }: EaldLegalLinksProps) {
  const t = useTranslations();

  return (
    <nav
      aria-label={t('Navigation.legalNavLabel')}
      className="flex flex-col gap-1 border-t border-border p-4"
    >
      {EALD_LEGAL_LINKS.map(({ href, labelKey }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className="rounded-lg px-3 py-3 text-sm font-medium text-body hover:bg-muted"
        >
          {t(labelKey)}
        </Link>
      ))}
    </nav>
  );
}

export { EaldLegalLinks };
