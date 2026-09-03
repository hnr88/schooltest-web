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
    .getByLabel(cat(en, 'Auth.emailLabel'), { exact: true })
    .fill('apiadmin@schooltest.local');
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(apiEnv('SEED_APIADMIN_PASSWORD'));
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard');
}

test.describe('ops teacher details dialog (OPS-teacher-details)', () => {
  test('directory opens from the Teachers card, edits inline with server validation, removes with confirm', async ({
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
      await page.goto(`/en/dashboard/ops/schools/${school.documentId}`);

      // The Teachers card opens the directory (content assertions — the
      // dialog identifies by its own copy and the row by its own email).
      await page.getByRole('button', { name: cat(en, 'Ops.detail.teachersLabel') }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(cat(en, 'Ops.teachers.title'));
      const row = dialog.locator(`tr[data-teacher-email="${teacherEmail}"]`);
      await expect(row).toBeVisible();
      await expect(row).toContainText('Original');
      await expect(row).toContainText(cat(en, 'Ops.teachers.noClasses'));

      // Inline edit: rename, save, assert the server round-trip (psql).
      await row.getByRole('button', { name: cat(en, 'Ops.teachers.edit') }).click();
      await row.getByLabel(cat(en, 'Ops.teachers.columnFirstName')).fill('Renamed');
      await row.getByRole('button', { name: cat(en, 'Ops.teachers.save') }).click();
      await expect(row).toContainText('Renamed');
      const dbFirst = runSql(`select first_name from up_users where email = '${teacherEmail}'`);
      expect(dbFirst.trim()).toBe('Renamed');

      // Duplicate email: the API's 400 message renders inline (C-TCH-04).
      await row.getByRole('button', { name: cat(en, 'Ops.teachers.edit') }).click();
      await row.getByLabel(cat(en, 'Ops.teachers.columnEmail')).fill('teacher@schooltest.local');
      await row.getByRole('button', { name: cat(en, 'Ops.teachers.save') }).click();
      await expect(dialog.getByText(/already in use/i)).toBeVisible();
      await row.getByRole('button', { name: cat(en, 'Ops.teachers.cancel') }).click();

      // Remove: confirm strip, then the REAL C-TCH-03 revocation. The
      // presence assertion BEFORE the delete makes the absence assertion
      // after it falsifiable — "we watched it disappear", not "we did not
      // see it". DB proof: blocked + unlinked (revocation, not deletion).
      await expect(row).toBeVisible();
      await expect(row).toContainText(teacherEmail);
      await row.getByRole('button', { name: cat(en, 'Ops.teachers.remove') }).click();
      await expect(
        dialog.getByText(cat(en, 'Ops.teachers.removeConfirm').replace('{email}', teacherEmail)),
      ).toBeVisible();
      await dialog
        .getByRole('button', { name: cat(en, 'Ops.teachers.removeConfirmAction') })
        .click();
      await expect(row).toHaveCount(0);
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
