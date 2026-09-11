import { expect, test, type Locator } from '@playwright/test';

import { runSql } from '../helpers/auth-db';
import { cat, loadMessages } from '../helpers/i18n';
import { ACCOUNTS, signIn, signInTeacher } from '../helpers/teacher-rail';

// Teacher Portal v2 S31 — the "Review submission" drawer against the REAL API
// and database, with no request intercepted: sign in as the seeded teacher,
// open one of their reading results' report, open the drawer, check its tally
// against Postgres, then write an overall comment, save it, prove it persisted,
// reopen and see it, and clear it again so the seed is left as found.

const en = loadMessages('en');
const copy = (key: string) => cat(en, `TeacherPortal.review.${key}`);
const READING = cat(en, 'Report.skills.reading');
const PROOF_DIR = 'tests/e2e/proofs/teacher-v2';

test.use({ viewport: { width: 1440, height: 900 } });
// The shared dev server recompiles under other agents' edits; a sign-in plus
// two report loads can outlast the default 30s without anything being wrong.
test.describe.configure({ timeout: 120_000 });

interface ReadingResult {
  documentId: string;
  correct: number;
  total: number;
  unreached: number;
  studentName: string;
  className: string;
}

/** Waits for the drawer's slide-in to finish so a capture shows it at rest. */
async function atRest(drawer: Locator): Promise<void> {
  await drawer.evaluate((element) =>
    Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
  );
}

/**
 * The teacher's uncommented reading result with the most not-reached rows,
 * then the most rows — real volume, with the row kind the design never drew.
 */
function readingResult(): ReadingResult {
  const row = runSql(
    `select r.document_id,
            count(*) filter (where x.is_correct),
            count(*),
            count(*) filter (where x.not_reached),
            concat_ws(' ', s.given_name, s.family_name),
            coalesce(c.name, '')
       from results r
       join results_student_lnk rs on rs.result_id = r.id
       join students s on s.id = rs.student_id
       join students_teacher_lnk tl on tl.student_id = s.id
       join up_users u on u.id = tl.user_id
       left join students_class_lnk sc on sc.student_id = s.id
       left join classes c on c.id = sc.class_id
       join responses x on x.session_document_id = r.session_document_id
      where u.email = '${ACCOUNTS.teacher.email}'
        and r.skill = 'reading'
        and r.destination = 'official'
        and r.teacher_comment is null
      group by r.document_id, r.created_at, s.given_name, s.family_name, c.name
      order by count(*) filter (where x.not_reached) desc, count(*) desc, r.created_at desc
      limit 1`,
  );
  const [documentId, correct, total, unreached, studentName, className] = row.split('\n')[0].split('|');
  if (!documentId) throw new Error(`[e2e] no reviewable reading result for ${ACCOUNTS.teacher.email}: ${row}`);
  return {
    documentId,
    correct: Number(correct),
    total: Number(total),
    unreached: Number(unreached),
    studentName,
    className,
  };
}

interface ExtendedResult {
  documentId: string;
  teacherEmail: string;
  extended: number;
  total: number;
  firstText: string;
}

/** The newest official result whose sitting holds a provider-scored answer, with its teacher. */
function extendedResult(): ExtendedResult {
  const row = runSql(
    `select r.document_id, u.email,
            count(*) filter (where i.correct_key->>'type' = 'provider_scored'),
            count(*)
       from results r
       join results_student_lnk rs on rs.result_id = r.id
       join students s on s.id = rs.student_id
       join students_teacher_lnk tl on tl.student_id = s.id
       join up_users u on u.id = tl.user_id
       join responses x on x.session_document_id = r.session_document_id
       left join responses_item_lnk l on l.response_id = x.id
       left join items i on i.id = l.item_id
      where r.destination = 'official'
      group by r.document_id, u.email, r.created_at
     having count(*) filter (where i.correct_key->>'type' = 'provider_scored') > 0
      order by r.created_at desc
      limit 1`,
  );
  const [documentId, teacherEmail, extended, total] = row.split('\n')[0].split('|');
  if (!documentId || !teacherEmail) throw new Error(`[e2e] no result with a provider-scored answer: ${row}`);
  const firstText = runSql(
    `select x.raw_response->>'text'
       from responses x
       join responses_item_lnk l on l.response_id = x.id
       join items i on i.id = l.item_id
      where x.session_document_id = (select session_document_id from results where document_id = '${documentId}')
        and i.correct_key->>'type' = 'provider_scored'
      order by x.sequence_index
      limit 1`,
  );
  return { documentId, teacherEmail, extended: Number(extended), total: Number(total), firstText };
}

