'use client';

import { useTranslations } from 'next-intl';

import { OpsDialogDescription, OpsDialogTitle } from '@/modules/design-system';
import { FactsRow } from '@/modules/teacher/components/start-session/FactsRow';
import { ModalFooter } from '@/modules/teacher/components/start-session/ModalFooter';
import { SchedulePanel } from '@/modules/teacher/components/start-session/SchedulePanel';
import { SettingsTab } from '@/modules/teacher/components/start-session/SettingsTab';
import { StartSessionTabs } from '@/modules/teacher/components/start-session/StartSessionTabs';
import { StudentsTab } from '@/modules/teacher/components/start-session/StudentsTab';
import { TestTab } from '@/modules/teacher/components/start-session/TestTab';
import { WhenOptions } from '@/modules/teacher/components/start-session/WhenOptions';
import { useStartSessionModal } from '@/modules/teacher/hooks/useStartSessionModal';
import { latestAverage } from '@/modules/teacher/lib/start-session-view';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';
import type { StartSessionFormState } from '@/modules/teacher/types/start-session-modal.types';
import type { DashboardClass, TeacherTest } from '@/modules/teacher/types/teacher.types';

/** The modal as drawn (`:1350–1599`): title, When, window, tabs, facts, CTA. */
function StartSessionBody({
  initial,
  classes,
  tests,
  editSittingId,
}: {
  initial: StartSessionFormState;
  classes: readonly DashboardClass[];
  tests: readonly TeacherTest[];
  editSittingId: string | null;
}) {
  const t = useTranslations('TeacherPortal.startSession');
  const tKit = useTranslations('TeacherPortal.kit');
  const close = useStartSessionStore((state) => state.close);
  const vm = useStartSessionModal({ initial, classes, tests, editSittingId });
  const { form } = vm;
  const isDemo = form.mode === 'demo';
  const className = vm.klass?.name ?? '';
  const testTab = (
    <TestTab isDemo={isDemo} classes={classes} tests={tests} classId={form.classId} formId={form.formId} onClass={vm.setClass} onTest={vm.setTest} />
  );

  return (
    <div data-slot="start-session-body" data-mode={form.mode}>
      <OpsDialogTitle className="m-0 text-[21px] font-semibold text-navy-900">
        {t(isDemo ? 'titleDemo' : vm.isEdit ? 'titleEdit' : 'title')}
      </OpsDialogTitle>
      <OpsDialogDescription className="mt-[7px] text-[13.5px] leading-[1.6] text-[#6B7280]">
        {t(`sub.${form.mode}`)}
      </OpsDialogDescription>
      <WhenOptions value={form.mode} onValueChange={vm.setMode} isEdit={vm.isEdit} />
      {form.mode === 'later' ? (
        <SchedulePanel
          date={form.date}
          opens={form.opens}
          closes={form.closes}
          timeLimit={form.settings.timeLimit}
          errors={vm.errors}
          serverMessages={vm.failure?.scheduleMessages ?? []}
          onDate={vm.setDate}
          onOpens={vm.setOpens}
          onCloses={vm.setCloses}
        />
      ) : null}
      {isDemo ? (
        testTab
      ) : (
        <StartSessionTabs
          tab={form.tab}
          onTab={vm.setTab}
          subs={{
            test: t('tabs.testSub', { variant: vm.test?.variant ?? '', className }),
            students: vm.isChecking
              ? tKit('noValue')
              : form.scope === 'whole'
                ? t('tabs.studentsAvailable', { free: vm.free.length, total: vm.entries.length })
                : t('tabs.studentsSelected', { count: vm.pickedFree.length }),
            settings: t(form.settings.skip ? 'tabs.settingsSkipOn' : 'tabs.settingsSkipOff', { limit: form.settings.timeLimit }),
          }}
          panels={{
            test: testTab,
            students: (
              <StudentsTab
                mode={form.mode}
                className={className}
                scope={form.scope}
                onScope={vm.setScope}
                entries={vm.entries}
                freeCount={vm.free.length}
                pickedCount={vm.pickedFree.length}
                onToggle={vm.toggleStudent}
                isLoading={vm.data.rosterPending}
                hasError={vm.data.rosterError || vm.data.busyError}
                onRetry={vm.data.retry}
              />
            ),
            settings: (
              <SettingsTab
                settings={form.settings}
                openSections={form.openSections}
                onToggleSection={vm.toggleSection}
                onToggleSetting={vm.toggleSetting}
                onTimeLimit={vm.setTimeLimit}
              />
            ),
          }}
        />
      )}
      {isDemo ? null : (
        <FactsRow
          className={className}
          studentCount={vm.klass?.student_count ?? vm.entries.length}
          average={latestAverage(vm.klass)}
          lastSessionAt={vm.data.lastSessionPending ? undefined : vm.data.lastSessionAt}
        />
      )}
      <ModalFooter
        label={!isDemo && vm.isChecking ? t('cta.checking') : t(`cta.${vm.cta.labelKey}`, { count: vm.cta.count })}
        canSubmit={vm.canSubmit}
        isBusy={vm.isPending || vm.isChecking}
        onSubmit={vm.onSubmit}
        onCancel={close}
        error={vm.failure?.message || null}
        note={isDemo ? t('cta.demoPending') : null}
      />
    </div>
  );
}

export { StartSessionBody };
