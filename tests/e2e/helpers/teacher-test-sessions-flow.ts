import { expect, type Locator, type Page } from '@playwright/test';

import { runSql } from './auth-db';

// Task 052 — the probes behind brief flows 5-8, split out of
// teacher-test-sessions.spec.ts for the 200-line file rule. Two of them read the
// REAL Postgres (the roster a grid must cover, and C-SJ-1's promised session
// row); two read the REAL painted DOM. Nothing here fixtures a value.

/** The active roster of a class, straight out of Postgres — the tile count to beat. */
export function rosterSize(classDocumentId: string): number {
  return Number(
    runSql(
      `select count(*) from students s
         join students_class_lnk scl on scl.student_id = s.id
         join classes c on c.id = scl.class_id
        where c.document_id = '${classDocumentId}' and s.status = 'active'`,
    ),
  );
}

export interface SittingSessionRow {
  documentId: string;
  status: string;
  started_at: string;
}

/** C-SJ-1's promised persistence: the session row LINKED to this sitting. */
export function sessionRow(
  sittingDocumentId: string,
  studentDocumentId: string,
): SittingSessionRow {
  const [documentId = '', status = '', startedAt = ''] = runSql(
    `select s.document_id, s.status, coalesce(s.started_at::text, '') from sessions s
       join sittings_sessions_lnk l on l.session_id = s.id
       join sittings si on si.id = l.sitting_id
      where si.document_id = '${sittingDocumentId}'
        and s.student_document_id = '${studentDocumentId}'`,
  )
    .trim()
    .split('|');
  return { documentId, status, started_at: startedAt };
}

/**
 * The labels one Base UI select really offers, in DOM order; leaves it closed.
 *
 * Scoped to the popup THIS trigger controls (`aria-controls`, set only while
 * `aria-expanded=true`) rather than a page-wide `option` query: measured on the
 * running app, a dismissed Base UI popup stays in the DOM carrying `data-closed`
 * AND its options, so a page-wide read of the second select returned the FIRST
 * select's list — the class names came back where the test labels were expected.
 */
export async function optionLabels(page: Page, fieldId: string): Promise<string[]> {
  const trigger = page.locator(`#${fieldId}`);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const listId = await trigger.getAttribute('aria-controls');
  if (listId === null) throw new Error(`#${fieldId} opened without aria-controls`);
  const options = page.locator(`#${listId} [role="option"]`);
  await expect(options.first()).toBeVisible();
  const labels = await options.allInnerTexts();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  return labels.map((label) => label.trim());
}

export interface PanelInk {
  code: number;
  family: string;
  largestOther: number;
}

/**
 * Flow 6's "prominently": the COMPUTED type size of the element whose whole text
 * is the code, against the largest other text in the same panel. Measured on the
 * painted page — never inferred from a class name.
 */
export async function panelInk(panel: Locator, code: string): Promise<PanelInk> {
  return panel.evaluate((root, wanted) => {
    const nodes = Array.from(root.querySelectorAll('h2, p, span, button, a'));
    const size = (el: Element) => Number.parseFloat(window.getComputedStyle(el).fontSize);
    const codeEl = nodes.find((el) => (el.textContent ?? '').trim() === wanted);
    const others = nodes.filter((el) => el !== codeEl && (el.textContent ?? '').trim().length > 0);
    return {
      code: codeEl ? size(codeEl) : 0,
      family: codeEl ? window.getComputedStyle(codeEl).fontFamily : '',
      largestOther: Math.max(0, ...others.map(size)),
    };
  }, code);
}
