import {
  MONITOR_STATE_ORDER,
  MONITOR_SUMMARY_ORDER,
} from '@/modules/teacher/constants/live-monitor.constants';
import type {
  LiveMonitorReadCounts,
  LiveMonitorReadStatus,
  MonitorSummaryItem,
  MonitorTileDetail,
} from '@/modules/teacher/types/live-monitor.types';
import type {
  MonitorStudent,
  MonitorSummary,
} from '@/modules/teacher/types/teacher-session.types';

const MS_PER_MINUTE = 60_000;

/**
 * Error beats pending — the same precedence every other teacher surface uses.
 * There is deliberately NO `empty` branch: C-TS-3's `students` array is the
 * sitting's class roster, so a zero-length grid on a real sitting is the honest
 * "this class has no active students" and still renders its header and counters.
 * `ready` requires the sitting object itself, so a 403/404 can never wear an
 * empty grid.
 */
export function deriveLiveMonitorStatus(counts: LiveMonitorReadCounts): LiveMonitorReadStatus {
  if (counts.isError) return 'error';
  if (counts.isLoading || !counts.isSuccess || !counts.hasSitting) return 'loading';
  return 'ready';
}

/**
 * The stat tiles, read STRAIGHT off C-TS-3's `summary`. The portal never
 * counts the tiles itself: the server already partitioned the roster, and a
 * client-side recount could disagree with the grid it sits above.
 *
 * `scoring_failed` is optional on the wire while the API still partitions the
 * roster five ways — its stat is omitted (not zeroed) until the server sends
 * it, so a fabricated 0 can never claim a failure that was never reported.
 */
export function monitorSummaryItems(summary: MonitorSummary): readonly MonitorSummaryItem[] {
  return MONITOR_SUMMARY_ORDER.flatMap((key) => {
    const value = summary[key];
    return value === undefined ? [] : [{ key, value }];
  });
}

/**
 * Grouped exactly as wireframe `09` view 2 — submitted, in progress, stalled,
 * joined, not joined — then alphabetically inside each group so a tile keeps a
 * stable place between polls. The state itself is never recomputed here; this
 * only ORDERS what the server already decided.
 */
export function sortMonitorStudents(
  students: readonly MonitorStudent[],
): readonly MonitorStudent[] {
  return [...students].sort((left, right) => {
    const byState =
      MONITOR_STATE_ORDER.indexOf(left.state) - MONITOR_STATE_ORDER.indexOf(right.state);
    if (byState !== 0) return byState;
    return left.display_name.localeCompare(right.display_name);
  });
}

/**
 * The extra FACT a tile prints beneath the name — "Stage 2 of 3" while in
 * progress, "No activity 8 min" while stalled — as a message reference the tile
 * then translates. `null` means the tile prints its state word alone, which is
 * what the other three states do.
 *
 * Every number here is the server's: `stage` IS `session.current_stage`,
 * `total_stages` IS `stage_plan.stages.length`, and `inactive_minutes` is the
 * server's own age of `last_activity`. A `stalled` tile whose
 * `inactive_minutes` is null therefore says "Stalled" rather than "No activity
 * 0 min" — a fabricated zero would read as "active right now".
 */
export function monitorTileDetail(student: MonitorStudent): MonitorTileDetail | null {
  if (student.state === 'in_progress' && student.stage !== null && student.total_stages !== null) {
    return { key: 'stageOf', values: { stage: student.stage, total: student.total_stages } };
  }
  if (student.state === 'stalled' && student.inactive_minutes !== null) {
    return { key: 'noActivity', values: { minutes: student.inactive_minutes } };
  }
  return null;
}

/**
 * The count of guidance reminders a student has received (C-PR-1 read side),
 * or null when none are recorded. INFORMATION ONLY (rule 35): the number feeds
 * a neutral "reminders noted" chip — it is never severity-coloured, never an
 * accusation, and never affects the tile's state or paint.
 */
export function monitorTileSignals(student: MonitorStudent): number | null {
  if (student.proctoring === null || student.proctoring === undefined) return null;
  const { info, warn, flag } = student.proctoring.count_by_severity;
  const total = info + warn + flag;
  return total === 0 ? null : total;
}

/**
 * "Session started N min ago" for the live header. Presentation only — it is a
 * whole-minute rendering of the server's `opened_at`, never an input to any tile
 * state (the stall flag is the server's, from `stall_threshold_minutes`).
 *
 * `readAtMs` is the query's `dataUpdatedAt`, i.e. WHEN this payload arrived, so
 * the caller never reads a clock during render. `null` when the sitting carries
 * no `opened_at`, so the line is omitted rather than invented; a clock skewed
 * ahead of the server floors at 0 instead of printing a negative age.
 */
export function sessionElapsedMinutes(openedAt: string | null, readAtMs: number): number | null {
  if (openedAt === null) return null;
  const openedMs = Date.parse(openedAt);
  if (Number.isNaN(openedMs)) return null;
  return Math.max(0, Math.floor((readAtMs - openedMs) / MS_PER_MINUTE));
}
