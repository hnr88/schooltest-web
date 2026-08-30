import { AlertCircle, Check, LoaderCircle, UserCheck, UserX, XCircle } from 'lucide-react';

import type {
  MonitorSummaryKey,
  MonitorTileTheme,
} from '@/modules/teacher/types/live-monitor.types';
import type { MonitorState } from '@/modules/teacher/types/teacher.types';

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
 */
export const MONITOR_STATE_ORDER: readonly MonitorState[] = [
  'scoring_failed',
  'submitted',
  'in_progress',
  'stalled',
  'joined',
  'not_joined',
];

/**
 * The stat tiles above the grid, in the wireframe's left-to-right order, with
 * the operator counter appended after `stalled`.
 */
export const MONITOR_SUMMARY_ORDER: readonly MonitorSummaryKey[] = [
  'expected',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
  'scoring_failed',
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
  stalled: 'stateStalled',
  joined: 'stateJoined',
  not_joined: 'stateNotJoined',
};

/** The label under each stat tile, same namespace. */
export const MONITOR_SUMMARY_LABEL_KEY: Record<MonitorSummaryKey, string> = {
  expected: 'summaryExpected',
  joined: 'summaryJoined',
  in_progress: 'summaryInProgress',
  submitted: 'summarySubmitted',
  stalled: 'summaryStalled',
  scoring_failed: 'summaryScoringFailed',
};

/** Ink for the stat-tile VALUE; the label beneath it always carries the meaning. */
export const MONITOR_SUMMARY_VALUE_CLASS: Record<MonitorSummaryKey, string> = {
  expected: 'text-foreground',
  joined: 'text-secondary-foreground',
  in_progress: 'text-foreground',
  submitted: 'text-success-ink',
  stalled: 'text-warning-ink',
  scoring_failed: 'text-danger-ink',
};
