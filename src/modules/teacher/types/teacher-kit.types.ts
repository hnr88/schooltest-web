import type { ComponentProps, ReactNode } from 'react';

/**
 * Teacher Portal v2 kit (`components/v2/`) — presentational prop types. Every
 * size and tone name maps to a value the design draws (`Teacher Portal
 * v2.dc.html`; research/design-surfaces.md §8); the class maps live in
 * `constants/teacher-kit.constants.ts`.
 */

export type TeacherPageCardVariant = 'flush' | 'padded';

export interface TeacherPageCardProps extends ComponentProps<'div'> {
  /** `flush`: list screens, whose sections pad themselves; `padded`: class/student card (26/30/30, gap 20). */
  variant?: TeacherPageCardVariant;
  /** Scroll inside a fixed-height parent instead of growing with the content. */
  scroll?: boolean;
}

export interface TeacherPageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-side 13px grey meta text, before the actions (e.g. the school name). */
  meta?: ReactNode;
  /** Right-side actions, after the meta (e.g. the navy "Start new session"). */
  actions?: ReactNode;
  className?: string;
}

/** The design's semantic fg/bg chip pairs (design-surfaces §8.3). */
export type ToneChipTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'scheduled'
  | 'today'
  | 'danger'
  | 'navy'
  | 'neutral'
  | 'slate';

/** xs 10.5px/700 caps tag · sm 11.5px band · md 12px tile pill · lg 12px 5/12 chip · xl 12px 7/14 header pill. */
export type ToneChipSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ToneChipProps {
  tone: ToneChipTone;
  size?: ToneChipSize;
  /** A 6px leading dot in the chip's own ink. */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

/** The status vocabulary the kit draws (class status, booking chip, live badge). */
export type TeacherStatus = 'live' | 'sittingNow' | 'scheduled' | 'noTests' | 'complete' | 'today';

export interface TeacherStatusPillProps {
  status: TeacherStatus;
  /** `pill`: tinted pill with a dot (tiles, headers). `dot`: plain dot + 13px text (list rows). `live` always draws the solid red badge. */
  appearance?: 'pill' | 'dot';
  /** live: xs strip chip ("LIVE"), sm list row, md tile, lg monitor head. pill: md tile, lg class header (pulse-ring dot when sitting). */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Overrides the catalog label. */
  label?: string;
  className?: string;
}

export type ClassBadgeSize = 'sm' | 'md' | 'lg';
export type ClassBadgeTone = 'neutral' | 'soft' | 'navy';

export interface ClassBadgeProps {
  /** The short code ("7A") — derive it with `classBadgeCode(name)`. */
  code: string;
  /** sm 34px r9 · md 40px r10 · lg 56px r10. */
  size?: ClassBadgeSize;
  /** neutral #F3F4F6 · soft #EEF1F6 (live sessions) · navy (class header). */
  tone?: ClassBadgeTone;
  className?: string;
}

export type DeltaFormat = 'arrow' | 'signed' | 'arrowSigned';
export type DeltaDirection = 'up' | 'down' | 'flat' | 'none';

export interface DeltaTextProps {
  /** A server-sent difference; `null`/`undefined` renders the grey em dash. */
  value: number | null | undefined;
  /** arrow "↑4" · signed "+4" / "−2" / "±0" · arrowSigned "↑ +9". */
  format?: DeltaFormat;
  /** Appended after the number, e.g. `%` or ` pts`. */
  unit?: string;
  /** xs 11.5px · sm 12.5px · md 14px · lg 15px (all 600). */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

/** insight 28px KPI · progress 26px tile · count 30px value-first tile. */
export type KpiCardVariant = 'insight' | 'progress' | 'count';
export type KpiCardTone = 'navy' | 'success' | 'danger' | 'warning';

export interface KpiCardProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  variant?: KpiCardVariant;
  tone?: KpiCardTone;
  className?: string;
}

export interface SectionCardProps extends Omit<ComponentProps<'section'>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** muted #FAFBFC panel (default) or a white card. */
  tone?: 'muted' | 'white';
  /** none · sm 16/18 · md 20/22 · lg 24/26 (default). */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export type AcaraPhaseKey = 'beginning' | 'emerging' | 'developing' | 'consolidating';

export interface PhaseChipProps {
  /** `null` = no phase measured, drawn as "Not sat" in the Beginning pair. Normalise served labels with `acaraPhaseKey`. */
  phase: AcaraPhaseKey | null;
  label?: string;
  /** md 5/12 table chip · lg 6/13 header chip. */
  size?: 'md' | 'lg';
  className?: string;
}

export type BandKey = 'secure' | 'developing' | 'emerging' | 'notYet';

export interface BandChipProps {
  band: BandKey;
  label?: string;
  /** sm 11px · md 11.5px. */
  size?: 'sm' | 'md';
  className?: string;
}

export type InitialsAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InitialsAvatarTone = 'grey' | 'soft' | 'blue' | 'navy';

export interface InitialsAvatarProps {
  /** Initials are derived from the name unless given. */
  name?: string;
  initials?: string;
  /** xs 30 · sm 34 · md 36 · lg 40 · xl 56. */
  size?: InitialsAvatarSize;
  /** grey #F5F6F8 · soft #EEF1F6 · blue #E8EEFB · navy. */
  tone?: InitialsAvatarTone;
  className?: string;
}
