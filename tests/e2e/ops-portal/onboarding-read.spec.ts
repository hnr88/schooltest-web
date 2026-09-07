/**
 * C-OPS-PORTAL-011 (OPS-021) — the ops school-detail read end to end against the
 * real stack. The wire shape is asserted with the SHARED
 * `onboardingReadResponseSchema` the server projects and the client parses, and
 * every wait is bounded (Playwright waits forever on a hidden element).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import {
  ONBOARDING_READ_KEYS,
  OPS_PORTAL_VERSION,
  OPS_PORTAL_VERSION_HEADER,
  containsLinkMaterial,
  isLegacyOnboardingState,
  onboardingReadPath,
  onboardingReadResponseSchema,
} from '@schooltest/ops-contracts';

import {
  MOBILE_VIEWPORT,
  REFERENCE_CLOCK_ISO,
  REFERENCE_DEVICE_SCALE_FACTOR,
  REFERENCE_VIEWPORT,
} from '@/modules/ops/hooks/use-visual-reference';
import { cat, loadMessages } from '../helpers/i18n';
import {
  cleanupSchool,
  createProspectSchool,
  detailPath,
  inviteViaApi,
  opsJwt,
} from '../helpers/ops-onboarding';
import { loginAs } from '../helpers/roles';

const API =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';
const MISSION = 'msn-ab5a6a54-f385-42e1-826a-aeba2bbdbc66';
const OUT = path.resolve(__dirname, `../../../../.codephant/missions/${MISSION}/captures`);
const WAIT = 15_000;
const en = loadMessages('en');
/** en.json is merge-only here, so the panel's new label keys land with the
 *  integrator; next-intl renders its `Namespace.key` fallback until then. */
function copy(key: string): string {
  return en[`Ops.onboard.${key}`] ?? `Ops.onboard.${key}`;
}

async function readViaApi(documentId: string): Promise<{ status: number; body: unknown }> {
  const headers = {
    Authorization: `Bearer ${await opsJwt()}`,
    [OPS_PORTAL_VERSION_HEADER]: OPS_PORTAL_VERSION,
  };
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(`${API}${onboardingReadPath(documentId)}`, { headers });
    // The per-IP limiter is a shared-stack neighbour, not this contract: ride it out.
    if (res.status !== 429 || attempt >= 5) return { status: res.status, body: await res.json() };
    await new Promise((resolve) => setTimeout(resolve, 3500));
  }
}

async function capture(page: Page, name: string): Promise<void> {
  await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
  await mkdir(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `021-${name}.png`), fullPage: false });
}

const contactRow = (page: Page) => page.locator('[data-slot="ops-invitation-contact"]');
test.use({ viewport: REFERENCE_VIEWPORT, deviceScaleFactor: REFERENCE_DEVICE_SCALE_FACTOR });
test.describe.configure({ mode: 'serial' });
// 20 logins/min/IP on a shared stack: a neighbour can 429 the first login.
test.beforeAll(async () => {
  test.setTimeout(150_000);
  for (let attempt = 0; ; attempt += 1) {
    try {
      await opsJwt();
      return;
    } catch (error) {
      if (attempt >= 9) throw error;
      await new Promise((resolve) => setTimeout(resolve, 12_000));
    }
  }
});

test('the panel shows the stored primary contact and the link_sent eligibility', async ({
  page,
}) => {
  const label = `web-read-${Date.now()}`;
  const school = await createProspectSchool(label);
  const person = { first_name: 'Ada', last_name: 'Lovelace', contact_email: `${label}@example.au` };
  try {
    expect((await inviteViaApi(school.documentId, person)).status).toBe(201);
    // Six keys, the narrowed enums, no link material, still legacy-valid.
    const api = await readViaApi(school.documentId);
    expect(api.status).toBe(200);
    const data = (api.body as { data: Record<string, unknown> }).data;
    expect(Object.keys(data).sort()).toEqual([...ONBOARDING_READ_KEYS]);
    expect(onboardingReadResponseSchema.parse(api.body).data.onboarding_status).toBe('link_sent');
    expect(isLegacyOnboardingState(data)).toBe(true);
    expect(containsLinkMaterial(api.body)).toBe(false);
    await loginAs(page, 'ops');
    await page.goto(detailPath(school.documentId));

    const row = contactRow(page);
    await expect(row).toBeVisible({ timeout: WAIT });
    await expect(row).toHaveAttribute('data-account-status', 'invited', { timeout: WAIT });
    await expect(row).toHaveAttribute('data-onboarding-status', 'link_sent', { timeout: WAIT });
    await expect(row.getByText(copy('primaryContact'), { exact: true })).toBeVisible();
    await expect(row.getByText(copy('contactEmail'), { exact: true })).toBeVisible();
    await expect(page.locator('[data-field="primary-contact"]')).toHaveText('Ada Lovelace');
    await expect(page.locator('[data-field="contact-email"]')).toHaveText(person.contact_email);
    // Eligibility: link_sent offers Resend and Revoke, never a second invite.
    const sent = page.locator('[data-slot="ops-onboard-actions"][data-invitation="sent"]');
    await expect(sent).toBeVisible({ timeout: WAIT });
    await expect(sent.getByRole('button', { name: cat(en, 'Ops.onboard.resend') })).toBeEnabled();
    await expect(sent.getByRole('button', { name: cat(en, 'Ops.onboard.revoke') })).toBeEnabled();
    await expect(page.getByRole('button', { name: cat(en, 'Ops.onboard.button') })).toHaveCount(0);
    await capture(page, 'link-sent-desktop');
    await page.setViewportSize(MOBILE_VIEWPORT);
    await expect(row).toBeVisible({ timeout: WAIT });
    await capture(page, 'link-sent-mobile');
  } finally {
    await cleanupSchool(school.documentId);
  }
});

