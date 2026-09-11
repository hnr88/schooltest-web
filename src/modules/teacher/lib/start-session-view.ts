import { SETTINGS_SECTIONS, START_SESSION_TABS } from '@/modules/teacher/constants/start-session.constants';
import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type { SettingsSectionId } from '@/modules/teacher/types/start-session-modal.types';
import type { StartSessionTab } from '@/modules/teacher/types/start-session.types';

export function isStartSessionTab(value: unknown): value is StartSessionTab {
  return typeof value === 'string' && (START_SESSION_TABS as readonly string[]).includes(value);
}
import type { TeacherTestSession } from '@/modules/teacher/types/teacher-session.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

export type SectionSummaryKey = 'onOf' | 'lockedDown' | 'openFlagged' | 'open' | 'timingAuto' | 'timingWaits';

/** An accordion header's right-hand summary (`mkSec(...)`, `:4262–4265`). */
export function sectionSummary(
  id: SettingsSectionId,
  settings: SittingSettings,
): { key: SectionSummaryKey; values: Record<string, number> } {
  if (id === 'security') {
    return { key: settings.lockdown ? 'lockedDown' : settings.focusFlag ? 'openFlagged' : 'open', values: {} };
  }
  if (id === 'timing') {
    return { key: settings.autoSubmit ? 'timingAuto' : 'timingWaits', values: { limit: settings.timeLimit } };
  }
  const keys = SETTINGS_SECTIONS.find((section) => section.id === id)?.keys ?? [];
  return { key: 'onOf', values: { on: keys.filter((key) => settings[key]).length, total: keys.length } };
}

/** The dashboard's reading average for the class, rounded; null when nothing is scored. */
export function latestAverage(klass: DashboardClass | undefined): number | null {
  const average = klass?.reading?.average;
  return average === null || average === undefined ? null : Math.round(average);
}

/** "Last session": when the newest closed sitting that actually ran was opened. */
export function lastSessionAt(rows: readonly TeacherTestSession[]): string | null {
  let newest: string | null = null;
  for (const row of rows) {
    if (row.phase === 'cancelled' || row.opened_at === null) continue;
    if (newest === null || Date.parse(row.opened_at) > Date.parse(newest)) newest = row.opened_at;
  }
  return newest;
}
