'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useStudentsQuery } from '@/modules/dashboard';

// Canonical parent-rail footer (Parent overview aside): the ONE navy surface in
// an otherwise white rail — mt-auto, radius 14, 18px padding, uppercase overline
// in navy-muted, a 30px numeral, and a teal CTA. The numeral is real data (the
// parent's linked children), never a placeholder; it shimmers while the shared
// ['dashboard','students'] query resolves.
function SidebarPromoPanel() {
  const t = useTranslations('Shell');
  const studentsQuery = useStudentsQuery();
  const count = studentsQuery.data?.data.length;

  return (
    <div
      data-slot="sidebar-promo"
      className="flex flex-col gap-2.5 rounded-xl bg-navy-900 p-4.5 group-data-[collapsible=icon]:hidden"
    >
      <span className="text-xs font-bold tracking-overline text-navy-muted uppercase">
        {t('sidebar.promo.overline')}
      </span>
      {count === undefined ? (
        <span aria-hidden="true" className="h-7 w-10 shimmer-sweep rounded-md opacity-25" />
      ) : (
        <span className="text-stat-lg leading-none font-bold text-white">{count}</span>
      )}
      {/* Canonical CTA is white-on-teal-500 — 2.3:1, a serious axe failure the
          export does not answer for and we do. Same teal surface, navy ink
          (6.1:1); a hover lift + teal halo replace the colour shift, since no
          step of the teal scale is dark enough to carry white text. */}
      <Link
        href="/dashboard/children/new"
        className="relative flex items-center justify-center gap-1.5 rounded-lg bg-teal-500 py-2.25 text-caption font-semibold text-navy-900 ring-0 ring-teal-100/50 transition-[transform,box-shadow] duration-200 ease-out after:absolute after:inset-x-0 after:-inset-y-1 hover:-translate-y-px hover:ring-2 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
        {t('sidebar.promo.cta')}
      </Link>
    </div>
  );
}

export { SidebarPromoPanel };
