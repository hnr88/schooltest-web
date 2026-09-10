/**
 * school-admin/02 — the per-kind table behind §L-filters (U-07). ONE row per
 * `DirectoryFilterKind`: whether the sentinel rules apply, whether `options`
 * may pend, whether counts may render, and whether a client-mode surface owes
 * a predicate. The renderer (`DirectoryFilters`) dispatches on the same
 * table, so adding a kind is a row here plus an arm there — never a consumer
 * change. The value codecs at the bottom are the ONLY place a kind's string
 * serialisation is defined.
 */
import { DIRECTORY_ALL } from '../constants/directory.constants';
import type {
  DirectoryFilterDef,
  DirectoryFilterKind,
  DirectoryFilterValue,
  DirectoryPendingFilterDef,
} from '../types/directory.types';

/** A def the renderer accepts: fully specified, or pending its options (U-45). */
export type AnyDirectoryFilterDef<Row = unknown> =
  | DirectoryFilterDef<Row>
  | DirectoryPendingFilterDef<Row>;

export interface DirectoryFilterKindInfo {
  /** The def's `options` are its value domain: sentinel-validated write, fail-open parse. */
  readonly enumerated: boolean;
  /** The control lists `options`, so they may pend (U-45: disabled, sentinel shown). */
  readonly optioned: boolean;
  /** The ONLY kind whose render reads `def.counts` (D-02: from `meta`, never rows). */
  readonly counted: boolean;
  /** A plain equality on `key` is the whole filter — client mode needs no predicate. */
  readonly equality: boolean;
}

export const DIRECTORY_FILTER_KINDS: Readonly<
  Record<DirectoryFilterKind, DirectoryFilterKindInfo>
> = {
  select: { enumerated: true, optioned: true, counted: false, equality: true },
  chips: { enumerated: true, optioned: true, counted: false, equality: true },
  counted: { enumerated: true, optioned: true, counted: true, equality: true },
  toggle: { enumerated: true, optioned: false, counted: false, equality: false },
  multi: { enumerated: true, optioned: true, counted: false, equality: false },
  text: { enumerated: false, optioned: false, counted: false, equality: false },
  dateRange: { enumerated: false, optioned: false, counted: false, equality: false },
  numberRange: { enumerated: false, optioned: false, counted: false, equality: false },
};

/** `kind` is optional; `undefined` IS the select kind — exactly the old render. */
export function directoryFilterKindOf<Row>(def: AnyDirectoryFilterDef<Row>): DirectoryFilterKind {
  return def.kind ?? 'select';
}

/** True when a client-mode surface owes this def a predicate (§L-filters). */
export function directoryFilterNeedsPredicate<Row>(def: AnyDirectoryFilterDef<Row>): boolean {
  return !DIRECTORY_FILTER_KINDS[directoryFilterKindOf(def)].equality;
}

/** The toggle kind's ON literal; `DIRECTORY_ALL` stays off. */
export const DIRECTORY_TOGGLE_ON = 'true';

/** The default client-mode predicate for an equality kind: one field, plain equality. */
export function equalityBy<Row, Value>(
  accessor: (row: Row) => Value,
): (row: Row, value: string) => boolean {
  return (row, value) => accessor(row) === value;
}

const RANGE_SEPARATOR = '..';

/**
 * The range slice of a widened value, narrowed AT THE READ SITE — the
 * `{from,to}` members exist only here and in the range arms, so a `select`
 * value and a range value can never be confused. An array is excluded by its
 * `length` key (Array.isArray cannot narrow a `readonly` array); no cast.
 */
export function directoryFilterRangeOf(
  value: DirectoryFilterValue,
): { from?: string; to?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'length' in value) {
    return {};
  }
  return value;
}

/**
 * The URL string -> the value a predicate reads. The sentinel passes through
 * untouched (an unfiltered key is the sentinel for EVERY kind); a range half
 * decodes to `undefined`, which every range predicate must fail open on.
 */
export function directoryFilterValueOf<Row>(
  def: AnyDirectoryFilterDef<Row>,
  raw: string,
): DirectoryFilterValue {
  switch (directoryFilterKindOf(def)) {
    case 'toggle':
      return raw === DIRECTORY_ALL ? DIRECTORY_ALL : raw === DIRECTORY_TOGGLE_ON;
    case 'multi':
      return raw === DIRECTORY_ALL || raw === '' ? [] : raw.split(',');
    case 'dateRange':
    case 'numberRange': {
      if (raw === DIRECTORY_ALL || raw === '') return {};
      const [from = '', to = ''] = raw.split(RANGE_SEPARATOR);
      return { from: from === '' ? undefined : from, to: to === '' ? undefined : to };
    }
    default:
      return raw;
  }
}

/**
 * The value -> the URL string. The reverse of `directoryFilterValueOf`: an
 * empty selection or a range with neither half serialises back to the
 * sentinel, so the URL lib's own elision rule stays the only one.
 */
export function directoryFilterParamOf<Row>(
  def: AnyDirectoryFilterDef<Row>,
  value: DirectoryFilterValue,
): string {
  switch (directoryFilterKindOf(def)) {
    case 'toggle':
      return value === true ? DIRECTORY_TOGGLE_ON : DIRECTORY_ALL;
    case 'multi': {
      if (!Array.isArray(value) || value.length === 0) return DIRECTORY_ALL;
      const allowed = new Set((def.options ?? []).map((option) => option.value));
      const picked = value.filter((entry) => allowed.has(entry));
      return picked.length === 0 ? DIRECTORY_ALL : picked.join(',');
    }
    case 'dateRange':
    case 'numberRange': {
      const range = directoryFilterRangeOf(value);
      const from = range.from !== '' ? range.from : undefined;
      const to = range.to !== '' ? range.to : undefined;
      if (from === undefined && to === undefined) return DIRECTORY_ALL;
      return `${from ?? ''}${RANGE_SEPARATOR}${to ?? ''}`;
    }
    default:
      return typeof value === 'string' ? value : DIRECTORY_ALL;
  }
}