test('revoking through the UI invalidates the read and the new state survives reload', async ({
  page,
}) => {
  const label = `web-revoke-${Date.now()}`;
  const school = await createProspectSchool(label);
  const person = { first_name: 'Grace', last_name: 'Hopper', contact_email: `${label}@example.au` };
  try {
    expect((await inviteViaApi(school.documentId, person)).status).toBe(201);
    await loginAs(page, 'ops');
    await page.goto(detailPath(school.documentId));
    const sent = page.locator('[data-slot="ops-onboard-actions"][data-invitation="sent"]');
    await expect(sent).toBeVisible({ timeout: WAIT });
    await sent
      .getByRole('button', { name: cat(en, 'Ops.onboard.revoke') })
      .click({ timeout: WAIT });

    // The revoke mutation invalidates this query, so the panel must flip without
    // a reload — and the contact must survive, so ops can re-invite.
    await expect(sent).toHaveCount(0, { timeout: WAIT });
    await expect(contactRow(page)).toHaveAttribute('data-onboarding-status', 'not_started', {
      timeout: WAIT,
    });
    await expect(page.locator('[data-field="contact-email"]')).toHaveText(person.contact_email);
    await expect(page.getByRole('button', { name: cat(en, 'Ops.onboard.button') })).toBeVisible();
    // Re-read through an authorized API request, then prove it survives reload.
    const api = await readViaApi(school.documentId);
    const state = onboardingReadResponseSchema.parse(api.body).data;
    expect(state.account_status).toBe('prospect');
    expect(state.onboarding_status).toBe('not_started');
    expect(state.contact_email).toBe(person.contact_email);
    await page.reload();
    await expect(contactRow(page)).toHaveAttribute('data-onboarding-status', 'not_started', {
      timeout: WAIT,
    });
  } finally {
    await cleanupSchool(school.documentId);
  }
});

test('an absent contact renders as absent, and a failed read offers a retry', async ({ page }) => {
  const school = await createProspectSchool(`web-nocontact-${Date.now()}`);
  try {
    const state = onboardingReadResponseSchema.parse(
      (await readViaApi(school.documentId)).body,
    ).data;
    expect(state.contact_first_name).toBeNull();
    expect(state.contact_last_name).toBeNull();
    await loginAs(page, 'ops');
    await page.goto(detailPath(school.documentId));
    await expect(contactRow(page)).toBeVisible({ timeout: WAIT });
    await expect(page.locator('[data-field="primary-contact"]')).toHaveText(copy('contactMissing'));
    await expect(page.locator('[data-field="contact-email"]')).toHaveText(
      state.contact_email ?? '',
    );
    await capture(page, 'no-contact-desktop');

    // Transport failure only — the stack stays real; this branch cannot be driven.
    await page.route('**/onboarding-invitation', (route) => route.abort('failed'));
    await page.reload();
    await expect(page.getByText(cat(en, 'Ops.onboard.loadError'), { exact: true })).toBeVisible({
      timeout: WAIT,
    });
    await expect(page.getByRole('button', { name: cat(en, 'Ops.onboard.retry') })).toBeVisible();
    await expect(contactRow(page)).toHaveCount(0);
    await capture(page, 'read-error-desktop');

    // With the failure lifted, the same control recovers the real state.
    await page.unroute('**/onboarding-invitation');
    await page.getByRole('button', { name: cat(en, 'Ops.onboard.retry') }).click({ timeout: WAIT });
    await expect(contactRow(page)).toBeVisible({ timeout: WAIT });
  } finally {
    await cleanupSchool(school.documentId);
  }
});