const storedComment = (documentId: string): string =>
  runSql(`select coalesce(teacher_comment, '<null>') from results where document_id = '${documentId}'`);

test('review drawer — opens over the report, shows the served review, and saves a comment that persists', async ({ page }) => {
  const result = readingResult();
  await signIn(page, 'teacher');
  await page.goto(`/dashboard/reports/${result.documentId}`);
  await expect(page.locator('[data-surface="teacher-report"]')).toBeVisible();

  const open = page.getByRole('button', { name: copy('title'), exact: true });
  await open.click();
  const drawer = page.locator('[data-surface="result-review"]');
  await expect(drawer).toBeVisible();

  // The header, tally and rows, checked against Postgres rather than against themselves.
  await expect(drawer.locator('[data-slot="sheet-title"]')).toHaveText(result.studentName);
  if (result.className) {
    await expect(drawer.locator('[data-slot="review-header"]')).toContainText(`${READING} · ${result.className}`);
  }
  await expect(drawer.locator('[data-slot="review-strip"]')).toContainText(
    `${result.correct} of ${result.total} correct`,
  );
  await expect(drawer.locator('[data-slot="review-question-row"]')).toHaveCount(result.total);
  await expect(drawer.locator('[data-slot="review-question-row"][data-unreached="true"]')).toHaveCount(
    result.unreached,
  );
  await expect(drawer.getByText(copy('questionsEyebrow'), { exact: true })).toBeVisible();
  await expect(drawer.locator('[data-slot="review-note-summary"]')).toHaveText('No comments yet');
  await atRest(drawer);
  await page.screenshot({ path: `${PROOF_DIR}/review-drawer.png` });

  const comment = `Reads closely under time pressure (e2e ${Date.now()})`;
  const field = drawer.getByLabel(copy('commentTitle'), { exact: true });
  await field.fill(comment);
  await expect(drawer.locator('[data-slot="review-note-summary"]')).toHaveText('1 comment written');
  await drawer.getByRole('button', { name: copy('saveComments'), exact: true }).click();
  await expect(
    page.getByText(`Saved 1 comment on ${result.studentName}’s ${READING} submission`, { exact: true }),
  ).toBeVisible();
  await expect(drawer).toBeHidden();
  expect(storedComment(result.documentId)).toBe(comment);

  await open.click();
  await expect(drawer.getByLabel(copy('commentTitle'), { exact: true })).toHaveValue(comment);
  await expect(drawer.locator('[data-slot="review-note-summary"]')).toHaveText('1 comment written');
  await atRest(drawer);
  await page.screenshot({ path: `${PROOF_DIR}/review-drawer-reopened.png` });

  // Leave the seed as found: an emptied comment is saved as null.
  await drawer.getByLabel(copy('commentTitle'), { exact: true }).fill('');
  await drawer.getByRole('button', { name: copy('saveComments'), exact: true }).click();
  await expect(drawer).toBeHidden();
  expect(storedComment(result.documentId)).toBe('<null>');
});

test('review drawer — a provider-scored answer is an Extended response card awaiting the teacher’s mark', async ({ page }) => {
  const result = extendedResult();
  await signInTeacher(page, result.teacherEmail);
  await page.goto(`/dashboard/reports/${result.documentId}`);
  await expect(page.locator('[data-surface="teacher-report"]')).toBeVisible();

  await page.getByRole('button', { name: copy('title'), exact: true }).click();
  const drawer = page.locator('[data-surface="result-review"]');
  const cards = drawer.locator('[data-slot="review-assist"]');
  await expect(cards).toHaveCount(result.extended);
  await expect(cards.first().locator('[data-slot="review-mark-state"]')).toHaveText(copy('stateAwaiting'));
  await expect(cards.first().locator('[data-slot="review-answer"]')).toHaveText(result.firstText);
  // No marking assist was served, so no rubric, scale or suggestion is shown.
  await expect(drawer.locator('[data-slot="review-criteria"]')).toHaveCount(0);
  await expect(drawer.locator('[data-slot="review-mark"]')).toHaveCount(0);
  await expect(drawer.locator('[data-slot="review-question-row"]')).toHaveCount(result.total - result.extended);
  await atRest(drawer);
  await page.screenshot({ path: `${PROOF_DIR}/review-drawer-extended.png` });
});
