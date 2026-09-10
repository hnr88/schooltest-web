# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-task134-sitting-history.spec.ts >> C-SIT-07: sitting history table vs live API >> renders one row per API sitting, cell for cell
- Location: tests/e2e/zz-task134-sitting-history.spec.ts:85:7

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.fill: Test timeout of 180000ms exceeded.
Call log:
  - waiting for getByLabel('Email', { exact: true })

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
  3   | import { format } from 'date-fns';
  4   | import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
  5   | 
  6   | import { fetchWithRetry, loginCached } from './helpers/http';
  7   | import { cat, icu, loadMessages } from './helpers/i18n';
  8   | import { fixtureClassId } from './helpers/fixture-class';
  9   | import { fixtureTeacherCredentials } from './helpers/credentials';
  10  | 
  11  | // Task 134 (st-mvp-pivot) — C-SIT-07 sitting history. Permanent spec: the
  12  | // history table on the test-day page renders the class's real sittings, cell
  13  | // for cell against a live API read in the same spec (DOM equals API truth; no
  14  | // network mocks, no seeded mutations — the fixture teacher is read-only here).
  15  | // The empty state is asserted conditionally: the fixture teacher owns a single
  16  | // class, so which branch runs depends on whether that class has sittings.
  17  | const en = loadMessages('en');
  18  | 
  19  | const API = 'http://127.0.0.1:5500';
  20  | const TEACHER = fixtureTeacherCredentials();
  21  | const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"
  22  | const TEST_DAY_URL = `/en/dashboard/teach/classes/${CLASS_ID}/test-day`;
  23  | 
  24  | // Matches SittingHistoryTable's OPENED_AT_PATTERN.
  25  | const OPENED_AT_PATTERN = 'd MMM yyyy';
  26  | 
  27  | interface SittingHistoryRow {
  28  |   documentId: string;
  29  |   code: string | null;
  30  |   form_code: string | null;
  31  |   status: 'open' | 'closed';
  32  |   opened_at: string | null;
  33  |   closed_at: string | null;
  34  |   joined: number;
  35  |   submitted: number;
  36  |   total: number;
  37  | }
  38  | 
  39  | async function signIn(page: Page): Promise<void> {
  40  |   await page.goto('/sign-in');
> 41  |   await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(TEACHER.email);
      |                                                                      ^ Error: locator.fill: Test timeout of 180000ms exceeded.
  42  |   await page.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(TEACHER.password);
  43  |   await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  44  |   // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  45  |   // late role redirect can never hijack the goto that follows.
  46  |   await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
  47  | }
  48  | 
  49  | // C-SIT-07: per-class sitting history, newest first, owning teacher only.
  50  | async function fetchHistory(request: APIRequestContext, jwt: string): Promise<SittingHistoryRow[]> {
  51  |   const res = await fetchWithRetry(() =>
  52  |     request.get(`${API}/api/sittings?class=${CLASS_ID}&summary=true`, {
  53  |       headers: { Authorization: `Bearer ${jwt}` },
  54  |     }),
  55  |   );
  56  |   expect(res.ok()).toBeTruthy();
  57  |   return ((await res.json()) as { data: SittingHistoryRow[] }).data;
  58  | }
  59  | 
  60  | // The exact cell strings SittingHistoryTable renders for one API row.
  61  | function expectedCells(row: SittingHistoryRow): string[] {
  62  |   const missing = cat(en, 'Teach.testDay.history.missingValue');
  63  |   const total = String(row.total);
  64  |   return [
  65  |     row.opened_at ? format(new Date(row.opened_at), OPENED_AT_PATTERN) : missing,
  66  |     row.code ?? missing,
  67  |     row.form_code ?? missing,
  68  |     cat(en, `Teach.testDay.history.status.${row.status}`),
  69  |     icu(cat(en, 'Teach.testDay.history.joinedCount'), { joined: String(row.joined), total }),
  70  |     icu(cat(en, 'Teach.testDay.history.submittedCount'), {
  71  |       submitted: String(row.submitted),
  72  |       total,
  73  |     }),
  74  |   ];
  75  | }
  76  | 
  77  | function historySection(page: Page) {
  78  |   return page.getByRole('region', { name: cat(en, 'Teach.testDay.history.title') });
  79  | }
  80  | 
  81  | test.describe('C-SIT-07: sitting history table vs live API', () => {
  82  |   // Serial + generous timeout: rate-limit ride-out budget (helpers/http.ts).
  83  |   test.describe.configure({ mode: 'serial', timeout: 180_000 });
  84  | 
  85  |   test('renders one row per API sitting, cell for cell', async ({ page, request }) => {
  86  |     const jwt = await loginCached(request, API, TEACHER);
  87  |     const rows = await fetchHistory(request, jwt);
  88  |     expect(rows.length, 'fixture class should have sitting history').toBeGreaterThan(0);
  89  | 
  90  |     await signIn(page);
  91  |     await page.goto(TEST_DAY_URL);
  92  |     const section = historySection(page);
  93  |     await expect(section).toBeVisible({ timeout: 30_000 });
  94  | 
  95  |     // Row count equals the API row count. (The kit pages at 100; the fixture
  96  |     // class's history sits well under that, so one page carries all rows.)
  97  |     const bodyRows = section.locator('tbody tr');
  98  |     await expect(bodyRows).toHaveCount(rows.length, { timeout: 30_000 });
  99  | 
  100 |     // Read the whole grid in one pass, then diff it in order against the API
  101 |     // truth (the server sends newest first and the table renders rows as-is).
  102 |     // textContent, not innerText: the StatusPill's CSS uppercase transform
  103 |     // would otherwise turn the catalog's "Closed" into "CLOSED".
  104 |     // ops/35: the table renders through the directory kit, whose row carries
  105 |     // a trailing actions cell after the six content cells — the diff covers
  106 |     // the six CONTENT cells in order, and the actions cell is asserted
  107 |     // separately below.
  108 |     const domRows = await bodyRows.all();
  109 |     const grid = await Promise.all(
  110 |       domRows.map(async (row) =>
  111 |         (await row.locator('td').allTextContents()).map((cell) => cell.trim()),
  112 |       ),
  113 |     );
  114 |     expect(grid.map((cells) => cells.slice(0, 6))).toEqual(rows.map(expectedCells));
  115 | 
  116 |     // ops/35 kit contracts on every row: the kit's row marker, and the
  117 |     // per-sitting quick action (write-free navigation) plus the row menu.
  118 |     const firstRow = section.locator('[data-directory-row]').first();
  119 |     await expect(firstRow).toBeVisible();
  120 |     await expect(
  121 |       firstRow.getByRole('button', {
  122 |         name: cat(en, 'Teach.testDay.history.openAction'),
  123 |         exact: true,
  124 |       }),
  125 |     ).toBeVisible();
  126 |     await expect(
  127 |       firstRow.getByRole('button', {
  128 |         name: cat(en, 'Teach.testDay.history.rowMenuLabel'),
  129 |         exact: true,
  130 |       }),
  131 |     ).toBeVisible();
  132 | 
  133 |     // Every visible code comes from the API payload (implied by the grid diff,
  134 |     // asserted here against the payload's code set per the task wording).
  135 |     const apiCodes = new Set(rows.map((row) => row.code).filter((code) => code !== null));
  136 |     const missing = cat(en, 'Teach.testDay.history.missingValue');
  137 |     for (const cells of grid) {
  138 |       const visibleCode = cells[1];
  139 |       if (visibleCode !== missing) {
  140 |         expect(apiCodes.has(visibleCode), `visible code ${visibleCode}`).toBe(true);
  141 |       }
```