'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useActiveSchoolStore } from '@/modules/school-admin/stores/use-active-school-store';
import { useSchoolMembershipsQuery } from '@/modules/school-admin/queries/use-school-memberships.query';
import { useSwitchSchool } from '@/modules/school-admin/hooks/use-switch-school';
import { formatSchoolMembershipSubLine, type SchoolMembership } from '@/modules/school-admin/schemas/school-memberships.schema';
import { getUserInitials } from '@/modules/shell/lib/user-initials';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from '@/modules/design-system';

// The rail's SCHOOL BLOCK (School Admin Portal.dc.html:26–48, menu :1169–1177,
// pick logic :1680–1690) — a 32px rounded-square badge with the school's
// initials, the name at 13.5/600 and the `plan · location` sub-line at 11.5px
// muted, with an up/down chevron. The block IS the switcher menu trigger:
// "Your schools" lists every administered school with a check on the active
// one; picking switches the whole portal and resets to the school home.
//
// Token substitutions (rules: no raw hex): the slice's #F4F7FF active row and
// #F4F6FA hover map to --color-accent / --color-surface-inset; the #0E2350
// badge to --color-navy-900; the #7C8698 muted ink to --color-body (the same
// AA substitution UserMenu records). Badge radius 10px = rounded-lg. Radix
// owns aria-expanded/haspopup on the trigger.
function schoolBadgeLabel(name: string | null): string {
  if (!name) return '';
  return getUserInitials(name);
}

function subLine(school: SchoolMembership, t: (key: string) => string): string {
  return formatSchoolMembershipSubLine(school, (plan) =>
    plan ? t(`SchoolAdmin.account.plan.${plan}`) : '',
  );
}

function MembershipRow({ school, active }: { school: SchoolMembership; active: boolean }) {
  const t = useTranslations();
  return (
    <>
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-inset text-[11.5px] font-semibold text-foreground"
      >
        {schoolBadgeLabel(school.name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-body-sm font-semibold text-foreground">{school.name}</span>
        <span className="truncate text-xs text-body">{subLine(school, t)}</span>
      </span>
      {active ? <Check aria-hidden="true" className="size-3.5 shrink-0 text-foreground" /> : null}
    </>
  );
}

function SchoolSwitcher() {
  const t = useTranslations();
  const activeSchoolDocumentId = useActiveSchoolStore((s) => s.activeSchoolDocumentId);
  const switchSchool = useSwitchSchool();
  const membershipsQuery = useSchoolMembershipsQuery(true);

  const schools = membershipsQuery.data ?? [];
  // No explicit pick yet = the legacy primary school is active (exactly what
  // the API's no-header resolution serves), so the tick is always honest.
  const activeDocumentId =
    activeSchoolDocumentId ??
    schools.find((school) => school.is_primary)?.documentId ??
    schools[0]?.documentId ??
    null;
  const active = schools.find((school) => school.documentId === activeDocumentId) ?? null;
  // The design block always renders: the identity is real even while the menu
  // is unavailable (memberships in flight or failed) — only the affordance
  // disappears, never the rail layout.
  const identity: SchoolMembership | null =
    active ?? (schools.length > 0 ? (schools[0] ?? null) : null);

  if (membershipsQuery.isPending) {
    return <Skeleton className="mb-5 h-16.5 w-full rounded-xl" />;
  }

  const triggerClasses =
    'relative flex w-full items-center gap-2.75 rounded-xl border border-divider bg-white px-3 py-2.5 text-left transition-colors duration-200 ease-out hover:bg-surface-inset focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none data-[state=open]:bg-surface-inset motion-reduce:transition-none';

  if (!identity) {
    return (
      <div className={triggerClasses} data-testid="school-switcher" data-state="unavailable">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy-900 text-caption font-semibold text-white"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-sm font-semibold text-foreground">
            {membershipsQuery.isError ? t('Shell.schoolSwitch.unavailable') : ''}
          </span>
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${identity.name ?? ''} — ${t('Shell.schoolSwitch.yourSchools')}`}
        data-testid="school-switcher"
        className={`${triggerClasses} mb-5`}
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy-900 text-caption font-semibold text-white"
        >
          {schoolBadgeLabel(identity.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px group-data-[collapsible=icon]:hidden">
          <span className="truncate text-body-sm font-semibold text-foreground">{identity.name}</span>
          <span className="truncate text-xs text-body">{subLine(identity, t)}</span>
        </span>
        <ChevronsUpDown
          aria-hidden="true"
          className="size-4 shrink-0 text-body group-data-[collapsible=icon]:hidden"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" sideOffset={8} className="w-56">
        <span
          role="presentation"
          className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
        >
          {t('Shell.schoolSwitch.yourSchools')}
        </span>
        {schools.map((school) => {
          const isActive = school.documentId === activeDocumentId;
          return (
            <DropdownMenuItem
              key={school.documentId}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => switchSchool(school.documentId)}
            >
              <MembershipRow school={school} active={isActive} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { SchoolSwitcher };
