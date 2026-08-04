/**
 * Regression guard for the `form.reset()` / `control._fields` sweep.
 *
 * RHF 7.81.0 `reset(values)` runs with `keepFieldsRef` falsy, which executes
 * `_fields = {}` (dist/index.esm.mjs:2643-2652). Its `onChange` opens with
 * `const field = get(_fields, name); if (field) {...}` (index.esm.mjs:2103), so
 * after that wipe every keystroke on a `register()`-ed control is silently
 * dropped. With `reactCompiler: true` a memoised `register(name)` never re-runs,
 * so only a REMOUNT (which re-fires register's own `ref` callback,
 * index.esm.mjs:2450-2453) heals it.
 *
 * OpsOnboardSchoolDialog is the one reachable `register()`-ed form in the app
 * that calls `reset()` while its `useForm` instance is still alive
 * (useOnboardSchoolForm: `close(false)` and the post-success path both reset).
 * Its DialogContent unmounts on close, so it heals — this test pins that, and
 * fails loudly if the dialog is ever changed to stay mounted.
 */
import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import {
  cleanupSchool,
  createProspectSchool,
  detailPath,
  type FixtureSchool,
} from './helpers/ops-onboarding';
import { schoolContact } from './helpers/ops-onboarding-db';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const t = (key: string) => cat(en, `Ops.onboard.${key}`);

test.describe.configure({ mode: 'serial' });

let school: FixtureSchool;
const STAMP = Date.now();
const EMAIL = `ops-resetsweep-${STAMP}@example.au`;

test.beforeAll(async () => {
  school = await createProspectSchool(`resetsweep-${STAMP}`);
});

test.afterAll(async () => {
  await cleanupSchool(school.documentId);
});

test('ops onboard dialog: typing AFTER a form.reset() still reaches the API', async ({ page }) => {
  await loginAs(page, 'ops');
  await page.goto(detailPath(school.documentId));

  // Pass 1 — fill, then CANCEL: `close(false)` runs form.reset(DEFAULT_VALUES).
  await page.getByRole('button', { name: t('button'), exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel(t('firstName')).fill('Discarded');
  await dialog.getByLabel(t('lastName')).fill('Discarded');
  await dialog.getByLabel(t('email')).fill('discarded@example.au');
  await dialog.getByRole('button', { name: t('cancel'), exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  // Pass 2 — reopen and type again. These are the keystrokes a wiped `_fields`
  // would swallow: the submit would then carry the blank reset values.
  await page.getByRole('button', { name: t('button'), exact: true }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel(t('firstName'))).toHaveValue('');
  await dialog.getByLabel(t('firstName')).fill('Grace');
  await dialog.getByLabel(t('lastName')).fill('Hopper');
  await dialog.getByLabel(t('email')).fill(EMAIL);

  const post = page.waitForResponse(
    (r) => r.url().includes('/onboarding-link') && r.request().method() === 'POST',
  );
  await dialog.getByRole('button', { name: t('submit'), exact: true }).click();
  const res = await post;
  expect(res.request().postDataJSON()).toEqual({
    first_name: 'Grace',
    last_name: 'Hopper',
    contact_email: EMAIL,
  });
  expect(res.status()).toBe(201);

  // ...and it is REAL: the contact the second pass typed is on the school row.
  expect(schoolContact(school.documentId)).toBe(`Grace|Hopper|${EMAIL}`);
});
