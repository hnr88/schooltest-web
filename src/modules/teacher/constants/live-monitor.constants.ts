import {
  AlertCircle,
  Check,
  LoaderCircle,
  Pause,
  UserCheck,
  UserMinus,
  UserX,
  XCircle,
} from 'lucide-react';

import type {
  MonitorSummaryKey,
  MonitorTileTheme,
} from '@/modules/teacher/types/live-monitor.types';
import type { MonitorConnection, MonitorState } from '@/modules/teacher/types/teacher.types';

/**
 * The live grid's refetch cadence in MILLISECONDS. This is a transport concern —
 * how often the portal re-asks C-TS-3 — and has NOTHING to do with the stall
 * flag: `stall_threshold_minutes` arrives inside the payload, sourced server-side
 * from `Config`, and is the only number that decides whether a tile is amber.
 */
export const MONITOR_POLL_INTERVAL_MS = 5_000;

/**
 * .qa/DESIGN.md §Live monitoring — the grid groups the states in this order
 * (loudest first, not-joined last), exactly as wireframe `09` view 2.
 * `scoring_failed` leads: a result that exhausted its R retries is the one
 * tile a teacher must act on, so it can never sort beneath the routine ones.
 * teacher/12 adds `paused` directly beside `stalled` (the design's own
 * chipFor gives both the same amber) and `absent` in the quiet neutral group
 * beside `joined` — `sortMonitorStudents` never sees an unlisted member, so
 * nothing can sort above `scoring_failed` by accident.
 */
export const MONITOR_STATE_ORDER: readonly MonitorState[] = [
  'scoring_failed',
  'submitted',
  'in_progress',
  'paused',
  'stalled',
  'absent',
  'joined',
  'not_joined',
];

/**
 * The stat tiles above the grid, in the wireframe's left-to-right order, with
 * the operator counter appended after `stalled` and teacher/12's two new
 * counters after it.
 */
export const MONITOR_SUMMARY_ORDER: readonly MonitorSummaryKey[] = [
  'expected',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
  'scoring_failed',
  'absent',
  'paused',
];

/**
 * Tone per state, mapped through .qa/DESIGN.md's token table — never the
 * wireframe's inline hex. The colour is decorative: every tile also prints a
 * state-specific line of text and carries its own icon SHAPE, so the state
 * survives greyscale, colour blindness and a screen reader (WCAG 2.2 AA 1.4.1).
 */
export const MONITOR_STATE_THEME: Record<MonitorState, MonitorTileTheme> = {
  scoring_failed: {
    icon: XCircle,
    iconClass: '',
    tile: 'border-danger-strong bg-danger-soft text-danger-ink',
    name: 'text-danger-ink',
    detail: 'text-danger-ink',
  },
  submitted: {
    icon: Check,
    iconClass: '',
    tile: 'border-transparent bg-success-soft-2 text-success-ink',
    name: 'text-success-ink',
    detail: 'text-success-ink',
  },
  in_progress: {
    icon: LoaderCircle,
    iconClass: 'animate-spin duration-1000 motion-reduce:animate-none',
    tile: 'border-transparent bg-blue-50 text-secondary-foreground',
    name: 'text-secondary-foreground',
    detail: 'text-secondary-foreground',
  },
  stalled: {
    icon: AlertCircle,
    iconClass: '',
    tile: 'border-warning-strong bg-warning-soft text-warning-ink',
    name: 'text-warning-ink',
    detail: 'text-warning-ink',
  },
  // teacher/12 — the design's own chipFor gives Paused the SAME amber as
  // Stalled (`:3366–3372`), so a paused room never reads as an error; the
  // Pause glyph shape carries the difference (WCAG 2.2 AA 1.4.1).
  paused: {
    icon: Pause,
    iconClass: '',
    tile: 'border-warning-strong bg-warning-soft text-warning-ink',
    name: 'text-warning-ink',
    detail: 'text-warning-ink',
  },
  // teacher/12 — Absent is grey (`:3370`), not an alarm: the student was
  // marked absent, there is nothing to act on. The UserMinus glyph keeps the
  // state readable in greyscale beside the other neutral tiles.
  absent: {
    icon: UserMinus,
    iconClass: '',
    tile: 'border-transparent bg-surface-inset text-muted-foreground',
    name: 'text-muted-foreground',
    detail: 'text-muted-foreground',
  },
  joined: {
    icon: UserCheck,
    iconClass: '',
    tile: 'border-transparent bg-surface-inset text-body',
    name: 'text-foreground',
    detail: 'text-body',
  },
  not_joined: {
    icon: UserX,
    iconClass: '',
    tile: 'border-dashed border-portal-input bg-transparent text-body',
    name: 'text-body',
    detail: 'text-body',
  },
};

/**
 * WCAG 2.2 AA 1.4.1: the tone above is NEVER the only carrier of the state — the
 * tile and the legend both print the state's own word, from these keys under
 * `Teacher.testSessions.live`.
 */
export const MONITOR_STATE_LABEL_KEY: Record<MonitorState, string> = {
  scoring_failed: 'stateScoringFailed',
  submitted: 'stateSubmitted',
  in_progress: 'stateInProgress',
  paused: 'statePaused',
  stalled: 'stateStalled',
  absent: 'stateAbsent',
  joined: 'stateJoined',
  not_joined: 'stateNotJoined',
};

/**
 * The connection chip printed beneath a tile's name (teacher/12, design
 * `:3515–3552`). `null` connections render no chip at all.
 */
export const MONITOR_CONNECTION_LABEL_KEY: Record<MonitorConnection, string> = {
  online: 'connectionOnline',
  weak: 'connectionWeak',
  offline: 'connectionOffline',
};

/** The label under each stat tile, same namespace. */
export const MONITOR_SUMMARY_LABEL_KEY: Record<MonitorSummaryKey, string> = {
  expected: 'summaryExpected',
  joined: 'summaryJoined',
  in_progress: 'summaryInProgress',
  submitted: 'summarySubmitted',
  stalled: 'summaryStalled',
  scoring_failed: 'summaryScoringFailed',
  absent: 'summaryAbsent',
  paused: 'summaryPaused',
};

/** Ink for the stat-tile VALUE; the label beneath it always carries the meaning. */
export const MONITOR_SUMMARY_VALUE_CLASS: Record<MonitorSummaryKey, string> = {
  expected: 'text-foreground',
  joined: 'text-secondary-foreground',
  in_progress: 'text-foreground',
  submitted: 'text-success-ink',
  stalled: 'text-warning-ink',
  scoring_failed: 'text-danger-ink',
  absent: 'text-muted-foreground',
  paused: 'text-warning-ink',
};
