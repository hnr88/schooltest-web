import { scoredCount, type RosterRow } from '@/modules/results';

import { studentsTabRow } from '@/modules/teacher/lib/v2/students-tab';
import type { ReportsView } from '@/modules/teacher/types/v2-family.types';

/**
 * The design's day-first date ("31 August", `:1912` "sat 31 August"). `Intl` formats in the
 * reader's own locale — no locale is hard-coded — and the day and month swap ONLY where that
 * locale puts a NAMED month first and separates the two with plain punctuation ("September
 * 10" -> "10 September"). A locale that numbers its months keeps its own order, marker and
 * all (ko, zh); ms, th and vi already read day-first (P1 parity row 8).
 */
export function dayFirstDate(locale: string, iso: string, options: Intl.DateTimeFormatOptions): string {
  const parts = new Intl.DateTimeFormat(locale, options).formatToParts(new Date(iso));
  const month = parts.findIndex((part) => part.type === 'month');
  const day = parts.findIndex((part) => part.type === 'day');
  const values = parts.map((part) => part.value);
  if (month === -1 || day === -1 || day < month) return values.join('');
  const named = !/\p{Nd}/u.test(values[month]);
  const separated = parts.slice(month + 1, day).every((part) => part.type === 'literal' && /^[\s,.]*$/.test(part.value));
  if (!named || !separated) return values.join('');
  [values[month], values[day]] = [values[day], values[month]];
  return values.join('');
}

export function reportsView(roster: readonly RosterRow[]): ReportsView {
  const { scored, total } = scoredCount(roster);
  return { rows: roster.map(studentsTabRow), scored, total };
}
