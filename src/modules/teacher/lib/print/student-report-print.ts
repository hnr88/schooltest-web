import { STUDENT_REPORT_PRINT_CSS } from '@/modules/teacher/constants/class-summary-print.constants';
import { GROWTH_STEADY_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { escapeHtml, tile } from '@/modules/teacher/lib/print/class-summary-print';
import { formatDelta } from '@/modules/teacher/lib/teacher-kit';
import type {
  StudentReportInput,
  StudentReportLabels,
} from '@/modules/teacher/types/class-summary-print.types';
import type { CarerLine } from '@/modules/teacher/types/v2-family.types';
import type { SubskillCard } from '@/modules/teacher/types/v2-student-detail.types';
import type { GrowthView, ScoredSkill, ViewTone } from '@/modules/teacher/types/v2-view-common.types';

/**
 * The student reading report behind the Students tab's PDF button (design
 * `printStudentReport`, l.2247), on the class report's print helpers. Every
 * value comes from `studentDetail()` / `carerReport()` over the student's
 * `GET /api/results/:id`; a missing value prints the dash, never a number.
 * Every interpolated string is escaped.
 */

function percent(value: number | null, labels: StudentReportLabels): string {
  return value === null ? labels.noValue : `${value}%`;
}

function growthValue(growth: GrowthView, labels: StudentReportLabels): string {
  if (growth.kind === 'steady') return labels.viewModel(GROWTH_STEADY_KEY);
  return growth.points === null ? labels.noValue : labels.points(formatDelta(growth.points, 'signed').text);
}

function skillValue(skill: ScoredSkill | null, labels: StudentReportLabels): string {
  return skill === null ? labels.noValue : `${labels.viewModel(skill.labelKey)} · ${skill.score}%`;
}

function chip(label: string, tone: ViewTone): string {
  return `<span class="band" style="background:${escapeHtml(tone.bg)};color:${escapeHtml(tone.fg)}">${escapeHtml(label)}</span>`;
}

function subskillRow(card: SubskillCard, labels: StudentReportLabels): string {
  const state = card.band ?? card.gate;
  const cell = state === null ? escapeHtml(labels.noValue) : chip(labels.viewModel(state.labelKey), state.tone);
  return (
    `<tr><td>${escapeHtml(labels.viewModel(card.labelKey))}</td>` +
    `<td class="num">${escapeHtml(percent(card.score, labels))}</td><td>${cell}</td></tr>`
  );
}

function lineList(kind: 'canDo' | 'next', lines: readonly CarerLine[], labels: StudentReportLabels): string {
  const items = lines.length === 0 ? [labels.noValue] : lines.map((line) => labels.viewModel(line.key));
  return (
    `<h2>${escapeHtml(labels[kind])}</h2><ul class="lines" data-list="${kind}">` +
    `${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
  );
}

export function buildStudentReportHtml(input: StudentReportInput, labels: StudentReportLabels): string {
  const { detail, carer } = input;
  const { strongest, weakest, vocab } = detail.analysis;
  const focus = weakest !== null && weakest.skill !== strongest?.skill ? weakest : null;
  const sub = [input.className, labels.assessment, input.date].filter((part) => part !== '').join(' · ');
  const phase = detail.phase === null ? labels.noValue : labels.viewModel(detail.phase.labelKey);
  const note =
    carer.ealdNoteKey === null ? '' : `<div class="note">${escapeHtml(labels.viewModel(carer.ealdNoteKey))}</div>`;

  return [
    `<!doctype html><html lang="${escapeHtml(input.lang)}"><head><meta charset="utf-8">`,
    `<title>${escapeHtml(labels.title)}</title><style>${STUDENT_REPORT_PRINT_CSS}</style></head><body><div class="wrap">`,
    `<div class="head"><div><h1>${escapeHtml(input.name)}</h1><div class="sub">${escapeHtml(sub)}</div></div>`,
    `<div class="brand">${escapeHtml(labels.brand)}</div></div>`,
    '<div class="kpis">',
    tile('kpi', labels.overall, percent(detail.overall.score, labels)),
    tile('kpi', labels.phase, phase),
    tile('kpi', labels.growth, growthValue(detail.overall.growth, labels)),
    '</div>',
    `<h2>${escapeHtml(labels.subskills)}</h2><table><thead><tr><th>${escapeHtml(labels.subskill)}</th>`,
    `<th>${escapeHtml(labels.score)}</th><th>${escapeHtml(labels.band)}</th></tr></thead><tbody>`,
    detail.subskills.map((card) => subskillRow(card, labels)).join(''),
    `</tbody></table><h2>${escapeHtml(labels.focus)}</h2><div class="two">`,
    tile('box', labels.strength, skillValue(strongest, labels)),
    tile('box', labels.focusArea, skillValue(focus, labels)),
    `</div><h2>${escapeHtml(labels.vocabulary)}</h2><div class="two">`,
    tile('box', labels.everyday, percent(vocab.a2, labels)),
    tile('box', labels.academic, percent(vocab.b1, labels)),
    '</div>',
    lineList('canDo', carer.canDo, labels),
    lineList('next', carer.next, labels),
    note,
    `<div class="foot">${escapeHtml(labels.footer)}</div></div></body></html>`,
  ].join('');
}
