import { afterEach, describe, expect, test, vi } from 'vitest';

import en from '@/i18n/messages/en.json';
import { classRosterResponseSchema } from '@/modules/results';
import classResults from '@/modules/teacher/lib/__fixtures__/class-results.t2.json';
import t2Dashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.t2.json';
import { summariseClassResults } from '@/modules/teacher/lib/print/class-summary';
import {
  buildClassSummaryHtml,
  escapeHtml,
  writeClassSummaryWindow,
} from '@/modules/teacher/lib/print/class-summary-print';
import type { ClassSummaryLabels } from '@/modules/teacher/types/class-summary-print.types';

// Fixtures: GET /api/my/students/results?class=<id> and GET /api/teacher/dashboard
// recorded from the live API (:5500) as t2@schooltest.local on 2026-09-11.
const rows = classRosterResponseSchema.parse(classResults);
const className = t2Dashboard.classes[0]?.name ?? '';
const print = en.TeacherPortal.classes.print;
const SKILLS: Record<string, string> = {
  Decoding: en.Results.skillDecoding,
  Vocabulary: en.Results.skillVocabulary,
  Grammar: en.Results.skillGrammar,
  Gist: en.Results.skillGist,
  Detail: en.Results.skillDetail,
  Inference: en.Results.skillInference,
  Critical: en.Results.skillCritical,
};
const labels: ClassSummaryLabels = {
  ...print,
  title: print.title.replace('{name}', className),
  footer: print.footer.replace('{name}', className).replace('{date}', '11 September 2026'),
  noValue: en.TeacherPortal.kit.noValue,
  secureOf: (secure, assessed) =>
    print.secureOf.replace('{secure}', String(secure)).replace('{assessed}', String(assessed)),
  skill: (skill) => SKILLS[skill] ?? skill,
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('summariseClassResults over the recorded roster', () => {
  const summary = summariseClassResults(rows);
  const scores = rows
    .map((row) => row.result?.overall.domain_score ?? null)
    .filter((score): score is number => score !== null);

  test('scored, total and the class mean come from the roster', () => {
    expect(summary.total).toBe(rows.length);
    expect(summary.scored).toBe(scores.length);
    expect(summary.mean).toBe(Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length));
    expect(summary.subskills.length).toBeGreaterThan(0);
    expect(summary.gap?.mean ?? 0).toBeLessThanOrEqual(summary.strength?.mean ?? Number.POSITIVE_INFINITY);
  });

  test('growth counts only rows with a served delta and reliability flag', () => {
    const judged = rows.filter(
      (row) => row.result !== null && row.result.overall.delta !== null && row.result.overall.delta_reliable !== null,
    );
    expect(summary.improved + summary.held + summary.slipped).toBe(judged.length);
  });
});

describe('buildClassSummaryHtml', () => {
  const summary = summariseClassResults(rows);
  const html = buildClassSummaryHtml(
    { className, yearLabel: 'Years 7–9', date: '11 September 2026', lang: 'en', summary },
    labels,
  );

  test('prints the class, its KPIs and one row per subskill, with no script', () => {
    expect(html).toContain(`<h1>${escapeHtml(className)}</h1>`);
    expect(html).toContain(`${summary.scored} / ${summary.total}`);
    expect(html).toContain(`<title>${escapeHtml(labels.title)}</title>`);
    expect(html.match(/<tr>/g)).toHaveLength(summary.subskills.length + 1);
    expect(html).toContain('lang="en"');
    expect(html).not.toContain('<script');
  });

  test('escapes interpolated text', () => {
    expect(escapeHtml(`<b>"x" & 'y'`)).toBe('&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;');
  });

  test('writes the page into the opened window and prints it', async () => {
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const target = frame.contentWindow;
    expect(target).not.toBeNull();
    if (target === null) return;
    const printSpy = vi.spyOn(target, 'print').mockImplementation(() => undefined);
    vi.spyOn(target, 'focus').mockImplementation(() => undefined);
    writeClassSummaryWindow(target, html);
    expect(target.document.title).toBe(labels.title);
    expect(target.document.querySelector('h1')?.textContent).toBe(className);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
