'use client';

import { useTranslations } from 'next-intl';

import { Logo } from '@/modules/design-system';
import { Link } from '@/i18n/navigation';

// Detached-rail lockup (.qa/design/spec/01 §1.2, portal--detached-sidebar.html:3):
// `height:26px; width:auto; align-self:flex-start; margin:0 12px 36px`.
// The drawn lockup is ~81x26 — below the 44px pointer minimum in HEIGHT, and it is
// the one shell control with no hit-area idiom of its own. `relative` is what makes
// the ::after idiom work: the anchor was position:static, so the pseudo would have
// resolved against SidebarHeader and expanded nothing.
const LOGO_LINK_CLASSES =
  'relative mb-9 ml-3 self-start rounded-md transition-[opacity,transform] duration-200 ease-out after:absolute after:-inset-2.5 hover:-translate-y-px hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 group-data-[collapsible=icon]:mb-6 group-data-[collapsible=icon]:ml-0';

function SidebarLogoLink() {
  const t = useTranslations('Shell');

  return (
    <Link href="/dashboard" className={LOGO_LINK_CLASSES}>
      <Logo
        height={26}
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
