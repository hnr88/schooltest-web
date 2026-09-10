# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: teacher-dashboard-live-banner.spec.ts >> flow 4 — the yellow banner appears while the session is live >> no banner names a sitting the server has not reported as live
- Location: tests/e2e/teacher-dashboard-live-banner.spec.ts:128:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "c36knj4z3rm26pseyq912czd"
Received: undefined
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - link "SchoolTest" [ref=e7] [cursor=pointer]:
        - /url: /dashboard
        - img "SchoolTest" [ref=e8]
      - navigation [ref=e10]:
        - generic [ref=e11]: Teacher view
        - list [ref=e12]:
          - listitem [ref=e13]:
            - link "Results" [ref=e14] [cursor=pointer]:
              - /url: /dashboard/results
              - img [ref=e15]
              - generic [ref=e20]: Results
          - listitem [ref=e21]:
            - link "Test sessions" [ref=e22] [cursor=pointer]:
              - /url: /dashboard/test-sessions
              - img [ref=e23]
              - generic [ref=e26]: Test sessions
      - button "Open user menu" [ref=e29]:
        - generic [ref=e30]: T
        - generic [ref=e31]:
          - generic [ref=e32]: t2-alvarez
          - generic [ref=e33]: Teacher
    - main [ref=e34]:
      - generic [ref=e35]:
        - generic [ref=e36]:
          - button "Toggle navigation" [ref=e37]:
            - img
            - generic [ref=e38]: Toggle Sidebar
          - navigation "Breadcrumb" [ref=e39]:
            - list [ref=e40]:
              - listitem [ref=e41]:
                - link "Dashboard" [ref=e42] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e43]: /
              - listitem [ref=e44]:
                - link "Results" [disabled] [ref=e45]
          - button "Open notifications" [ref=e47]:
            - img [ref=e48]
            - generic "135 unread notifications" [ref=e51]: "135"
        - generic [ref=e53]:
          - generic [ref=e54]:
            - generic [ref=e55]:
              - heading "Results" [level=1] [ref=e56]
              - paragraph [ref=e57]: Class results, teaching insights and progress between tests.
              - paragraph [ref=e58]: Your classes. Contact your SchoolTest school admin to manage classes.
            - region "Test cycle for this class" [ref=e59]:
              - paragraph [ref=e60]: No test is scheduled for this class yet. The dates will appear here once a test window opens.
          - generic [ref=e61]:
            - paragraph [ref=e62]: 4 sessions live now
            - generic [ref=e64]:
              - link "Live Reading 8B — Alvarez 108646 Reading diagnostic — Test A" [ref=e65] [cursor=pointer]:
                - /url: /dashboard/test-sessions/c36knj4z3rm26pseyq912czd
                - generic [ref=e66]: Live
                - generic [ref=e68]:
                  - generic [ref=e69]:
                    - generic [ref=e70]: Reading 8B — Alvarez
                    - generic [ref=e71]: "108646"
                  - generic [ref=e72]: Reading diagnostic — Test A
              - link "Live Reading 8B — Alvarez 665791 Reading diagnostic — Test A" [ref=e73] [cursor=pointer]:
                - /url: /dashboard/test-sessions/p22w8kaiy4h7m1y9keun9vo1
                - generic [ref=e74]: Live
                - generic [ref=e76]:
                  - generic [ref=e77]:
                    - generic [ref=e78]: Reading 8B — Alvarez
                    - generic [ref=e79]: "665791"
                  - generic [ref=e80]: Reading diagnostic — Test A
              - link "Live Reading 8B — Alvarez 883548 Reading diagnostic — Test A" [ref=e81] [cursor=pointer]:
                - /url: /dashboard/test-sessions/vq6yel6qkv9n6l6wjdvwsvpr
                - generic [ref=e82]: Live
                - generic [ref=e84]:
                  - generic [ref=e85]:
                    - generic [ref=e86]: Reading 8B — Alvarez
                    - generic [ref=e87]: "883548"
                  - generic [ref=e88]: Reading diagnostic — Test A
              - link "Live Reading 8B — Alvarez 925452 Reading diagnostic — Test A" [ref=e89] [cursor=pointer]:
                - /url: /dashboard/test-sessions/h1klkgsopue96dp7hnrycabj
                - generic [ref=e90]: Live
                - generic [ref=e92]:
                  - generic [ref=e93]:
                    - generic [ref=e94]: Reading 8B — Alvarez
                    - generic [ref=e95]: "925452"
                  - generic [ref=e96]: Reading diagnostic — Test A
          - generic [ref=e98]:
            - generic [ref=e99]:
              - generic [ref=e100]:
                - generic [ref=e101]:
                  - img
                  - searchbox "Search classes" [ref=e102]
                - generic [ref=e103]:
                  - generic [ref=e104]: Year level
                  - combobox "Year level" [ref=e105]:
                    - generic [ref=e106]: all
                    - img: ▼
                  - textbox [ref=e107]: all
                - generic [ref=e108]:
                  - generic [ref=e109]: Status
                  - combobox "Status" [ref=e110]:
                    - generic [ref=e111]: all
                    - img: ▼
                  - textbox [ref=e112]: all
                - generic [ref=e113]:
                  - generic [ref=e114]: Sort
                  - combobox "Sort" [ref=e115]:
                    - generic [ref=e116]: name
                    - img: ▼
                  - textbox [ref=e117]: name
              - generic [ref=e118]:
                - group "Layout" [ref=e119]:
                  - button "Tiles" [pressed] [ref=e120]:
                    - img [ref=e121]
                  - button "List" [ref=e126]:
                    - img [ref=e127]
                - status [ref=e128]: 1 class
            - list [ref=e130]:
              - listitem [ref=e131]:
                - link "Reading 8B — Alvarez 7_9 · form A LIVE NOW Reading Test A 5 / 20 Test B 0 / 20 Listening Soon Writing Soon Speaking Soon Students 20 Overall growth —" [ref=e132] [cursor=pointer]:
                  - /url: /dashboard/results/qves8wrtl7r9ctw49jivm8gl
                  - generic [ref=e133]:
                    - generic [ref=e134]:
                      - generic [ref=e135]: Re
                      - generic [ref=e136]:
                        - generic [ref=e137]: Reading 8B — Alvarez
                        - generic [ref=e138]: 7_9 · form A
                    - generic "4 sessions live" [ref=e139]: LIVE NOW
                  - generic [ref=e141]:
                    - generic [ref=e142]:
                      - generic [ref=e143]: Reading
                      - generic [ref=e144]:
                        - term [ref=e145]: Test A
                        - definition [ref=e146]:
                          - 'progressbar "Test A: 5 of 20 students completed" [ref=e147]':
                            - generic [ref=e150]: 5 / 20
                      - generic [ref=e151]:
                        - term [ref=e152]: Test B
                        - definition [ref=e153]:
                          - 'progressbar "Test B: 0 of 20 students completed" [ref=e154]':
                            - generic [ref=e156]: 0 / 20
                    - generic [ref=e157]:
                      - generic [ref=e158]: Listening
                      - generic [ref=e159]: Soon
                    - generic [ref=e160]:
                      - generic [ref=e161]: Writing
                      - generic [ref=e162]: Soon
                    - generic [ref=e163]:
                      - generic [ref=e164]: Speaking
                      - generic [ref=e165]: Soon
                  - generic [ref=e166]:
                    - generic [ref=e167]:
                      - generic [ref=e168]: Students
                      - generic [ref=e169]: "20"
                    - generic [ref=e170]:
                      - generic [ref=e171]: Overall growth
                      - generic [ref=e172]: —
  - generic [ref=e173]:
    - img [ref=e175]
    - button "Open Tanstack query devtools" [ref=e223] [cursor=pointer]:
      - img [ref=e224]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e277] [cursor=pointer]:
    - img [ref=e278]
  - alert [ref=e281]: Results — SchoolTest · SchoolTest
