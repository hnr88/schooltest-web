import { expect, test, type APIRequestContext } from '@playwright/test';

// Task 18 (C-ONB-01/02/03): guest school-onboarding wizard. Mints a real
// onboarding link through the ops API, then drives the wizard in the browser:
// step saves (C-ONB-02), localStorage restore on reload, completion
// (C-ONB-03 -> JWT stored) and the used-link screen afterwards.

import { roleCredentials } from './helpers/credentials';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
const OPS = roleCredentials('ops');

async function mintOnboardingLink(request: APIRequestContext, runId: string) {
  const login = await request.post(`${API}/api/auth/local`, {
    data: { identifier: OPS.email, password: OPS.password },
  });
  expect(login.ok()).toBeTruthy();
  const { jwt } = (await login.json()) as { jwt: string };
  const auth = { Authorization: `Bearer ${jwt}` };

  const school = await request.post(`${API}/api/schools`, {
    headers: auth,
    data: {
      name: `Playwright Test School ${runId}`,
      suburb: 'Belmore',
      state: 'NSW',
      postcode: '2192',
      sector: 'government',
      contact_email: `ops-${runId}@example.au`,
    },
  });
  expect(school.status()).toBe(201);
  const schoolBody = (await school.json()) as { data: { documentId: string } };

  // C-SCH-04 (v2), mission st-ops-onboarding: the ops Onboard School action now
  // takes the primary admin contact's first and last name alongside the email,
  // and mints a link with no expiry.
  const link = await request.post(
    `${API}/api/schools/${schoolBody.data.documentId}/onboarding-link`,
    {
      headers: auth,
      data: {
        first_name: 'Ops',
        last_name: 'Fixture',
        contact_email: `ops-${runId}@example.au`,
      },
    },
  );
  expect(link.status()).toBe(201);
  const linkBody = (await link.json()) as { data: { token: string } };
  return { token: linkBody.data.token, runId };
}

test.describe('school onboarding wizard (task 18)', () => {
  test('completes the wizard, restores progress on reload, stores the JWT', async ({
    page,
    request,
  }) => {
    const runId = `${Date.now()}`;
    const { token } = await mintOnboardingLink(request, runId);
    const teacherEmail = `teacher-${runId}@example.au`;
    const adminEmail = `admin-${runId}@example.au`;

    const progressSaves: number[] = [];
    page.on('request', (req) => {
      if (req.method() === 'PUT' && req.url().includes('/api/school-onboarding/')) {
        progressSaves.push((req.postDataJSON() as { current_step: number }).current_step);
      }
    });

    await page.goto(`/en/school-onboarding/${token}`);

    // Step 1: school details, prefilled from the ops-entered school record.
    await expect(
      page.getByRole('heading', { name: 'Confirm your school details' }),
    ).toBeVisible();
    await expect(page.getByLabel('School name')).toHaveValue(
      `Playwright Test School ${runId}`,
    );
    await page.getByLabel('Suburb').fill('Campsie');
    await page.getByLabel('State or territory').click();
    await page.getByRole('option', { name: 'NSW' }).click();
    await page.getByLabel('Postcode').fill('2194');
    await page.getByLabel('Sector').click();
    await page.getByRole('option', { name: 'Government', exact: true }).click();
    await page.getByRole('button', { name: 'Save and continue' }).click();

    // Step 2: add one teacher.
    await expect(page.getByRole('heading', { name: 'Add your teachers' })).toBeVisible();
    await page.getByRole('button', { name: 'Add another teacher' }).click();
    await page.getByLabel('First name').fill('Sarah');
    await page.getByLabel('Last name').fill('Nguyen');
    await page.getByLabel('Email address').fill(teacherEmail);
    await page.getByRole('button', { name: 'Save and continue' }).click();

    // Step 3: review renders the payload read-only.
    await expect(page.getByRole('heading', { name: 'Review and confirm' })).toBeVisible();
    await expect(page.getByText('Campsie')).toBeVisible();
    await expect(page.getByText(teacherEmail)).toBeVisible();

    // C-ONB-02 fired once per completed step (school, teachers).
    expect(progressSaves).toEqual([1, 2]);

    // Reload mid-wizard: localStorage state restores the current step.
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      `school-onboarding.${token}`,
    );
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored as string)).toMatchObject({ state: { step: 2 } });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Review and confirm' })).toBeVisible();

    // Step 4: create the administrator account (weak password blocked first).
    await page.getByRole('button', { name: 'Confirm and continue' }).click();
    await expect(
      page.getByRole('heading', { name: 'Create your administrator account' }),
    ).toBeVisible();
    await page.getByLabel('First name').fill('Michael');
    await page.getByLabel('Last name').fill('Chen');
    await page.getByLabel('Email address').fill(adminEmail);
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Create account and finish' }).click();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    await page.getByLabel('Password').fill('CorrectPass2026!');
    await page.getByRole('button', { name: 'Create account and finish' }).click();

    // C-ONB-03 success: JWT stored, wizard store cleared, navigation away.
    await page.waitForFunction(
      () => window.localStorage.getItem('app.auth.token') !== null,
    );
    await expect(page).toHaveURL(/\/dashboard/);
    const cleared = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      `school-onboarding.${token}`,
    );
    expect(cleared).toBeNull();

    // The link is now used: a fresh visit renders the used screen.
    await page.goto(`/en/school-onboarding/${token}`);
    await expect(
      page.getByRole('heading', { name: 'This onboarding link has already been used' }),
    ).toBeVisible();
  });

  test('renders the invalid-link screen for a bogus token', async ({ page }) => {
    await page.goto('/en/school-onboarding/definitely-not-a-real-token');
    await expect(
      page.getByRole('heading', { name: 'This onboarding link is not valid' }),
    ).toBeVisible();
  });
});
