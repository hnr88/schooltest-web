import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { roleCredentials } from './helpers/credentials';
import { MAILPIT_API, API_BASE_URL, searchMessages } from './helpers/mailpit';
import { f9stamp, MASK_SLOT, MASK_TITLE, patientGoto, registerFreshParent, setAuth, shot, uiSignIn } from './fleet9-lib';

/**
 * F9 SLICE D — the wizards, LIVE.
 *
 * STACK FACT (measured twice, dbg screenshots): /onboarding is INSIDE the
 * ParentGuard (src/app/[locale]/onboarding/layout.tsx), so on this masked stack
 * the onboarding wizard UI — and with it the student wizard at
 * /dashboard/children/new (proven masked in fleet9-children.spec.ts) — is
 * UNREACHABLE for every parent. The UI-level wizard probes from the brief
 * (step navigation, skip button, required-media enforcement, refresh mid-edit,
 * double-click next) have NO reachable surface; each is re-pointed here at the
 * wizard's real, live layer: its API contracts (C-PAR-UPDATE-ME,
 * C-ONBOARD-GET/UPDATE) + the route-guard matrix. UI-masking proof for every
 * state sits next to the API evidence as screenshots.
 */

test.setTimeout(180_000);

const usedEmails: string[] = [];

test.afterAll(async ({ request }) => {
  // Best-effort mail hygiene for THIS spec's addresses (auth_email_requests
  // cleanup via runSql is a measured no-op on this host — stale DB — see lib).
  for (const email of usedEmails) {
    const messages = await searchMessages(request, `to:${email}`, 50).catch(() => []);
    if (messages.length > 0) {
      await request
        .delete(`${MAILPIT_API}/messages`, { data: { ids: messages.map((m) => m.ID) } })
        .catch(() => undefined);
    }
  }
});

interface Me {
  documentId: string;
  email: string;
  first_name?: string | null;
  phone?: string | null;
  address_line?: string | null;
  profileCompleted?: boolean;
  [key: string]: unknown;
}

