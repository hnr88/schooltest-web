'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/design-system';
import { DIRECTORY_PARAMS } from '@/modules/ops/directory';
import { OpsAdminsTab } from '@/modules/ops/components/OpsAdminsTab';
import { OpsClassesTab } from '@/modules/ops/components/OpsClassesTab';
import { OpsOverviewTab } from '@/modules/ops/components/OpsOverviewTab';
import { OpsStaffInvitationDialog } from '@/modules/ops/components/OpsStaffInvitationDialog';
import { OpsStudentsTab } from '@/modules/ops/components/OpsStudentsTab';
import { OpsTeachersDialog } from '@/modules/ops/components/OpsTeachersDialog';
import { OpsTeachersTab } from '@/modules/ops/components/OpsTeachersTab';

import type { OpsSchoolTablesProps } from '@/modules/ops/types/components.types';

/**
 * The five pictured tabs — Overview, Admins, Teachers, Classes, Students.
 *
 * FIVE, not six: Results is deliberately absent. The reference draws five and
 * the visual-reference spec asserts it, so Results is reached from the
 * test-count summary instead of a tab of its own.
 */
const TAB_ORDER = ['overview', 'admins', 'teachers', 'classes', 'students'] as const;
type Tab = (typeof TAB_ORDER)[number];

const TAB_PARAM = 'tab';

/** The directory kit's page-global URL params, reset whenever the tab changes. */
const DIRECTORY_SCOPED_PARAMS = [
  DIRECTORY_PARAMS.q,
  DIRECTORY_PARAMS.sort,
  DIRECTORY_PARAMS.page,
  'blocked',
] as const;

function isTab(value: string | null): value is Tab {
  return value !== null && (TAB_ORDER as readonly string[]).includes(value);
}

/**
 * Ops school detail — the tabbed screens.
 *
 * Built on the design-system `Tabs` primitive (Radix underneath) rather than
 * the hand-rolled tablist this replaced. That is not a cosmetic swap: the
 * previous markup carried `role="tab"` and `aria-selected` but had no
 * arrow-key navigation, no roving focus and no `aria-controls`, so it
 * announced itself as a tablist while behaving like a row of buttons. Radix
 * supplies all three, and `@/components/ui/tabs` stays unedited (CLAUDE.md
 * law 11) because the design system already re-exports it.
 *
 * The selected tab lives in the URL, so a tab is linkable and survives a
 * reload. The whole block is keyed by school: moving to another school
 * remounts it, which resets the tab AND discards the previous school's panel
 * state — a stale roster appearing under a new school is the defect that
 * matters here, and unmounting is what makes it impossible rather than
 * unlikely.
 *
 * ops/12 (D-29): the four tab bodies live in their own sibling files
 * (OpsOverviewTab, OpsAdminsTab, OpsTeachersTab, plus the pre-existing
 * OpsClassesTab and OpsStudentsTab) so tasks 15-18 and 25 each own one file.
 * This component keeps ONLY the tab bar, the URL handling and the panel
 * wiring.
 */
