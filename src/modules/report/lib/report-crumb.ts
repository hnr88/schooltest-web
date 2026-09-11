import type { ResultView } from '@/modules/report/schemas/result-view.schema';

// The record crumb NAMES the report: its skill and publish date, the two cells
// that identify the row in the C-11 list. Never the display label — that is a
// finding, and a pending one put "Not derived yet" into the trail. Report rows
// carry no student name by design (PII stays off this surface).
export function reportCrumbLabel(
  view: Pick<ResultView, 'skill' | 'published_at'>,
  skillLabel: (skill: ResultView['skill']) => string,
  formatDate: (iso: string) => string,
): string {
  const skill = skillLabel(view.skill);
  return view.published_at === null ? skill : `${skill} · ${formatDate(view.published_at)}`;
}
