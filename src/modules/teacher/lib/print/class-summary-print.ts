import { CLASS_SUMMARY_PRINT_CSS } from '@/modules/teacher/constants/class-summary-print.constants';
import type {
  ClassSkillMean,
  ClassSummaryInput,
  ClassSummaryLabels,
} from '@/modules/teacher/types/class-summary-print.types';

/**
 * The class reading report behind the Classes list's PDF button (design
 * `printClassReport`, l.2072): printable HTML written into a window the click
 * opened, then the browser's print dialog (Save as PDF). Every interpolated
 * string is escaped.
 */

const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

function tile(kind: 'kpi' | 'box', label: string, value: string): string {
  return `<div class="${kind}"><div class="l">${escapeHtml(label)}</div><div class="v">${escapeHtml(value)}</div></div>`;
}

export function buildClassSummaryHtml(input: ClassSummaryInput, labels: ClassSummaryLabels): string {
  const { summary } = input;
  const pct = (value: number | null) => (value === null ? labels.noValue : `${value}%`);
  const skillMean = (entry: ClassSkillMean | null) =>
    entry === null ? labels.noValue : `${labels.skill(entry.skill)} · ${entry.mean}%`;
  const sub = [input.yearLabel, labels.assessment, input.date]
    .filter((part): part is string => part !== null && part !== '')
    .join(' · ');
  const rows = summary.subskills
    .map(
      (entry) =>
        `<tr><td>${escapeHtml(labels.skill(entry.skill))}</td><td class="num">${entry.mean}%</td>` +
        `<td class="num">${escapeHtml(entry.secure === null ? labels.noValue : labels.secureOf(entry.secure, entry.assessed))}</td></tr>`,
    )
    .join('');

  return [
    `<!doctype html><html lang="${escapeHtml(input.lang)}"><head><meta charset="utf-8">`,
    `<title>${escapeHtml(labels.title)}</title><style>${CLASS_SUMMARY_PRINT_CSS}</style></head><body><div class="wrap">`,
    `<div class="head"><div><h1>${escapeHtml(input.className)}</h1><div class="sub">${escapeHtml(sub)}</div></div>`,
    `<div class="brand">${escapeHtml(labels.brand)}</div></div>`,
    '<div class="kpis">',
    tile('kpi', labels.meanReading, pct(summary.mean)),
    tile('kpi', labels.students, `${summary.scored} / ${summary.total}`),
    tile('kpi', labels.growth, `${summary.improved}↑`),
    '</div>',
    `<h2>${escapeHtml(labels.subskillProfile)}</h2><table><thead><tr><th>${escapeHtml(labels.subskill)}</th>`,
    `<th>${escapeHtml(labels.mean)}</th><th>${escapeHtml(labels.atSecure)}</th></tr></thead><tbody>${rows}</tbody></table>`,
    `<h2>${escapeHtml(labels.focus)}</h2><div class="two">`,
    tile('box', labels.strength, skillMean(summary.strength)),
    tile('box', labels.gap, skillMean(summary.gap)),
    `</div><h2>${escapeHtml(labels.growthSince)}</h2><div class="two">`,
    tile('box', labels.improved, String(summary.improved)),
    tile('box', labels.held, String(summary.held)),
    tile('box', labels.slipped, String(summary.slipped)),
    `</div><h2>${escapeHtml(labels.vocabulary)}</h2><div class="two">`,
    tile('box', labels.everyday, pct(summary.vocab.a2)),
    tile('box', labels.academic, pct(summary.vocab.b1)),
    `</div><div class="foot">${escapeHtml(labels.footer)}</div></div></body></html>`,
  ].join('');
}

/**
 * Writes the report into the window the click opened (synchronously in the
 * click, so no pop-up blocker fires) and opens its print dialog.
 */
export function writeClassSummaryWindow(target: Window, html: string): void {
  target.document.open();
  target.document.write(html);
  target.document.close();
  target.focus();
  target.setTimeout(() => target.print(), 250);
}
