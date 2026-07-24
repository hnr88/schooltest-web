import { expect, type APIRequestContext, type Page, test } from '@playwright/test';

import { deleteAuthEmailRows } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { deleteStudents } from './helpers/student-cleanup';
import { loginParentJwt, registerAndConfirmParent, skipOnboarding } from './helpers/throwaway-parent';
import { watchErrors } from './helpers/ui';
import {
  attachWizardPhoto,
  attachWizardVoice,
  fillEducationStep,
  fillGuardianStep,
  fillPersonalStep,
  gotoNewChildWizard,
  wizardContinue,
  wizardRail,
} from './helpers/wizard-fill';

// Task 005 evidence — the wizard's media uploads are MANDATORY. Driven through
// the REAL wizard on :3110 with a throwaway parent JWT; uploads hit the real
// C-UPLOAD-PARENT POST /api/upload, submits hit the real C-STUDENT-CREATE
// POST /api/students. The two mission-mandated blocked flows are pinned
// individually: (1) photo attached but NO audio → the voice_intro gate blocks
// the step-4 Continue; (2) audio attached but NO photo → the photo gate blocks.
// Each test then attaches the missing file, submits for real, and proves the
// created student survives a page reload on /dashboard/children (cleaned up
// afterwards through the admin route — these run under a throwaway parent, so
// the seeded roster is never touched).
const en = loadMessages('en');
const usedEmails: string[] = [];

test.describe.configure({ mode: 'serial' });

async function authAndGoto(page: Page, request: APIRequestContext) {
  const parent = await registerAndConfirmParent(request, 'required-media');
  usedEmails.push(parent.email);
  const jwt = await loginParentJwt(request, parent);
  // Fresh parents start onboarding-pending; the dashboard guard would redirect
  // /dashboard/* to /onboarding, so resolve it through the real endpoint first.
  await skipOnboarding(request, jwt);
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, jwt);
}

/** Counts real POST /api/students attempts (submit must never fire while gated). */
function countStudentPosts(page: Page): () => number {
  let count = 0;
  page.on('request', (req) => {
    if (req.method() === 'POST' && /\/api\/students(\?|$)/.test(req.url())) count += 1;
  });
  return () => count;
}

/** Walk steps 1–3 validly and land on step 4 (photo dropzone visible). */
async function fillToMediaStep(page: Page, givenName: string) {
  await gotoNewChildWizard(page);
  await fillPersonalStep(page, en, { givenName });
  await wizardContinue(page, en);
  await fillEducationStep(page, en);
  await wizardContinue(page, en);
  await fillGuardianStep(page, en);
  await wizardContinue(page, en);
  await expect(page.getByText(cat(en, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();
}

/** Submit from the review step; returns the created student's documentId. */
async function submitAndCapture(page: Page): Promise<string> {
  await expect(
    page.getByRole('heading', { name: cat(en, 'StudentWizard.steps.review.title') }),
  ).toBeVisible();
  const createResponse = page.waitForResponse(
    (res) => res.url().includes('/api/students') && res.request().method() === 'POST',
  );
  await page
    .getByRole('button', { name: cat(en, 'StudentWizard.createStudent'), exact: true })
    .click();
  const created = await createResponse;
  expect(created.status(), await created.text()).toBe(200);
  const body = (await created.json()) as { data: { documentId: string } };
  return body.data.documentId;
}

test('no uploads → both media errors block; photo only → audio gate blocks; both → persists after reload', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  const unique = `Media-${Date.now().toString(36)}`;
  const created: string[] = [];
  try {
    await authAndGoto(page, request);
    const studentPosts = countStudentPosts(page);
    await fillToMediaStep(page, unique);

    // NEITHER upload attached → the step-4 Continue is blocked with BOTH
    // required errors under their dropzones, the review step stays locked on
    // the rail, and NO POST /api/students ever fires.
    await wizardContinue(page, en);
    await expect(page.locator('#wizard-photo-error')).toHaveText(
      cat(en, 'StudentWizardSchema.photoRequired'),
    );
    await expect(page.locator('#wizard-voice-intro-error')).toHaveText(
      cat(en, 'StudentWizardSchema.voiceIntroRequired'),
    );
    await expect(wizardRail(page, en).getByRole('button').nth(4)).toBeDisabled();
    await expect(page.getByText(cat(en, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();
    expect(studentPosts()).toBe(0);

    // Mission flow "without required audio upload": photo attached, voice
    // missing → the photo error clears, the voice_intro error still blocks,
    // and still no submit.
    await attachWizardPhoto(page, en);
    await wizardContinue(page, en);
    await expect(page.locator('#wizard-photo-error')).toHaveCount(0);
    await expect(page.locator('#wizard-voice-intro-error')).toHaveText(
      cat(en, 'StudentWizardSchema.voiceIntroRequired'),
    );
    await expect(
      page.getByText(cat(en, 'StudentWizard.media.voice.dropTitle'), { exact: true }),
    ).toBeVisible();
    expect(studentPosts()).toBe(0);

    // Both attached → review → real submit succeeds → lands on
    // /dashboard/children, and the new child survives a page reload.
    await attachWizardVoice(page, en);
    await wizardContinue(page, en);
    created.push(await submitAndCapture(page));
    expect(studentPosts()).toBe(1);

    await page.waitForURL('**/dashboard/children');
    await expect(page.getByRole('heading', { name: cat(en, 'Children.heading') })).toBeVisible();
    await expect(page.getByText(unique)).toBeVisible();
    await page.reload();
    await expect(page.getByText(unique)).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  } finally {
    await deleteStudents(request, created);
  }
});

test('audio only → photo gate blocks submission; photo attached → create succeeds', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  const unique = `Photo-${Date.now().toString(36)}`;
  const created: string[] = [];
  try {
    await authAndGoto(page, request);
    const studentPosts = countStudentPosts(page);
    await fillToMediaStep(page, unique);

    // Mission flow "without required photo upload": voice attached, photo
    // missing → the voice error stays clear, the photo error blocks the
    // Continue, the review step stays locked, and no submit fires.
    await attachWizardVoice(page, en);
    await wizardContinue(page, en);
    await expect(page.locator('#wizard-voice-intro-error')).toHaveCount(0);
    await expect(page.locator('#wizard-photo-error')).toHaveText(
      cat(en, 'StudentWizardSchema.photoRequired'),
    );
    await expect(wizardRail(page, en).getByRole('button').nth(4)).toBeDisabled();
    await expect(page.getByText(cat(en, 'StudentWizard.media.photo.dropTitle'))).toBeVisible();
    expect(studentPosts()).toBe(0);

    // Photo attached → the gate opens, review submits for real.
    await attachWizardPhoto(page, en);
    await wizardContinue(page, en);
    created.push(await submitAndCapture(page));
    expect(studentPosts()).toBe(1);
    await page.waitForURL('**/dashboard/children');
    await expect(page.getByText(unique)).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  } finally {
    await deleteStudents(request, created);
  }
});

test.afterAll(() => {
  for (const email of usedEmails) {
    deleteAuthEmailRows(email);
  }
});