```

# Test source

```ts
  35  | const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
  36  | const LIVE = 'Teacher.dashboard.liveBanner';
  37  | 
  38  | test.describe.configure({ mode: 'serial' });
  39  | 
  40  | /** R-10 removed the Dashboard rail entry — navigate straight to /dashboard. */
  41  | async function gotoDashboard(): Promise<void> {
  42  |   await page.goto('/dashboard');
  43  |   await expect(page.locator(DASHBOARD_SURFACE)).toHaveAttribute('data-status', 'ready', {
  44  |     timeout: 60_000,
  45  |   });
  46  | }
  47  | 
  48  | let page: Page;
  49  | let request: APIRequestContext;
  50  | let jwt: string;
  51  | let started: CreateTestSessionResponse | null = null;
  52  | 
  53  | test.beforeAll(async ({ browser, playwright }) => {
  54  |   // Dev-mode Turbopack compiles each segment on first visit — a cold /sign-in +
  55  |   // /dashboard outlives the 30s hook default on this machine.
  56  |   test.setTimeout(180_000);
  57  |   request = await playwright.request.newContext();
  58  |   jwt = await apiLogin(request, 'teacher');
  59  |   page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  60  |   await signIn(page, 'teacher');
  61  |   await expect(page.locator(DASHBOARD_SURFACE)).toHaveAttribute('data-status', 'ready', {
  62  |     timeout: 60_000,
  63  |   });
  64  | });
  65  | 
  66  | test.afterAll(async () => {
  67  |   // Leave no sitting of this spec's own making open behind.
  68  |   if (started !== null && sittingRow(started.sitting_document_id).status === 'open') {
  69  |     await closeSession(request, jwt, started.sitting_document_id);
  70  |   }
  71  |   await page.context().close();
  72  |   await request.dispose();
  73  | });
  74  | 
  75  | // scoring/10 (R-01/R-16): /dashboard redirects a teacher to /dashboard/results,
  76  | // so flow 3 runs UN-SKIPPED against the class list the redirect lands on — the
  77  | // results-class-row tiles render the C-TD-1 A/B completions (task 06's
  78  | // re-parented TeacherClassCompletionRow). The old card's top-subskill-gap tile
  79  | // is retired DOM: the row's contract is name + completions + derived status.
  80  | test.describe('flow 3 — class rows carry the live counts', () => {
  81  |   test('every row equals the class C-TD-1 answered, field for field', async () => {
  82  |     const wire = await readDashboard(request, jwt);
  83  |     expect(wire.classes.length, 'the teacher owns no class').toBeGreaterThan(0);
  84  |     await expect(page.locator('[data-slot="results-class-row"]')).toHaveCount(
  85  |       wire.classes.length,
  86  |     );
  87  | 
  88  |     for (const klass of wire.classes) {
  89  |       expect(
  90  |         await readCard(page, en, klass.class_document_id),
  91  |         `row ${klass.name} drifted from C-TD-1`,
  92  |       ).toEqual(expectedCard(en, klass));
  93  |     }
  94  | 
  95  |     // The dataset is real, so nothing above vacuously compared zeros.
  96  |     const completed = wire.classes.reduce(
  97  |       (sum, klass) => sum + klass.test_a.completed + klass.test_b.completed,
  98  |       0,
  99  |     );
  100 |     expect(completed, 'no completion anywhere — nothing was really asserted').toBeGreaterThan(0);
  101 | 
  102 |     await page.screenshot({ path: path.join(SHOTS, '051-flow3-class-cards.png'), fullPage: true });
  103 |   });
  104 | 
  105 |   test('each completion count is also the bar it labels, and the roster it belongs to', async () => {
  106 |     const wire = await readDashboard(request, jwt);
  107 |     for (const klass of wire.classes) {
  108 |       const card = page.locator(`[data-class-id="${klass.class_document_id}"]`);
  109 |       for (const [key, completion] of [
  110 |         [`${TD}.testA`, klass.test_a],
  111 |         [`${TD}.testB`, klass.test_b],
  112 |       ] as const) {
  113 |         const bar = card.getByRole('progressbar', {
  114 |           name: `${cat(en, key)}: ${completion.completed} of ${completion.total} students completed`,
  115 |         });
  116 |         await expect(bar).toHaveCount(1);
  117 |         await expect(bar).toHaveAttribute(
  118 |           'aria-valuetext',
  119 |           `${completion.completed} / ${completion.total}`,
  120 |         );
  121 |         expect(completion.completed).toBeLessThanOrEqual(completion.total);
  122 |       }
  123 |     }
  124 |   });
  125 | });
  126 | 
  127 | test.describe('flow 4 — the yellow banner appears while the session is live', () => {
  128 |   test('no banner names a sitting the server has not reported as live', async () => {
  129 |     const wire = await readDashboard(request, jwt);
  130 |     const banner = await readBanner(page);
  131 |     if (wire.live_session === null) {
  132 |       expect(banner, 'a banner with no live session on the wire').toBeNull();
  133 |       return;
  134 |     }
> 135 |     expect(banner?.sittingId).toBe(wire.live_session.sitting_document_id);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  136 |     expect(sittingRow(wire.live_session.sitting_document_id).status).toBe('open');
  137 |   });
  138 | 
  139 |   test('generating a join code puts THAT sitting in the banner, with a working View live link', async () => {
  140 |     test.setTimeout(180_000);
  141 |     const wire = await readDashboard(request, jwt);
  142 |     const tests = await readTests(request, jwt);
  143 |     expect(tests.length, 'C-TD-2 offers no test').toBeGreaterThan(0);
  144 | 
  145 |     started = await startSessionViaUi(page, en, wire.classes[0].name, tests[0].label);
  146 | 
  147 |     // The server agrees this is now the live session, and C-TS-2 lists it as open.
  148 |     const live = (await readDashboard(request, jwt)).live_session;
  149 |     if (live === null) throw new Error('C-TS-1 minted a sitting but C-TD-1 reports none live');
  150 |     expect(live.sitting_document_id).toBe(started.sitting_document_id);
  151 |     expect(live.code).toBe(started.code);
  152 |     expect(live.class_name).toBe(wire.classes[0].name);
  153 |     expect(live.test_variant).toBe(tests[0].variant);
  154 |     const listed = (await readSessions(request, jwt)).find(
  155 |       (session) => session.sitting_document_id === started?.sitting_document_id,
  156 |     );
  157 |     expect(listed?.status).toBe('open');
  158 |     expect(sittingRow(started.sitting_document_id)).toEqual({ status: 'open', closed_at: '' });
  159 | 
  160 |     await gotoDashboard();
  161 |     const banner = await readBanner(page);
  162 |     expect(banner, 'no banner while a sitting is open').not.toBeNull();
  163 |     expect(banner?.sittingId).toBe(started.sitting_document_id);
  164 |     expect(banner?.pill).toBe(cat(en, `${LIVE}.live`));
  165 |     expect(banner?.title).toBe(cat(en, `${LIVE}.title`));
  166 |     expect(banner?.detail).toBe(expectedBannerDetail(en, live));
  167 |     expect(banner?.detail).toContain(started.code);
  168 |     expect(banner?.linkName.trim()).toBe(cat(en, `${LIVE}.viewLive`));
  169 |     expect(banner?.linkHref).toBe(`/dashboard/test-sessions/${started.sitting_document_id}`);
  170 |     // "A yellow banner" (.qa/DESIGN.md §Dashboard) — the resolved hue, and the
  171 |     // state also spelled out in words above, never colour alone.
  172 |     expect(banner?.hue, `banner tint ${banner?.background} is not yellow`).toBeGreaterThan(30);
  173 |     expect(banner?.hue, `banner tint ${banner?.background} is not yellow`).toBeLessThan(110);
  174 |     expect(banner?.linkBox.height, 'WCAG 2.2 AA target size').toBeGreaterThanOrEqual(44);
  175 |     await page.screenshot({ path: path.join(SHOTS, '051-flow4-live-banner.png'), fullPage: true });
  176 | 
  177 |     await page.getByRole('link', { name: cat(en, `${LIVE}.viewLive`) }).click();
  178 |     await page.waitForURL(`**/dashboard/test-sessions/${started.sitting_document_id}`);
  179 |     await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
  180 |       'data-status',
  181 |       'ready',
  182 |     );
  183 |     await page.screenshot({ path: path.join(SHOTS, '051-flow4-view-live.png'), fullPage: true });
  184 |   });
  185 | 
  186 |   test('closing that sitting takes it out of the banner', async () => {
  187 |     expect(started, 'the previous test opened nothing').not.toBeNull();
  188 |     const closing = started as CreateTestSessionResponse;
  189 |     await closeSession(request, jwt, closing.sitting_document_id);
  190 |     const row = sittingRow(closing.sitting_document_id);
  191 |     expect(row.status).toBe('closed');
  192 |     expect(row.closed_at.length, 'closed_at was not stamped').toBeGreaterThan(0);
  193 | 
  194 |     await gotoDashboard();
  195 |     const wire = await readDashboard(request, jwt);
  196 |     expect(wire.live_session?.sitting_document_id).not.toBe(closing.sitting_document_id);
  197 |     await expect(page.locator(`[data-sitting-id="${closing.sitting_document_id}"]`)).toHaveCount(0);
  198 | 
  199 |     // Whatever the banner shows now is the server's current answer, and that
  200 |     // sitting is genuinely open in PostgreSQL — the banner tracks open sittings
  201 |     // only. (Older sittings of this seeded teacher may legitimately still be open.)
  202 |     const banner = await readBanner(page);
  203 |     if (wire.live_session === null) {
  204 |       expect(banner, 'a banner survived with no live session on the wire').toBeNull();
  205 |     } else {
  206 |       expect(banner?.sittingId).toBe(wire.live_session.sitting_document_id);
  207 |       expect(sittingRow(wire.live_session.sitting_document_id).status).toBe('open');
  208 |     }
  209 |     await page.screenshot({ path: path.join(SHOTS, '051-flow4-after-close.png'), fullPage: true });
  210 |   });
  211 | });
  212 | 
```