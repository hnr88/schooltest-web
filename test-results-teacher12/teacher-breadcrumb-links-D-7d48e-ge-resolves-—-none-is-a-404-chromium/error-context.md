# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: teacher-breadcrumb-links.spec.ts >> D-009 — teacher breadcrumbs never link to a missing page >> every crumb on the teacher classes record page resolves — none is a 404
- Location: tests/e2e/teacher-breadcrumb-links.spec.ts:103:9

# Error details

```
Error: the teacher home links to a classes record

expect(locator).toBeVisible() failed

Locator: locator('a[href*="/dashboard/teach/classes/"]:not([href$="/test-day"])').first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - the teacher home links to a classes record with timeout 20000ms
  - waiting for locator('a[href*="/dashboard/teach/classes/"]:not([href$="/test-day"])').first()

```

```yaml
- link "SchoolTest":
  - /url: /dashboard
  - img "SchoolTest"
- navigation:
  - text: Teacher view
  - list:
    - listitem:
      - link "Results":
        - /url: /dashboard/results
    - listitem:
      - link "Test sessions":
        - /url: /dashboard/test-sessions
- button "Open user menu": t2-alvarez Teacher
- main:
  - button "Toggle navigation": Toggle Sidebar
  - navigation "Breadcrumb":
    - list:
      - listitem:
        - link "Dashboard":
          - /url: /dashboard
      - listitem:
        - link "Results" [disabled]
  - button "Open notifications": "135"
  - heading "Results" [level=1]
  - paragraph: Class results, teaching insights and progress between tests.
  - paragraph: Your classes. Contact your SchoolTest school admin to manage classes.
  - region "Test cycle for this class":
    - paragraph: No test is scheduled for this class yet. The dates will appear here once a test window opens.
  - paragraph: 4 sessions live now
  - link "Live Reading 8B — Alvarez 108646 Reading diagnostic — Test A":
    - /url: /dashboard/test-sessions/c36knj4z3rm26pseyq912czd
  - link "Live Reading 8B — Alvarez 665791 Reading diagnostic — Test A":
    - /url: /dashboard/test-sessions/p22w8kaiy4h7m1y9keun9vo1
  - link "Live Reading 8B — Alvarez 883548 Reading diagnostic — Test A":
    - /url: /dashboard/test-sessions/vq6yel6qkv9n6l6wjdvwsvpr
  - link "Live Reading 8B — Alvarez 925452 Reading diagnostic — Test A":
    - /url: /dashboard/test-sessions/h1klkgsopue96dp7hnrycabj
  - searchbox "Search classes"
  - text: Year level
  - combobox "Year level": all
  - text: Status
  - combobox "Status": all
  - text: Sort
  - combobox "Sort": name
  - group "Layout":
    - button "Tiles" [pressed]
    - button "List"
  - status: 1 class
  - list:
    - listitem:
      - link "Reading 8B — Alvarez 7_9 · form A LIVE NOW Reading Test A 5 / 20 Test B 0 / 20 Listening Soon Writing Soon Speaking Soon Students 20 Overall growth —":
        - /url: /dashboard/results/qves8wrtl7r9ctw49jivm8gl
        - text: Reading 8B — Alvarez 7_9 · form A LIVE NOW Reading
        - term: Test A
        - definition:
          - 'progressbar "Test A: 5 of 20 students completed"': 5 / 20
        - term: Test B
        - definition:
          - 'progressbar "Test B: 0 of 20 students completed"': 0 / 20
        - text: Listening Soon Writing Soon Speaking Soon Students 20 Overall growth —
- button "Open Tanstack query devtools":
  - img
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | /**
  2   |  * D-009 regression: no teacher breadcrumb links to a route without a page.
  3   |  *
  4   |  * `trail.constants.ts` registers `/dashboard/teach/classes` and
  5   |  * `/dashboard/teach/results` as ancestors of the teacher record patterns, but
  6   |  * neither route has a `page.tsx` — only `classes/[documentId]` and
  7   |  * `results/[classId]` do, and `build-trail.ts` hands an `href` to every walked
  8   |  * segment.
  9   |  *
  10  |  * What saves these two pages TODAY is an accident, not a guarantee: nothing in
  11  |  * `modules/teach` publishes a record crumb, so the ancestor lands as the LAST
  12  |  * crumb and renders as text. Publish one — as every other detail page already
  13  |  * does — and it becomes a live link to a 404. The deterministic proof of that
  14  |  * condition is `src/modules/navigation/lib/build-trail.test.ts`, which supplies
  15  |  * `recordLabel` directly; this spec is the real-browser guard that the rendered
  16  |  * trail never links anywhere that 404s, whatever the record state.
  17  |  *
  18  |  * Status is read through `page.request`, NOT the bare `request` fixture: only
  19  |  * the page's context carries the session cookie, and an unauthenticated probe
  20  |  * of a dashboard route redirects to sign-in — which would answer 200 and hide
  21  |  * the very 404 this spec exists to catch.
  22  |  *
  23  |  * ONE sign-in for the whole file: the suite is serial and shares a single page
  24  |  * created in `beforeAll`. The API's brute-force guard is 20 POST
  25  |  * /api/auth/local per minute per IP and that budget is shared with every other
  26  |  * suite on this host, so this file must never cost more than one login.
  27  |  */
  28  | import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
  29  | 
  30  | import { loadMessages } from './helpers/i18n';
  31  | import { loginAs } from './helpers/roles';
  32  | 
  33  | const en = loadMessages('en');
  34  | const CAPTURES = '../.codephant/missions/msn-0da39441-f845-426b-88a1-037c9eb98442/captures';
  35  | 
  36  | /** The dashboard topbar trail. */
  37  | function trail(page: Page) {
  38  |   return page.getByRole('navigation', { name: en['Shell.topbar.breadcrumbLabel'] }).first();
  39  | }
  40  | 
  41  | /** Every href the trail actually renders, in DOM order. */
  42  | async function trailHrefs(page: Page): Promise<string[]> {
  43  |   return trail(page)
  44  |     .locator('a[href]')
  45  |     .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  46  | }
  47  | 
  48  | /** Every crumb label the trail renders, links and plain text alike. */
  49  | async function trailLabels(page: Page): Promise<string[]> {
  50  |   const texts = await trail(page).locator('li').allInnerTexts();
  51  |   return texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0 && t !== '/');
  52  | }
  53  | 
  54  | /** Strip the locale prefix a next-intl <Link> adds, so paths compare to the registry. */
  55  | function localeless(href: string): string {
  56  |   return href.replace(/^\/[a-z]{2}(?=\/)/, '');
  57  | }
  58  | 
  59  | test.describe('D-009 — teacher breadcrumbs never link to a missing page', () => {
  60  |   test.describe.configure({ mode: 'serial' });
  61  | 
  62  |   let context: BrowserContext;
  63  |   let page: Page;
  64  |   // Real hrefs taken from the teacher home, never constructed: the two routes
  65  |   // take DIFFERENT params (`classes/[documentId]` vs `results/[classId]`), and
  66  |   // an id that does not resolve renders an empty state whose trail proves
  67  |   // nothing.
  68  |   const recordPath: Record<'classes' | 'results', string> = { classes: '', results: '' };
  69  | 
  70  |   async function openRecord(surface: 'classes' | 'results'): Promise<string> {
  71  |     const path = recordPath[surface];
  72  |     await page.goto(path);
  73  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 20_000 });
  74  |     return path;
  75  |   }
  76  | 
  77  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  78  |     context = await browser.newContext();
  79  |     page = await context.newPage();
  80  |     await loginAs(page, 'teacher');
  81  |     await page.goto('/dashboard/results');
  82  |     // scoring/10 (R-16): the teacher's home surface is the class list; each
  83  |     // results-class-row links to the class results record. `/test-day` is a
  84  |     // child of the classes segment, so it is excluded rather than mistaken for
  85  |     // the roster route.
  86  |     for (const surface of ['classes', 'results'] as const) {
  87  |       const link = page
  88  |         .locator(`a[href*="/dashboard/teach/${surface}/"]:not([href$="/test-day"])`)
  89  |         .first();
> 90  |       await expect(link, `the teacher home links to a ${surface} record`).toBeVisible({
      |                                                                           ^ Error: the teacher home links to a classes record
  91  |         timeout: 20_000,
  92  |       });
  93  |       recordPath[surface] = (await link.getAttribute('href')) ?? '';
  94  |       expect(recordPath[surface], `a ${surface} href was read from the teacher home`).not.toBe('');
  95  |     }
  96  |   });
  97  | 
  98  |   test.afterAll(async () => {
  99  |     await context?.close();
  100 |   });
  101 | 
  102 |   for (const surface of ['classes', 'results'] as const) {
  103 |     test(`every crumb on the teacher ${surface} record page resolves — none is a 404`, async () => {
  104 |       const path = await openRecord(surface);
  105 | 
  106 |       const hrefs = await trailHrefs(page);
  107 |       expect(hrefs.length, `${path}: the trail renders at least one link`).toBeGreaterThan(0);
  108 | 
  109 |       for (const href of hrefs) {
  110 |         const res = await page.request.get(href);
  111 |         expect(res.status(), `crumb ${href} on ${path} must not be a dead link`).toBe(200);
  112 |       }
  113 |     });
  114 |   }
  115 | 
  116 |   test('the Classes / Results ancestors keep their label but are not links', async () => {
  117 |     for (const [surface, label] of [
  118 |       ['classes', en['Shell.nav.classes']],
  119 |       ['results', en['Navigation.results']],
  120 |     ] as const) {
  121 |       const path = await openRecord(surface);
  122 | 
  123 |       // Labels yes: the level still shows in the hierarchy.
  124 |       expect(await trailLabels(page), `${path}: the ${label} level is still labelled`).toContain(
  125 |         label,
  126 |       );
  127 | 
  128 |       // Dead hrefs no: the ancestor's own path is never an anchor target.
  129 |       const deadPath = `/dashboard/teach/${surface}`;
  130 |       for (const href of await trailHrefs(page)) {
  131 |         expect(
  132 |           localeless(href),
  133 |           `${path}: ${deadPath} has no page, so no crumb may link to it`,
  134 |         ).not.toBe(deadPath);
  135 |       }
  136 |     }
  137 |   });
  138 | 
  139 |   test('capture: the teacher trail at desktop and 375px', async ({}, testInfo) => {
  140 |     await page.setViewportSize({ width: 1440, height: 900 });
  141 |     await openRecord('classes');
  142 |     await trail(page).scrollIntoViewIfNeeded();
  143 |     await page.screenshot({ path: `${CAPTURES}/d009-breadcrumb-desktop.png` });
  144 |     testInfo.attach('d009-breadcrumb-desktop', {
  145 |       body: await page.screenshot({ clip: (await trail(page).boundingBox()) ?? undefined }),
  146 |       contentType: 'image/png',
  147 |     });
  148 | 
  149 |     await page.setViewportSize({ width: 375, height: 812 });
  150 |     await openRecord('classes');
  151 |     await page.screenshot({ path: `${CAPTURES}/d009-breadcrumb-375.png` });
  152 |     testInfo.attach('d009-breadcrumb-375', {
  153 |       body: await page.screenshot(),
  154 |       contentType: 'image/png',
  155 |     });
  156 | 
  157 |     // The trail must not push the page sideways at 375px (same rule the public
  158 |     // breadcrumb suite already enforces).
  159 |     const overflow = await page.evaluate(
  160 |       () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  161 |     );
  162 |     expect(overflow, 'horizontal overflow at 375px').toBeLessThanOrEqual(1);
  163 | 
  164 |     await page.setViewportSize({ width: 1440, height: 900 });
  165 |   });
  166 | });
  167 | 
```