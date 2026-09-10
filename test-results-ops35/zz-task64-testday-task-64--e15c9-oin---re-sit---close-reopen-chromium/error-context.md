# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-task64-testday.spec.ts >> task 64: teacher test-day screen vs live C-SIT-01/02/03 >> start -> reveal -> live join -> re-sit -> close/reopen
- Location: tests/e2e/zz-task64-testday.spec.ts:100:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: apiRequestContext.get: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - complementary [ref=e3]:
      - link "SchoolTest" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "SchoolTest" [ref=e6]
      - generic [ref=e7]:
        - generic [ref=e8]: School portal
        - paragraph [ref=e9]: English language diagnostic and progress testing, aligned to ACARA
        - generic [ref=e10]:
          - generic [ref=e11]:
            - term [ref=e12]: Subskills
            - definition [ref=e13]: "25"
          - generic [ref=e14]:
            - term [ref=e15]: Year levels
            - definition [ref=e16]: 7 to 12
          - generic [ref=e17]:
            - term [ref=e18]: Reported on
            - definition [ref=e19]: ACARA
        - paragraph [ref=e20]: SchoolTest acknowledges the Traditional Custodians of the lands on which Australian schools stand.
    - generic [ref=e22]:
      - navigation "Breadcrumb" [ref=e23]:
        - link "Home" [ref=e24] [cursor=pointer]:
          - /url: /
        - text: /Portal access
      - generic [ref=e25]:
        - generic [ref=e26]:
          - heading "Log in to the portal" [level=1] [ref=e27]
          - paragraph [ref=e28]: Use the account your school administrator issued.
        - generic [ref=e29]:
          - generic [ref=e30]:
            - generic [ref=e31]: Email address
            - textbox "Email address" [ref=e32]:
              - /placeholder: name@school.edu.au
          - generic [ref=e33]:
            - generic [ref=e34]:
              - generic [ref=e35]: Password
              - link "Forgot password" [ref=e36] [cursor=pointer]:
                - /url: /forgot-password
            - textbox "Password" [ref=e38]:
              - /placeholder: Enter your password
          - button "Log in" [ref=e39]
        - paragraph [ref=e40]: Portal accounts are issued by invitation. Ask your school's EAL/D coordinator to invite you.
      - generic [ref=e41]:
        - link "Privacy statement" [ref=e42] [cursor=pointer]:
          - /url: /privacy-policy
        - link "Accessibility" [ref=e43] [cursor=pointer]:
          - /url: /
        - generic [ref=e44]: © 2026 SchoolTest
  - generic [ref=e45]:
    - img [ref=e47]
    - button "Open Tanstack query devtools" [ref=e95] [cursor=pointer]:
      - img [ref=e96]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e149] [cursor=pointer]:
    - img [ref=e150]
  - alert [ref=e153]
