'use client';

import { useTranslations } from 'next-intl';

import { Logo } from '@/modules/design-system';
import { Link } from '@/i18n/navigation';
import {
  LOGO_LINK_CLASSES,
  TEACHER_LOGO_LINK_CLASSES,
} from '@/modules/shell/constants/shell-classes.constants';
import type { ShellSkin } from '@/modules/shell/types/shell.types';

// Detached-rail lockup (.qa/design/spec/01 §1.2, portal--detached-sidebar.html:3):
// `height:26px; width:auto; align-self:flex-start; margin:0 12px 36px`.
// The drawn lockup is ~81x26 — below the 44px pointer minimum in HEIGHT, and it is
// the one shell control with no hit-area idiom of its own. `relative` is what makes
// the ::after idiom work: the anchor was position:static, so the pseudo would have
// resolved against SidebarHeader and expanded nothing.
// Teacher Portal v2 (:26) draws the same asset at 40px with a 26px bottom margin.
function SidebarLogoLink({ skin = 'default' }: { skin?: ShellSkin }) {
  const t = useTranslations('Shell');
  const isTeacher = skin === 'teacher';

  return (
    <Link href="/dashboard" className={isTeacher ? TEACHER_LOGO_LINK_CLASSES : LOGO_LINK_CLASSES}>
      <Logo
        height={isTeacher ? 40 : 26}
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
