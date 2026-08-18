import { expect, test } from '@playwright/test';

// Lane J (headline: kill the fake RegisterFormCard): the landing "register
// your interest" form must POST to the real public endpoint and persist a real
// Postgres row. No mocks — the browser submission goes through the running web
// app into the running Strapi; persistence is proven in-test by the endpoint's
// dedup contract (deduped:true is ONLY returned when the earlier submission is
// found as a persisted row), plus an operator-run read-only psql SELECT
// recorded in the .codephant task record.

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';

interface SubmitResponse {
  data: { received: boolean; documentId: string; deduped: boolean };
}

test('landing register form persists a real pilot registration and survives reload', async ({
  page,
  request,
}) => {
  const runId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const email = `lanej-e2e-${runId}@schooltest.local`;
  const name = `E2E Registrant ${runId}`;
  const school = `E2E Pilot School ${runId}`;

  await page.goto('/en/eald');
  await page.locator('#register').scrollIntoViewIfNeeded();

  // Fill and submit the real form on the real page.
  await page.getByPlaceholder('Jane Smith').fill(name);
  await page.getByPlaceholder('School name').fill(school);
  await page.getByLabel('Your role').selectOption({ label: 'Head of department' });
  await page.getByPlaceholder('name@school.edu.au').fill(email);
  await page.getByLabel('Number of EAL/D students').selectOption({ label: '21–50' });
  await page.getByRole('button', { name: 'Register interest' }).click();

  // The success card renders only after the mutation resolved — a real HTTP
  // round-trip, not the old fake onValid that fired on any valid submit.
  await expect(page.getByText('Thanks for your interest')).toBeVisible();

  // Reload the page, then prove the earlier submission is persisted: the
  // endpoint dedupes against the stored row, and deduped:true can only be
  // returned for a row that exists in Postgres.
  await page.reload();
  const repeat = await request.post(`${API}/api/pilot-registrations/submit`, {
    data: {
      name,
      school,
      role: 'Head of department',
      email,
      students: '21–50',
    },
  });
  expect(repeat.status()).toBe(200);
  const repeatBody = (await repeat.json()) as SubmitResponse;
  expect(repeatBody.data.received).toBe(true);
  expect(repeatBody.data.deduped).toBe(true);
  expect(repeatBody.data.documentId).toBeTruthy();

  // Validation is real too: a malformed body is a 400, never a silent success.
  const invalid = await request.post(`${API}/api/pilot-registrations/submit`, {
    data: { name: 'X', school: '', role: '', email: 'not-an-email', students: '' },
  });
  expect(invalid.status()).toBe(400);
});