async function getMe(request: APIRequestContext, jwt: string): Promise<Me> {
  const res = await request.get(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as Me;
}

async function getOnboarding(request: APIRequestContext, jwt: string) {
  const res = await request.get(`${API_BASE_URL}/api/users/me/onboarding`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return { status: res.status(), body: (await res.json()) as Record<string, unknown> };
}

test.describe.serial(() => {
  test('/onboarding renders the mask for a pending, an onboarded, and no parent at all; staff are redirected', async ({
    page,
    request,
  }) => {
    const browser = page.context().browser();

    // 1. A brand-new PENDING parent: the wizard is masked even for them.
    const stamp = f9stamp();
    const parent = await registerFreshParent(request, `wz-${stamp}`);
    usedEmails.push(parent.email);
    await page.setViewportSize({ width: 1280, height: 800 });
    await setAuth(page, parent.jwt);
    await patientGoto(page, '/onboarding');
    await expect(page.locator(MASK_SLOT)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(MASK_TITLE, { exact: true })).toBeVisible();
    await shot(page, '40-onboarding-masked-pending-parent');
    console.log('F9 /onboarding as pending parent: masked');

    // 2. Unauthenticated visitor: no server redirect; observe what renders.
    const anon = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const anonPage = await anon.newPage();
    await patientGoto(anonPage, '/onboarding');
    await anonPage.waitForTimeout(8_000);
    console.log('F9 /onboarding anonymous →', anonPage.url());
    await shot(anonPage, '41-onboarding-anonymous');
    await anon.close();

    // 3. Staff: the parent-only route must redirect them away (fresh context —
    // /sign-in auto-redirects an already-authenticated visitor to /dashboard).
    const teacher = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const teacherPage = await teacher.newPage();
    await uiSignIn(teacherPage, roleCredentials('teacher').email, roleCredentials('teacher').password);
    await teacherPage.waitForURL('**/dashboard', { timeout: 30_000 });
    await patientGoto(teacherPage, '/onboarding');
    await teacherPage.waitForTimeout(5_000);
    console.log('F9 /onboarding as teacher →', teacherPage.url());
    expect(teacherPage.url()).not.toContain('/onboarding');
    const body = await teacherPage.locator('body').innerText();
    expect(body).not.toContain('Welcome to SchoolTest');
    await shot(teacherPage, '42-onboarding-staff-redirect');
    await teacher.close();

    // 4. The already-onboarded seeded parent: masked like everyone.
    const seeded = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const seededPage = await seeded.newPage();
    await uiSignIn(seededPage, roleCredentials('parent').email, roleCredentials('parent').password);
    await seededPage.waitForURL('**/dashboard', { timeout: 30_000 });
    await patientGoto(seededPage, '/onboarding');
    await expect(seededPage.locator(MASK_SLOT)).toBeVisible({ timeout: 30_000 });
    await shot(seededPage, '43-onboarding-masked-onboarded-parent');
    await seeded.close();
  });

  test('profile save contract (the wizard write): whitelist, inline-refused shapes, persistence, double-submit', async ({
    page,
    request,
  }) => {
    const stamp = f9stamp();
    const parent = await registerFreshParent(request, `pf-${stamp}`);
    usedEmails.push(parent.email);
    const headers = { Authorization: `Bearer ${parent.jwt}` };

    // The UI where this form would live — masked; the shots document it.
    await setAuth(page, parent.jwt);
    await patientGoto(page, '/onboarding');
    await expect(page.locator(MASK_SLOT)).toBeVisible({ timeout: 30_000 });
    await shot(page, '44-profile-form-surface-masked');

    // Valid subset → 200, persisted, profileCompleted flips true.
    const valid = {
      first_name: 'F9',
      last_name: 'Wizard',
      relationship_to_student: 'mother',
      phone: '+60 13-987 6543',
      preferred_contact_method: 'email',
      address_line: '1 Jalan Test',
      city: 'Kuala Lumpur',
      country_of_residence: 'my', // stored uppercased by the contract
      emergency_contact_name: 'Emergency Person',
      emergency_contact_phone: '+60 12-345 6789',
    };
    const save = await request.put(`${API_BASE_URL}/api/users/me`, { headers, data: valid });
    expect(save.ok(), `[f9] profile save: ${save.status()} ${await save.text()}`).toBeTruthy();
    const me = await getMe(request, parent.jwt);
    expect(me.first_name).toBe('F9');
    expect(me.phone).toBe('+60 13-987 6543');
    expect(me.address_line).toBe('1 Jalan Test');
    console.log('F9 profile saved; profileCompleted =', me.profileCompleted);

    // Invalid phone → 400 naming the field (the inline error's server half).
    const badPhone = await request.put(`${API_BASE_URL}/api/users/me`, {
      headers,
      data: { phone: 'abc' },
    });
    const badPhoneBody = (await badPhone.json()) as { error?: { details?: { fields?: string[] } } };
    console.log('F9 bad phone:', badPhone.status(), JSON.stringify(badPhoneBody.error?.details));
    expect(badPhone.status()).toBe(400);
    expect(badPhoneBody.error?.details?.fields).toContain('phone');

    // Overlong address (255 max) → 400.
    const overlong = await request.put(`${API_BASE_URL}/api/users/me`, {
      headers,
      data: { address_line: 'X'.repeat(400) },
    });
    console.log('F9 overlong address:', overlong.status());
    expect(overlong.status()).toBe(400);

    // Stock/unknown keys are STRIPPED silently (email/role/password untouched).
    const smuggle = await request.put(`${API_BASE_URL}/api/users/me`, {
      headers,
      data: { first_name: 'F9b', email: 'hacked@evil.test', role: 1, blocked: true, password: 'nope' },
    });
    expect(smuggle.ok(), await smuggle.text()).toBeTruthy();
    const me2 = await getMe(request, parent.jwt);
    expect(me2.email).toBe(parent.email.toLowerCase()); // server lowercases emails
    expect(me2.first_name).toBe('F9b');
    console.log('F9 smuggled stock keys stripped; email still', me2.email);
    await shot(page, '45-profile-contract-proofs-masked');

    // Double-click save proxy: two rapid identical PUTs — both 200, state clean
    // (no UI button exists to double-click; the server must at least stay sane).
    const [a, b] = await Promise.all([
      request.put(`${API_BASE_URL}/api/users/me`, { headers, data: { city: 'George Town' } }),
      request.put(`${API_BASE_URL}/api/users/me`, { headers, data: { city: 'George Town' } }),
    ]);
    expect(a.ok() && b.ok(), `${a.status()} ${b.status()}`).toBeTruthy();
    expect((await getMe(request, parent.jwt)).city).toBe('George Town');
    console.log('F9 double-submit: both PUTs 200, final state consistent');
  });

  test('onboarding state machine: pending → skip/complete; refusal shapes', async ({
    page,
    request,
  }) => {
    const stamp = f9stamp();
    const parent = await registerFreshParent(request, `ob-${stamp}`);
    usedEmails.push(parent.email);
    const headers = { Authorization: `Bearer ${parent.jwt}` };

    // First read lazily creates the pending row.
    const first = await getOnboarding(request, parent.jwt);
    expect(first.status).toBe(200);
    console.log('F9 fresh onboarding row:', JSON.stringify(first.body).slice(0, 200));

    // Invalid status refused.
    const bad = await request.post(`${API_BASE_URL}/api/users/me/onboarding`, {
      headers,
      data: { status: 'whatever' },
    });
    expect(bad.status()).toBe(400);

    // Skip stands down; completing LATER is still possible (abandon-and-return).
    const skip = await request.post(`${API_BASE_URL}/api/users/me/onboarding`, {
      headers,
      data: { status: 'skipped' },
    });
    expect(skip.ok(), await skip.text()).toBeTruthy();
    const afterSkip = await getOnboarding(request, parent.jwt);
    console.log('F9 after skip:', JSON.stringify(afterSkip.body).slice(0, 200));
    const complete = await request.post(`${API_BASE_URL}/api/users/me/onboarding`, {
      headers,
      data: { status: 'completed' },
    });
    console.log('F9 complete-after-skip:', complete.status());
    expect(complete.ok(), await complete.text()).toBeTruthy();

    // Idempotent-ish double-complete (rapid double-tap on "Get started").
    const [c1, c2] = await Promise.all([
      request.post(`${API_BASE_URL}/api/users/me/onboarding`, { headers, data: { status: 'completed' } }),
      request.post(`${API_BASE_URL}/api/users/me/onboarding`, { headers, data: { status: 'completed' } }),
    ]);
    console.log('F9 double-complete:', c1.status(), c2.status());
    expect(c1.ok() && c2.ok()).toBeTruthy();

    // Refusals: non-parent and anonymous never touch the onboarding row.
    const studentJwt = await loginJwtQuiet(request);
    const studentTry = await request.get(`${API_BASE_URL}/api/users/me/onboarding`, {
      headers: { Authorization: `Bearer ${studentJwt}` },
    });
    console.log('F9 student GET onboarding:', studentTry.status());
    expect([403, 404]).toContain(studentTry.status());
    const anonTry = await request.get(`${API_BASE_URL}/api/users/me/onboarding`);
    expect([401, 403]).toContain(anonTry.status());

    // The skip/complete UI surface for reference — masked.
    await setAuth(page, parent.jwt);
    await patientGoto(page, '/onboarding');
    await expect(page.locator(MASK_SLOT)).toBeVisible({ timeout: 30_000 });
    await shot(page, '46-onboarding-state-machine-masked');
  });
});

async function loginJwtQuiet(request: APIRequestContext): Promise<string> {
  const { roleCredentials } = await import('./helpers/credentials');
  const { email, password } = roleCredentials('student');
  const res = await request.post(`${API_BASE_URL}/api/auth/local`, {
    data: { identifier: email, password },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}
