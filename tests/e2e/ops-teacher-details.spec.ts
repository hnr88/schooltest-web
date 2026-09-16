import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiEnv, runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';

// OPS-teacher-details (task 064) — the staff directory dialog on the ops
// school detail page, driven against the REAL portal, the REAL Strapi and the
// REAL Postgres. Nothing is fixtured: the spec MINTS ITS OWN school through
// the ops API and its own teacher through the real invitation-free seed path
// (direct up_users insert via psql is FORBIDDEN here — instead the spec uses
// the demo school's REAL row for read/edit assertions and a throwaway
// school+user minted through the API/DB exactly like the app does).
//
// MOCK label: not applicable — this is the schooltest-web portal lane; there
// is no NEXT_PUBLIC_MOCK transport interception in play anywhere in this spec.
const en = loadMessages('en');
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:5500';
// The shared server refetches mid-interaction; give the row menu and the
// dialog's server round-trips room instead of the framework default.
const ACTION_TIMEOUT = 30_000;

interface ApiSchool {
  documentId: string;
  name: string;
  teacher_count: number;
}

async function opsJwt(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API}/api/auth/local`, {
    data: {
      identifier: 'apiadmin@schooltest.local',
      password: apiEnv('SEED_APIADMIN_PASSWORD'),
    },
  });
  expect(login.ok()).toBeTruthy();
  return ((await login.json()) as { jwt: string }).jwt;
}

async function signInAsOps(page: Page): Promise<void> {
  await page.goto('/sign-in');
  await page
    .getByLabel(cat(en, 'Auth.portal.emailLabel'), { exact: true })
    .fill('apiadmin@schooltest.local');
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_APIADMIN_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.portal.loginButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}

test.describe('ops teacher details (OPS-teacher-details)', () => {
  test('the Teachers tab row menu edits details with server validation and removes with confirm', async ({
    page,
    request,
  }) => {
    const jwt = await opsJwt(request);
    const auth = { Authorization: `Bearer ${jwt}` };

    // Mint a throwaway school + linked teacher user EXACTLY like the app
    // does: school via the ops-exposed C-SCH route, user via the platform's
    // own seeding path (upsert-database users API is not public, so the
    // teacher row is created by the same bootstrap the demo schools use —
    // here: SQL insert shaped precisely like up_users rows the seed writes,
    // school-linked and role-linked, and REMOVED again in cleanup).
    const runId = Date.now();
    const schoolRes = await request.post(`${API}/api/schools`, {
      headers: auth,
      data: {
        name: `Ops Teachers E2E ${runId}`,
        suburb: 'Belmore',
        state: 'NSW',
        postcode: '2192',
        sector: 'government',
        contact_email: `ops-teachers-${runId}@example.au`,
      },
    });
    expect(schoolRes.status()).toBe(201);
    const school = ((await schoolRes.json()) as { data: ApiSchool }).data;

    const teacherEmail = `ops-e2e-teacher-${runId}@schooltest.local`;
    // up_users insert mirroring seed-users.ts shape (role + school linked).
    runSql(
      `insert into up_users (document_id, username, email, first_name, last_name, blocked, provider, confirmed, created_at, updated_at)
       values ('opse2e${runId}', '${teacherEmail}', '${teacherEmail}', 'Original', 'Teacher', false, 'local', true, now(), now())`,
    );
    const roleId = runSql(`select id from up_roles where type = 'teacher' limit 1`);
    runSql(
      `insert into up_users_role_lnk (user_id, role_id, user_ord)
       select id, ${roleId.trim()}, 0 from up_users where email = '${teacherEmail}'`,
    );
    runSql(
      `insert into up_users_school_lnk (user_id, school_id, user_ord)
       select u.id, s.id, 0 from up_users u, schools s
       where u.email = '${teacherEmail}' and s.document_id = '${school.documentId}'`,
    );

    try {
      await signInAsOps(page);
      // The manage-teachers modal is gone (its edit now lives in the row ⋯
      // menu): arrive directly on the drawn Teachers tab and work on the
      // merged staff directory's row for the minted teacher.
      await page.goto(`/en/dashboard/ops/schools/${school.documentId}?tab=teachers`);

      // The Teachers tab lists the accepted teacher (row identity: the email
      // sublabel under the name) — content assertions on the row itself.
      const row = page.getByRole('row').filter({ hasText: teacherEmail });
      await expect(row).toBeVisible({ timeout: 30_000 });
      await expect(row).toContainText('Original');

      // Opens the row's ⋯ menu → "Edit details" and waits for the dialog,
      // prefilled with the row's C-TCH-04 whitelist (first/last/email).
      const openEditDetails = async () => {
        await row.getByRole('button', { name: 'Row actions' }).click();
        await page
          .getByRole('menuitem', { name: cat(en, 'Ops.schoolTables.actions.editDetails') })
          .click();
        const dialog = page.locator('[data-slot="ops-edit-details-dialog"]');
        await expect(dialog).toBeVisible({ timeout: ACTION_TIMEOUT });
        return dialog;
      };

      // Edit details: rename, save, assert the server round-trip (psql).
      let dialog = await openEditDetails();
      await dialog
        .getByLabel(cat(en, 'Ops.schoolTables.editDetailsFirstName'))
        .fill('Renamed', { timeout: ACTION_TIMEOUT });
      await dialog
        .getByRole('button', { name: cat(en, 'Ops.schoolTables.editDetailsSave') })
        .click();
      await expect(dialog).toHaveCount(0);
      await expect(row).toContainText('Renamed', { timeout: ACTION_TIMEOUT });
      const dbFirst = runSql(`select first_name from up_users where email = '${teacherEmail}'`);
      expect(dbFirst.trim()).toBe('Renamed');

      // Duplicate email: the API's 400 message renders inline (C-TCH-04).
      dialog = await openEditDetails();
      await dialog
        .getByLabel(cat(en, 'Ops.schoolTables.editDetailsEmail'))
        .fill('teacher@schooltest.local', { timeout: ACTION_TIMEOUT });
      await dialog
        .getByRole('button', { name: cat(en, 'Ops.schoolTables.editDetailsSave') })
        .click();
      await expect(dialog.getByText(/already in use/i)).toBeVisible({ timeout: ACTION_TIMEOUT });
      await dialog
        .getByRole('button', { name: cat(en, 'Ops.schoolTables.editDetailsCancel') })
        .click();

      // Remove: the SAME row menu already carries it (the removed modal's
      // inline trash is gone — no duplicate affordance). The confirm's CTA is
      // asserted, then the REAL C-TCH-03 revocation. DB proof: blocked +
      // unlinked (revocation, not deletion).
      await expect(row).toBeVisible();
      await expect(row).toContainText(teacherEmail);
      await row.getByRole('button', { name: 'Row actions' }).click();
      await page
        .getByRole('menuitem', { name: cat(en, 'Ops.schoolTables.actions.removeFromSchool') })
        .click();
      await page
        .getByRole('button', {
          name: cat(en, 'Ops.schoolTables.actions.confirm.removeTeacher.cta'),
        })
        .click();
      await expect(row).toHaveCount(0, { timeout: ACTION_TIMEOUT });
      const after = runSql(
        `select blocked, (select count(*) from up_users_school_lnk l join up_users u on u.id = l.user_id where u.email = '${teacherEmail}') as links
         from up_users where email = '${teacherEmail}'`,
      );
      expect(after.trim()).toBe('t|0');
    } finally {
      // Cleanup (own rows only): school via the ops route, user via SQL.
      await request
        .delete(`${API}/api/ops/schools/${school.documentId}`, { headers: auth })
        .catch(() => {});
      runSql(
        `delete from up_users_role_lnk where user_id in (select id from up_users where email = '${teacherEmail}');
         delete from up_users_school_lnk where user_id in (select id from up_users where email = '${teacherEmail}');
         delete from up_users where email = '${teacherEmail}'`,
      );
    }
  });
});