export function OpsSchoolTables({ schoolDocumentId, school }: OpsSchoolTablesProps) {
  const t = useTranslations('Ops.schoolTables');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [teachersOpen, setTeachersOpen] = useState(false);
  // GAP-1 (task 15): the staff invitations dialog — the pictured INVITE MODAL
  // plus its table — opened from BOTH staff tabs. One instance for the whole
  // tab block, mounted unconditionally like OpsOnboardSchoolDialog: closing
  // must run the dialog primitive's cleanup even when a tab switch flips
  // `active` underneath it.
  const [inviteOpen, setInviteOpen] = useState(false);
  const openInvitations = useCallback(() => setInviteOpen(true), []);

  const raw = searchParams.get(TAB_PARAM);
  // An unknown ?tab= falls back to the first tab rather than rendering nothing:
  // a hand-edited or stale URL must not leave the page blank.
  const tab: Tab = isTab(raw) ? raw : 'overview';

  const onTabChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'overview') params.delete(TAB_PARAM);
      else params.set(TAB_PARAM, next);
      // Each tab is its own directory, and the kit's URL params are page-global
      // (`q`, `sort`, `page` are fixed names with no namespace). Carrying them
      // across a tab switch would ask the Teachers directory for the Admins
      // page 3 the operator was on — an empty table that looks like "no
      // teachers". Clearing them here, in the handler that changes the tab, is
      // the one place that knows the directory scope just changed.
      for (const param of DIRECTORY_SCOPED_PARAMS) params.delete(param);
      const query = params.toString();
      router.replace(query === '' ? pathname : `${pathname}?${query}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <Tabs
      key={schoolDocumentId}
      value={tab}
      onValueChange={onTabChange}
      className="flex flex-col gap-4"
    >
      {/* Design 292-297: underline tabs — 14px text, 12px 16px padding, active
          600 weight with a 2.5px underline overlapping a full-width 1px rule. */}
      <TabsList
        aria-label={t('title')}
        variant="line"
        className="w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-[#DFE5EE] bg-transparent px-1 py-0 group-data-horizontal/tabs:h-auto"
      >
        {TAB_ORDER.map((key) => {
          // The design's tab count badges (`:296-298`), fed from the detail
          // read; the Overview tab has no count. A zero count renders NO badge
          // (the design's countDisplay), and the badge is aria-hidden so the
          // tab's accessible name stays exactly the label the specs select by.
          const count =
            key === 'admins'
              ? school.admin_count
              : key === 'teachers'
                ? school.portal_teacher_count
                : key === 'classes'
                  ? school.class_count
                  : key === 'students'
                    ? school.student_count
                    : null;
          return (
            <TabsTrigger
              key={key}
              value={key}
              className="h-auto flex-none justify-center gap-2 rounded-none border-0 border-b-[2.5px] border-b-transparent bg-transparent px-4 py-3 text-sm font-medium text-[#7C8698] hover:text-foreground data-active:mb-[-1px] data-active:border-b-primary data-active:bg-transparent data-active:font-semibold data-active:text-foreground data-active:after:opacity-0"
            >
              {t(`tab.${key}`)}
              {count !== null && count > 0 ? (
                <span
                  aria-hidden="true"
                  data-testid={`ops-tab-count-${key}`}
                  className="rounded-full bg-[#E8ECF4] px-2 py-0.5 text-[11.5px] font-bold leading-none text-[#7C8698]"
                >
                  {count}
                </span>
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Each panel owns its own loading, error and empty state: every tab body
          is a component with its own query, so one tab failing never blanks
          another. */}
      <TabsContent value="overview">
        <OpsOverviewTab school={school} />
      </TabsContent>

      <TabsContent value="admins">
        <OpsAdminsTab
          schoolDocumentId={schoolDocumentId}
          ownerDocumentId={school.owner_documentId}
          active={tab === 'admins'}
          onInvite={openInvitations}
        />
      </TabsContent>

      <TabsContent value="teachers">
        <OpsTeachersTab
          schoolDocumentId={schoolDocumentId}
          active={tab === 'teachers'}
          onManage={() => setTeachersOpen(true)}
          onInvite={openInvitations}
        />
      </TabsContent>

      <TabsContent value="classes">
        <OpsClassesTab schoolDocumentId={schoolDocumentId} />
      </TabsContent>

      <TabsContent value="students">
        <OpsStudentsTab schoolDocumentId={schoolDocumentId} />
      </TabsContent>

      <OpsTeachersDialog
        schoolDocumentId={schoolDocumentId}
        open={teachersOpen}
        onOpenChange={setTeachersOpen}
      />
      <OpsStaffInvitationDialog
        schoolDocumentId={schoolDocumentId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </Tabs>
  );
}