```

# Test source

```ts
  1   | import path from 'node:path';
  2   | 
  3   | import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
  4   | 
  5   | import { fetchWithRetry, loginCached } from './helpers/http';
  6   | import { cat, loadMessages } from './helpers/i18n';
  7   | import { fixtureClassId } from './helpers/fixture-class';
  8   | import { fixtureStudentId } from './helpers/fixture-ids';
  9   | import { fixtureTeacherCredentials } from './helpers/credentials';
  10  | import { roleCredentials } from './helpers/credentials';
  11  | 
  12  | // Task 64 (st-mvp-pivot) targeted live check — NOT part of the suite.
  13  | // Teacher test-day screen (mvp-updates §4.5, C-SIT-01/02/03): start a sitting,
  14  | // reveal the access code (hidden by default), the live monitor flips Sofia
  15  | // not_joined -> joined when she joins through the public C-SIT-01 route, the
  16  | // confirmed re-sit returns her to a joinable state (fresh session on re-join),
  17  | // and close/reopen toggle the sitting (a closed sitting blocks join with 400).
  18  | const en = loadMessages('en');
  19  | 
  20  | const API = 'http://127.0.0.1:5500';
  21  | const TEACHER = fixtureTeacherCredentials();
  22  | const SCHOOL_ADMIN = roleCredentials('schoolAdmin');
  23  | const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
  24  | const SOFIA_ID = fixtureStudentId('Sofia', 'Petrov');
  25  | const SOFIA_EMAIL = 'sofia.petrov@schooltest.local';
  26  | const TEST_DAY_URL = `/en/dashboard/teach/classes/${CLASS_ID}/test-day`;
  27  | 
  28  | async function login(
  29  |   request: APIRequestContext,
  30  |   credentials: { email: string; password: string },
  31  | ): Promise<string> {
  32  |   return loginCached(request, API, credentials);
  33  | }
  34  | 
  35  | async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  36  |   await page.goto('/sign-in');
  37  |   await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  38  |   await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(credentials.password);
  39  |   await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  40  |   // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  41  |   // late role redirect can never hijack the goto that follows. The axios
  42  |   // layer rides out any 429 on the auth POST, so allow for that here.
  43  |   await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
  44  | }
  45  | 
  46  | interface SittingRow {
  47  |   documentId: string;
  48  |   status: 'open' | 'closed';
  49  | }
  50  | 
  51  | async function listClassSittings(request: APIRequestContext, jwt: string): Promise<SittingRow[]> {
  52  |   const res = await fetchWithRetry(() =>
> 53  |     request.get(
      |             ^ Error: apiRequestContext.get: Target page, context or browser has been closed
  54  |       `${API}/api/sittings?filters[class][documentId][$eq]=${CLASS_ID}&sort=createdAt:desc`,
  55  |       { headers: { Authorization: `Bearer ${jwt}` } },
  56  |     ),
  57  |   );
  58  |   expect(res.ok()).toBeTruthy();
  59  |   return ((await res.json()) as { data: SittingRow[] }).data;
  60  | }
  61  | 
  62  | async function closeSitting(
  63  |   request: APIRequestContext,
  64  |   jwt: string,
  65  |   documentId: string,
  66  | ): Promise<void> {
  67  |   const res = await fetchWithRetry(() =>
  68  |     request.post(`${API}/api/sittings/${documentId}/close`, {
  69  |       headers: { Authorization: `Bearer ${jwt}` },
  70  |     }),
  71  |   );
  72  |   expect(res.ok()).toBeTruthy();
  73  | }
  74  | 
  75  | function joinAsSofia(request: APIRequestContext, code: string) {
  76  |   // C-SIT-01 v2 public join: code + school email.
  77  |   return fetchWithRetry(() =>
  78  |     request.post(`${API}/api/sittings/join`, {
  79  |       data: { code, email: SOFIA_EMAIL },
  80  |     }),
  81  |   );
  82  | }
  83  | 
  84  | async function ensureSofiaEmail(request: APIRequestContext): Promise<void> {
  85  |   const jwt = await login(request, SCHOOL_ADMIN);
  86  |   const res = await fetchWithRetry(() =>
  87  |     request.patch(`${API}/api/schools/me/children/${SOFIA_ID}`, {
  88  |       headers: { Authorization: `Bearer ${jwt}` },
  89  |       data: { email: SOFIA_EMAIL },
  90  |     }),
  91  |   );
  92  |   expect(res.ok(), await res.text()).toBeTruthy();
  93  | }
  94  | 
  95  | test.describe('task 64: teacher test-day screen vs live C-SIT-01/02/03', () => {
  96  |   // Serial: one sitting lifecycle driven end to end through the real UI. The
  97  |   // timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  98  |   test.describe.configure({ mode: 'serial', timeout: 120_000 });
  99  | 
  100 |   test('start -> reveal -> live join -> re-sit -> close/reopen', async ({ page, request }) => {
  101 |     const jwt = await login(request, TEACHER);
  102 |     await ensureSofiaEmail(request);
  103 |     // Setup: close any open sittings so the screen starts in the empty state.
  104 |     for (const sitting of await listClassSittings(request, jwt)) {
  105 |       if (sitting.status === 'open') await closeSitting(request, jwt, sitting.documentId);
  106 |     }
  107 | 
  108 |     try {
  109 |       await signIn(page, TEACHER);
  110 |       await page.goto(TEST_DAY_URL);
  111 |       const screen = page.locator('[data-surface="teacher-test-day"]');
  112 |       await expect(screen).toBeVisible({ timeout: 20_000 });
  113 | 
  114 |       // Every sitting closed -> the latest closed board shows with the start of
  115 |       // the next sitting on top.
  116 |       const start = screen.getByRole('button', { name: cat(en, 'TestDay.startCta'), exact: true });
  117 |       await expect(start).toBeVisible({ timeout: 15_000 });
  118 |       await start.click();
  119 | 
  120 |       // The code card appears with the code hidden by default; Sofia is listed
  121 |       // as not joined.
  122 |       const card = screen.locator('[data-slot="code-reveal-card"]');
  123 |       await expect(card).toBeVisible({ timeout: 15_000 });
  124 |       await expect(card.locator('[data-slot="access-code-hidden"]')).toBeVisible();
  125 |       const sofiaRow = screen.locator(`[data-student="${SOFIA_ID}"]`);
  126 |       await expect(
  127 |         sofiaRow.getByText(cat(en, 'TestDay.monitor.state.not_joined'), { exact: true }),
  128 |       ).toBeVisible({ timeout: 15_000 });
  129 | 
  130 |       // Reveal mints the code and shows it large for the board.
  131 |       await card
  132 |         .getByRole('button', { name: cat(en, 'TestDay.code.revealCta'), exact: true })
  133 |         .click();
  134 |       const codeEl = card.locator('[data-slot="access-code"]');
  135 |       await expect(codeEl).toBeVisible({ timeout: 15_000 });
  136 |       const code = ((await codeEl.textContent()) ?? '').trim();
  137 |       expect(code).toMatch(/^[A-Z]+-\d+$/);
  138 | 
  139 |       // A real student join through the public route flips the monitor row live
  140 |       // (5 s poll, no reload).
  141 |       const join = await joinAsSofia(request, code);
  142 |       expect(join.ok()).toBeTruthy();
  143 |       await expect(
  144 |         sofiaRow.getByText(cat(en, 'TestDay.monitor.state.joined'), { exact: true }),
  145 |       ).toBeVisible({ timeout: 20_000 });
  146 | 
  147 |       // Re-sit with the confirm dialog: the attempt ends and the row leaves the
  148 |       // joined state... (ops/35: the action moved INTO the kit's ⋯ row menu —
  149 |       // the consequential write stays out of the inline quick-action slots per
  150 |       // the task's watch-out — but the same confirm dialog opens from it.)
  151 |       await sofiaRow
  152 |         .getByRole('button', { name: cat(en, 'TestDay.monitor.rowMenuLabel'), exact: true })
  153 |         .click();
```