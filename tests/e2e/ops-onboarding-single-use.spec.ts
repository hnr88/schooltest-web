/**
 * Mission st-ops-onboarding — E2E flow 29 (task 319): once the school admin has
 * completed onboarding the magic link is single-use and refused, in the API and
 * in the browser. Split out of `ops-onboarding-revoke.spec.ts` to keep both
 * files under the 200-line cap.
 */
import { expect, test } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';
import { cleanupSchool, createProspectSchool, inviteViaApi } from './helpers/ops-onboarding';
import { linkStatuses } from './helpers/ops-onboarding-db';

const en = loadMessages('en');

const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5500';

test('flow 29: once onboarding is completed the magic link is single-use and refused', async ({
  page,
  request,
}) => {
  const label = `single-use-${Date.now()}`;
  const target = await createProspectSchool(label);
  const adminEmail = `admin-${label}@example.au`;
  try {
    const invited = await inviteViaApi(target.documentId, {
      first_name: 'Ada',
      last_name: 'Lovelace',
      contact_email: `ops-single-${label}@example.au`,
    });
    expect(invited.status).toBe(201);
    const token = invited.body.data.token;

    // Live before it is used.
    expect((await request.get(`${API_BASE_URL}/api/school-onboarding/${token}`)).status()).toBe(200);

    // The school admin completes onboarding through the real C-ONB-03 contract.
    const completed = await request.post(
      `${API_BASE_URL}/api/school-onboarding/${token}/complete`,
      {
        data: {
          payload: { name: target.name, suburb: 'Belmore', state: 'NSW', postcode: '2192' },
          provenance: {},
          admin: {
            first_name: 'Ada',
            last_name: 'Lovelace',
            email: adminEmail,
            password: 'Sc4ffold!ngPw2026',
          },
          teachers: [],
        },
      },
    );
    expect(completed.status(), 'onboarding completes').toBe(200);
    expect(linkStatuses(target.documentId)).toEqual(['used']);

    // Single use: the same token is refused afterwards, in the API and the UI.
    const replayed = await request.get(`${API_BASE_URL}/api/school-onboarding/${token}`);
    expect(replayed.status(), 'a consumed link is Conflict').toBe(409);

    await page.goto(`/en/school-onboarding/${token}`);
    await expect(
      page.getByRole('heading', { name: cat(en, 'SchoolOnboarding.errors.usedTitle') }),
    ).toBeVisible();
  } finally {
    // Completing onboarding creates a real school_admin account, and C-OPSS-05
    // correctly refuses to delete a school that still holds one — so the
    // account goes first, through the real ops contract.
    await cleanupSchool(target.documentId, [adminEmail]);
  }
});
