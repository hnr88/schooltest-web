# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: teacher-dashboard.spec.ts >> teacher dashboard (C-TD-1) >> the sign-in path never paints or reads as the parent persona
- Location: tests/e2e/teacher-dashboard.spec.ts:58:7

# Error details

```
Error: wrong persona frame painted: PARENT:skeleton

expect(received).not.toContain(expected) // indexOf

Expected substring: not "PARENT"
Received string:        "PARENT:skeleton"
```

# Test source

```ts
  1   | import path from 'node:path';
  2   | 
  3   | import { AxeBuilder } from '@axe-core/playwright';
  4   | import { expect, test, type Page } from '@playwright/test';
  5   | 
  6   | import { cat, icu, loadMessages } from './helpers/i18n';
  7   | import {
  8   |   installPersonaSampler,
  9   |   measureOverflow,
  10  |   personaFrames,
  11  |   plural,
  12  |   withWire,
  13  |   type WireClass,
  14  | } from './helpers/teacher-dashboard-live';
  15  | import { signIn } from './helpers/teacher-rail';
  16  | 
  17  | // Task 032 / contract C-TD-1 — the teacher landing page. Every number asserted
  18  | // below is read off the wire from the REAL GET /api/teacher/dashboard that the
  19  | // render itself consumed, so a copy or contract change breaks this spec instead
  20  | // of silently drifting past it.
  21  | const en = loadMessages('en');
  22  | const TD = 'Teacher.dashboard';
  23  | const SCREENSHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
  24  | 
  25  | // scoring/10 (R-16): /dashboard redirects a teacher to /dashboard/results,
  26  | // whose class list renders `teacher-results` over `results-class-row` rows.
  27  | const surface = (page: Page) => page.locator('[data-surface="teacher-results"]');
  28  | const cards = (page: Page) => page.locator('[data-slot="results-class-row"]');
  29  | 
  30  | test.describe.configure({ mode: 'serial' });
  31  | 
  32  | test.describe('teacher dashboard (C-TD-1)', () => {
  33  |   let page: Page;
  34  |   let wire: WireClass[] = [];
  35  |   const apiCalls: string[] = [];
  36  | 
  37  |   test.beforeAll(async ({ browser }) => {
  38  |     // AxeBuilder rejects a page from browser.newPage() — it needs a context.
  39  |     const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  40  |     page = await context.newPage();
  41  |     page.on('response', async (res) => {
  42  |       const { pathname } = new URL(res.url());
  43  |       if (!pathname.startsWith('/api/')) return;
  44  |       apiCalls.push(`${res.status()} ${pathname}`);
  45  |       if (pathname === '/api/teacher/dashboard' && res.status() === 200) {
  46  |         wire = ((await res.json()) as { classes: WireClass[] }).classes;
  47  |       }
  48  |     });
  49  |     await installPersonaSampler(page);
  50  |     await signIn(page, 'teacher');
  51  |     await expect(surface(page)).toHaveAttribute('data-status', 'ready');
  52  |   });
  53  | 
  54  |   test.afterAll(async () => {
  55  |     await page.close();
  56  |   });
  57  | 
  58  |   test('the sign-in path never paints or reads as the parent persona', async () => {
  59  |     const frames = await personaFrames(page);
  60  |     expect(frames.length).toBeGreaterThan(0);
  61  |     for (const frame of frames) {
> 62  |       expect(frame, `wrong persona frame painted: ${frame}`).not.toContain('PARENT');
      |                                                                  ^ Error: wrong persona frame painted: PARENT:skeleton
  63  |       expect(frame, `unknown surface painted: ${frame}`).not.toContain('UNKNOWN-MAIN');
  64  |     }
  65  |     expect(frames[frames.length - 1]).toBe('teacher:ready');
  66  | 
  67  |     // The role arrives only with GET /api/users/me — the login payload carries no
  68  |     // `role`. Branching before it lands mounted the parent Overview, whose
  69  |     // parent-only students read answers 403 for a teacher.
  70  |     expect(apiCalls.filter((call) => call.includes('/api/my/students'))).toEqual([]);
  71  |     expect(apiCalls.filter((call) => !/^2\d\d /.test(call))).toEqual([]);
  72  |     await expect(page.getByText(cat(en, 'Dashboard.studentsError'))).toHaveCount(0);
  73  |   });
  74  | 
  75  |   test('every card equals the live payload the render consumed', async () => {
  76  |     expect(wire.length).toBeGreaterThan(0);
  77  |     // scoring/10 (R-16): the teacher lands on the class list, whose h1 is the
  78  |     // results screen's own — not the retired dashboard's title.
  79  |     await expect(page.getByRole('heading', { level: 1 })).toHaveText(cat(en, 'Teacher.results.title'));
  80  |     await expect(cards(page)).toHaveCount(wire.length);
  81  | 
  82  |     for (const klass of wire) {
  83  |       const card = page.locator(`[data-class-id="${klass.class_document_id}"]`);
  84  |       await expect(card.getByText(klass.name, { exact: true })).toBeVisible();
  85  |       // The row prints the roster as label + bare count (no plural sentence).
  86  |       await expect(card.getByText(cat(en, 'Teacher.results.list.studentsLabel'))).toBeVisible();
  87  |       await expect(card.getByText(String(klass.student_count), { exact: true })).toBeVisible();
  88  | 
  89  |       for (const [labelKey, completion] of [
  90  |         [`${TD}.testA`, klass.test_a],
  91  |         [`${TD}.testB`, klass.test_b],
  92  |       ] as const) {
  93  |         const label = cat(en, labelKey);
  94  |         const params = {
  95  |           completed: String(completion.completed),
  96  |           total: String(completion.total),
  97  |         };
  98  |         // Read the <dd> PAIRED with this <dt>, so Test B cannot pass on Test A's row.
  99  |         await expect(
  100 |           card.locator('dt', { hasText: label }).locator('xpath=following-sibling::dd[1]'),
  101 |         ).toHaveText(icu(cat(en, `${TD}.completionValue`), params));
  102 |         await expect(
  103 |           card.getByRole('progressbar', {
  104 |             name: icu(cat(en, `${TD}.completionAria`), { label, ...params }),
  105 |           }),
  106 |         ).toHaveCount(1);
  107 |       }
  108 |       // The retired card's `data-top-gap` tile is R-01 territory: the results
  109 |       // row's contract carries the A/B completions and the derived status —
  110 |       // the subskill gap moved to the class results detail's skill tabs.
  111 |       await expect(card).not.toHaveAttribute('data-top-gap');
  112 |     }
  113 |   });
  114 | 
  115 |   test('no overflow at 375 or 1280, and axe finds no blocker', async () => {
  116 |     for (const [name, width, height] of [
  117 |       ['desktop-1280', 1280, 900],
  118 |       ['mobile-375', 375, 812],
  119 |     ] as const) {
  120 |       await page.setViewportSize({ width, height });
  121 |       await expect(page.locator('[data-slot="teacher-class-cards"]')).toBeVisible();
  122 | 
  123 |       const overflow = await measureOverflow(page);
  124 |       expect(overflow.doc, `${name} page scrolls horizontally`).toBe(0);
  125 |       for (const card of overflow.cards) expect(card, `${name} card overflows`).toBe(0);
  126 |       expect(overflow.columns).toBe(width === 1280 ? Math.min(2, wire.length) : 1);
  127 | 
  128 |       const results = await new AxeBuilder({ page })
  129 |         .include('[data-surface="teacher-results"]')
  130 |         .analyze();
  131 |       // Only landmark best-practice rules are tolerated: SidebarInset is itself a
  132 |       // <main>, so every screen module in this app nests one. Shell-wide, and the
  133 |       // untouched parent Overview reports the same two.
  134 |       expect(
  135 |         results.violations
  136 |           .filter((v) => v.impact === 'serious' || v.impact === 'critical')
  137 |           .map((v) => `${v.impact}:${v.id}`),
  138 |       ).toEqual([]);
  139 | 
  140 |       await page.screenshot({
  141 |         path: path.join(SCREENSHOTS, `032-teacher-dashboard-${name}.png`),
  142 |         fullPage: true,
  143 |       });
  144 |     }
  145 |     await page.setViewportSize({ width: 1280, height: 900 });
  146 |   });
  147 | 
  148 |   test('completion is carried as text, never by the bar fill alone', async () => {
  149 |     const bars = page.getByRole('progressbar');
  150 |     await expect(bars).toHaveCount(wire.length * 2);
  151 |     for (let index = 0; index < wire.length * 2; index += 1) {
  152 |       const bar = bars.nth(index);
  153 |       const valuetext = await bar.getAttribute('aria-valuetext');
  154 |       expect(valuetext).toMatch(/^\d+ \/ \d+$/);
  155 |       await expect(bar).toContainText(valuetext ?? '');
  156 |     }
  157 |   });
  158 | 
  159 |   test('a null top_gap renders the honest empty state, never a zero', async () => {
  160 |     await withWire(page, (body) => {
  161 |       body.classes[0].top_gap = null;
  162 |     });
```