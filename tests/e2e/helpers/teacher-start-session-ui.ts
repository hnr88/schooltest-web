import { expect, type Page } from '@playwright/test';

import { createTestSessionResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import type { CreateTestSessionResponse } from '@/modules/teacher/types/teacher-session.types';

import { cat, type Messages } from './i18n';
import { navLink } from './teacher-rail';

// Flow 4's first half, driven through the REAL UI: the teacher walks the rail to
// Test sessions, picks a class and a test, and presses "Generate join code".
// That press is a real POST /api/teacher/test-sessions (C-TS-1) against the
// running Strapi, and THAT response — strict-parsed through the shipped Zod
// mirror — is what this returns.
//
// Waiting for the POST is not incidental. The code panel renders C-TD-1's
// `live_session`, so between the click and the refetch it still shows the
// PREVIOUS open sitting: reading the panel alone once yielded an older sitting's
// id and code, and every downstream assertion compared that ghost with itself.

const SETUP = 'Teacher.testSessions.setup';

async function pick(page: Page, fieldId: string, option: string): Promise<void> {
  await page.locator(`#${fieldId}`).click();
  await page.getByRole('option', { name: option, exact: true }).click();
  await expect(page.locator(`#${fieldId}`)).toContainText(option);
}

/** Opens a session for `className` running `testLabel`; returns C-TS-1's own 201. */
export async function startSessionViaUi(
  page: Page,
  messages: Messages,
  className: string,
  testLabel: string,
): Promise<CreateTestSessionResponse> {
  await navLink(page, cat(messages, 'Shell.nav.testSessions')).click();
  await page.waitForURL('**/dashboard/test-sessions');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    cat(messages, 'Teacher.testSessions.title'),
  );

  await pick(page, 'test-session-class', className);
  await pick(page, 'test-session-test', testLabel);

  const posted = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname === '/api/teacher/test-sessions',
  );
  await page.getByRole('button', { name: cat(messages, `${SETUP}.submit`), exact: true }).click();
  const response = await posted;
  expect(response.status(), 'POST /api/teacher/test-sessions').toBe(201);
  const created = createTestSessionResponseSchema.parse(await response.json());
  expect(created.class.name, 'C-TS-1 opened a session on the wrong class').toBe(className);

  // The panel must catch up to the sitting the server just minted — not keep
  // showing the previous one.
  const panel = page.locator('[data-slot="join-code-panel"]');
  await expect(panel).toHaveAttribute('data-sitting-id', created.sitting_document_id);
  await expect(panel).toHaveAttribute('data-join-code', created.code);
  await expect(panel.getByText(created.code, { exact: true })).toBeVisible();
  return created;
}
