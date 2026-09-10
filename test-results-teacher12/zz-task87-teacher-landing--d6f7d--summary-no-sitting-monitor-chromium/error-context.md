# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-task87-teacher-landing.spec.ts >> task 87: teacher landing dashboard vs live C-TEACH-01 >> teacher opens the populated dashboard: diagnostic summary + no-sitting monitor
- Location: tests/e2e/zz-task87-teacher-landing.spec.ts:86:7

# Error details

```
Error: expect(received).not.toBeNull()

Received: null
```

# Test source

```ts
  1   | import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
  2   | 
  3   | import { fetchWithRetry, loginCached } from './helpers/http';
  4   | import { cat, icu, loadMessages } from './helpers/i18n';
  5   | import { fixtureClassId } from './helpers/fixture-class';
  6   | import { fixtureTeacherCredentials, roleCredentials } from './helpers/credentials';
  7   | 
  8   | // Task 87 (st-mvp-pivot) targeted live check — NOT part of the suite.
  9   | // Teacher landing dashboard (C-TEACH-01, mvp-updates §4.9): sign-in lands the
  10  | // teacher on a populated dashboard, each class card shows its diagnostic and
  11  | // monitor summaries (populated or in the contract empty state), and the
  12  | // roster / test day / results links navigate. The guard test asserts the
  13  | // anonymous bounce to /sign-in. D-16: TeacherGuard is teacher-only, so
  14  | // school_admin never appears on this surface — the empty-state class is
  15  | // created for verify21 instead (the task 75 setup/cleanup pattern).
  16  | const en = loadMessages('en');
  17  | 
  18  | const API = 'http://127.0.0.1:5500';
  19  | const TEACHER = fixtureTeacherCredentials();
  20  | const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
  21  | const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
  22  | const CLASS_NAME = 'EAL/D Year 7 - Room 4';
  23  | 
  24  | async function login(
  25  |   request: APIRequestContext,
  26  |   credentials: { email: string; password: string },
  27  | ): Promise<string> {
  28  |   return loginCached(request, API, credentials);
  29  | }
  30  | 
  31  | async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  32  |   await page.goto('/sign-in');
  33  |   await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  34  |   await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(credentials.password);
  35  |   await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  36  |   // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  37  |   // late role redirect can never hijack the goto that follows. The axios
  38  |   // layer rides out any 429 on the auth POST, so allow for that here.
  39  |   await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
  40  |   // The primary teacher landing is the newer dashboard; C-TEACH-01 remains a
  41  |   // linked legacy surface and is opened explicitly for this contract check.
  42  |   await page.goto('/en/dashboard/teach');
  43  | }
  44  | 
  45  | interface TeachHomeClassPayload {
  46  |   documentId: string;
  47  |   name: string;
  48  |   diagnostic: {
  49  |     sat_count: number;
  50  |     roster_count: number;
  51  |     latest_form: string | null;
  52  |     mastered_pct: number;
  53  |   } | null;
  54  |   monitor: {
  55  |     not_joined: number;
  56  |     joined: number;
  57  |     in_progress: number;
  58  |     submitted: number;
  59  |     stalled: number;
  60  |   } | null;
  61  | }
  62  | 
  63  | async function fetchTeachHome(
  64  |   request: APIRequestContext,
  65  |   jwt: string,
  66  | ): Promise<TeachHomeClassPayload[]> {
  67  |   const res = await fetchWithRetry(() =>
  68  |     request.get(`${API}/api/schools/me/teach/home`, {
  69  |       headers: { Authorization: `Bearer ${jwt}` },
  70  |     }),
  71  |   );
  72  |   expect(res.ok()).toBeTruthy();
  73  |   return ((await res.json()) as { data: { classes: TeachHomeClassPayload[] } }).data.classes;
  74  | }
  75  | 
  76  | function classCard(page: Page, name: string) {
  77  |   return page
  78  |     .locator('[data-slot="teach-home-class-card"]')
  79  |     .filter({ has: page.getByRole('heading', { name, exact: true }) });
  80  | }
  81  | 
  82  | test.describe('task 87: teacher landing dashboard vs live C-TEACH-01', () => {
  83  |   // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  84  |   test.describe.configure({ mode: 'serial', timeout: 120_000 });
  85  | 
  86  |   test('teacher opens the populated dashboard: diagnostic summary + no-sitting monitor', async ({
  87  |     page,
  88  |     request,
  89  |   }) => {
  90  |     // Content expectations come from the live C-TEACH-01 payload, never
  91  |     // pinned (the fixture class keeps evolving — see task 75).
  92  |     const jwt = await login(request, TEACHER);
  93  |     const classes = await fetchTeachHome(request, jwt);
  94  |     const fixture = classes.find((row) => row.documentId === CLASS_ID);
  95  |     expect(fixture).toBeTruthy();
> 96  |     expect(fixture!.diagnostic).not.toBeNull();
      |                                     ^ Error: expect(received).not.toBeNull()
  97  | 
  98  |     await signIn(page, TEACHER);
  99  |     const home = page.locator('[data-slot="teach-home"]');
  100 |     await expect(home).toBeVisible({ timeout: 20_000 });
  101 |     await expect(
  102 |       home.getByRole('heading', { name: cat(en, 'Teach.home.title'), exact: true }),
  103 |     ).toBeVisible();
  104 | 
  105 |     const card = classCard(page, CLASS_NAME);
  106 |     await expect(card).toBeVisible();
  107 | 
  108 |     // Diagnostic panel populated: sat count, latest form, mastered percent —
  109 |     // the rendered strings equal the wire payload run through the catalog.
  110 |     const diagnostic = card.locator('[data-slot="diagnostic-summary"]');
  111 |     await expect(diagnostic).toBeVisible();
  112 |     await expect(
  113 |       diagnostic.getByText(
  114 |         icu(cat(en, 'Teach.home.panels.diagnostic.satValue'), {
  115 |           sat: String(fixture!.diagnostic!.sat_count),
  116 |           roster: String(fixture!.diagnostic!.roster_count),
  117 |         }),
  118 |         { exact: true },
  119 |       ),
  120 |     ).toBeVisible();
  121 |     await expect(
  122 |       diagnostic.getByText(fixture!.diagnostic!.latest_form ?? '', { exact: true }),
  123 |     ).toBeVisible();
  124 |     await expect(
  125 |       diagnostic.getByText(
  126 |         icu(cat(en, 'Teach.home.panels.diagnostic.masteredValue'), {
  127 |           pct: String(Math.round(fixture!.diagnostic!.mastered_pct)),
  128 |         }),
  129 |         { exact: true },
  130 |       ),
  131 |     ).toBeVisible();
  132 |     await expect(
  133 |       diagnostic.getByText(cat(en, 'Teach.home.panels.diagnostic.empty'), { exact: true }),
  134 |     ).toHaveCount(0);
  135 | 
  136 |     // Monitor panel follows the live contract: empty when no sitting is open,
  137 |     // otherwise its counts equal the current server payload.
  138 |     const monitor = card.locator('[data-slot="monitor-summary"]');
  139 |     await expect(monitor).toBeVisible();
  140 |     if (fixture!.monitor === null) {
  141 |       await expect(
  142 |         monitor.getByText(cat(en, 'Teach.home.panels.monitor.empty'), { exact: true }),
  143 |       ).toBeVisible();
  144 |     } else {
  145 |       for (const count of Object.values(fixture!.monitor)) {
  146 |         await expect(monitor.getByText(String(count), { exact: true }).first()).toBeVisible();
  147 |       }
  148 |     }
  149 |   });
  150 | 
  151 |   test('class card links navigate: results, test day, roster', async ({ page }) => {
  152 |     await signIn(page, TEACHER);
  153 |     const home = page.locator('[data-slot="teach-home"]');
  154 |     await expect(home).toBeVisible({ timeout: 20_000 });
  155 | 
  156 |     await classCard(page, CLASS_NAME)
  157 |       .getByRole('link', { name: cat(en, 'Teach.home.resultsLink'), exact: true })
  158 |       .click();
  159 |     await page.waitForURL(`**/dashboard/teach/results/${CLASS_ID}`);
  160 |     await expect(page.locator('[data-surface="teacher-diagnostic"]')).toBeVisible({
  161 |       timeout: 20_000,
  162 |     });
  163 | 
  164 |     await page.goto('/en/dashboard/teach');
  165 |     await expect(home).toBeVisible({ timeout: 20_000 });
  166 |     await classCard(page, CLASS_NAME)
  167 |       .getByRole('link', { name: cat(en, 'Teach.home.testDayLink'), exact: true })
  168 |       .click();
  169 |     await page.waitForURL(`**/dashboard/teach/classes/${CLASS_ID}/test-day`);
  170 |     await expect(page.locator('[data-surface="teacher-test-day"]')).toBeVisible({
  171 |       timeout: 20_000,
  172 |     });
  173 | 
  174 |     await page.goto('/en/dashboard/teach');
  175 |     await expect(home).toBeVisible({ timeout: 20_000 });
  176 |     await classCard(page, CLASS_NAME)
  177 |       .getByRole('link', { name: cat(en, 'Teach.home.rosterLink'), exact: true })
  178 |       .click();
  179 |     await page.waitForURL(`**/dashboard/teach/classes/${CLASS_ID}`);
  180 |     await expect(page.locator('[data-surface="teacher-roster"]')).toBeVisible({ timeout: 20_000 });
  181 |   });
  182 | 
  183 |   test('a results-free class renders the unpopulated panels (diagnostic:null, monitor:null)', async ({
  184 |     page,
  185 |     request,
  186 |   }) => {
  187 |     // Setup: a results-free class this spec owns, created via C-CLS-02 with
  188 |     // verify21 assigned (the task 75 pattern), deleted again at the end.
  189 |     const adminJwt = await login(request, SCHOOL_ADMIN);
  190 |     const teachersRes = await fetchWithRetry(() =>
  191 |       request.get(`${API}/api/schools/me/teachers`, {
  192 |         headers: { Authorization: `Bearer ${adminJwt}` },
  193 |       }),
  194 |     );
  195 |     expect(teachersRes.ok()).toBeTruthy();
  196 |     const teachers = (
```