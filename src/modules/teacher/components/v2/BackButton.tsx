'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  BACK_BUTTON_CLASS,
  KIT_FOCUS_RING,
} from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { BackButtonProps } from '@/modules/teacher/types/teacher-kit-controls.types';

/**
 * Teacher Portal v2 — the grey "Back" button that opens every breadcrumb
 * (`Teacher Portal v2.dc.html:303–312`, `:521–528`): 30px r8, #F3F5F9 with a
 * #E5E7EB hairline, 12.5px/600 navy, chevron-left. A Link when given `href`,
 * else a button.
 */
function BackButton({ href, onClick, label, title, className }: BackButtonProps) {
  const t = useTranslations('TeacherPortal.kit');
  const classes = cn(BACK_BUTTON_CLASS, KIT_FOCUS_RING, className);
  const content = (
    <>
      <ChevronLeft aria-hidden="true" className="size-[15px]" strokeWidth={2.2} />
      {label ?? t('back')}
    </>
  );

  if (href !== undefined) {
    return (
      <Link href={href} title={title} onClick={onClick} data-slot="back-button" className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" title={title} onClick={onClick} data-slot="back-button" className={classes}>
      {content}
    </button>
  );
}

export { BackButton };
