/**
 * The join-code panel's view model (.qa/DESIGN.md §Test sessions, view 1).
 *
 * Three DISTINGUISHABLE outcomes, never collapsed into one nullable blob: the
 * teacher either has a code to read out, has an open session the platform never
 * minted a code for, or has no open session at all. `absent` is the only state
 * that renders nothing, and it is reached only from a real `live_session: null`.
 */
export interface JoinCodeReady {
  status: 'ready';
  sittingDocumentId: string;
  /** C-TS-1's minted `READ-####` (DECISIONS.md A3) — never generated client-side. */
  code: string;
  className: string;
  /** C-TD-2's own `label`; `null` when the sitting is not on the A/B pair. */
  testLabel: string | null;
  monitorHref: string;
}

/** An open sitting whose `code` is `null` — C-TS-2/C-TD-1 allow it for sittings
 *  created outside C-TS-1, where the `api::sitting` core create mints nothing. */
export interface JoinCodeUnavailable {
  status: 'unavailable';
  className: string;
}

export interface JoinCodeAbsent {
  status: 'absent';
}

export type JoinCodeView = JoinCodeReady | JoinCodeUnavailable | JoinCodeAbsent;

export interface JoinCodeDisplayProps {
  view: JoinCodeReady;
  isCopied: boolean;
  onCopy: () => void;
}
