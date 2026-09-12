/**
 * The live monitor read's refetch cadence in MILLISECONDS. This is a transport
 * concern — how often the portal re-asks C-TS-3 — and has NOTHING to do with the
 * stall flag: `stall_threshold_minutes` arrives inside the payload, sourced
 * server-side from `Config`, and is the only number that decides whether a
 * student reads as stalled.
 *
 * R1 PART B: the rest of this file described the retired C-TS-3 tile grid (state
 * order, tones, summary tiles and their label keys). The class Live sessions tab
 * draws that list itself from `live-students.constants.ts`, so only the cadence
 * `use-test-session-monitor.query.ts` polls with is left here.
 */
export const MONITOR_POLL_INTERVAL_MS = 5_000;
