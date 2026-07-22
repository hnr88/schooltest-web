'use client';

import { useTranslations } from 'next-intl';

import { Logo } from '@/modules/design-system';
import { Link } from '@/i18n/navigation';

// Canonical rail lockup: the FULL-COLOUR logo at 30px, flush-left on the header's
// 24px top padding, collapsing to the 24px mark on the icon rail.
// The drawn lockup is 94x30 — below the 44px pointer minimum in HEIGHT, and it is
// the one shell control with no hit-area idiom at all. `relative` is what makes the
// idiom work here: the anchor was position:static, so an ::after would have resolved
// against the SidebarHeader instead of the link and expanded nothing.
const LOGO_LINK_CLASSES =
  'relative mb-5.5 ml-2 self-start rounded-md transition-opacity duration-200 ease-out after:absolute after:-inset-2.5 group-data-[collapsible=icon]:mb-4 group-data-[collapsible=icon]:ml-0 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none motion-reduce:transition-none';

function SidebarLogoLink() {
  const t = useTranslations('Shell');

  return (
    <Link href="/dashboard" className={LOGO_LINK_CLASSES}>
      <Logo
        height={30}
        alt={t('sidebar.logoAlt')}
        className="group-data-[collapsible=icon]:hidden"
      />
      <Logo
        variant="mark"
        height={24}
        alt={t('sidebar.logoAlt')}
        className="hidden group-data-[collapsible=icon]:block"
      />
    </Link>
  );
}

export { SidebarLogoLink };
