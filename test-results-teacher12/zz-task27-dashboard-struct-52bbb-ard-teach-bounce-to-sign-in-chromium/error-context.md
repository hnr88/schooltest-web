# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-task27-dashboard-structure.spec.ts >> task 27: dashboard route structure + role redirect >> signed out: /dashboard/school and /dashboard/teach bounce to /sign-in
- Location: tests/e2e/zz-task27-dashboard-structure.spec.ts:127:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/sign-in" until "load"
  navigated to "http://localhost:3002/dashboard/teach/classes"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - img "404" [ref=e4]:
        - text: "404"
        - img [ref=e6]
      - generic [ref=e9]:
        - heading "This page hopped away" [level=1] [ref=e10]
        - paragraph [ref=e11]: The link may be broken, or the test may have been deleted.
      - generic [ref=e12]:
        - link "Back to dashboard" [ref=e13] [cursor=pointer]:
          - /url: /
        - link "Report a problem" [ref=e14] [cursor=pointer]:
          - /url: mailto:support@schooltest.app
  - generic [ref=e15]:
    - img [ref=e17]
    - button "Open Tanstack query devtools" [ref=e65] [cursor=pointer]:
      - img [ref=e66]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e119] [cursor=pointer]:
    - img [ref=e120]
  - alert [ref=e123]
```

# Test source

```ts
  36  |   test('school_admin: /dashboard redirects to /dashboard/school with real C-SCH-01 data', async ({
  37  |     page,
  38  |   }) => {
  39  |     await signIn(page, SCHOOL_ADMIN.email, SCHOOL_ADMIN.password, '/dashboard/school');
  40  |     const home = page.locator('[data-surface="school-admin-home"]');
  41  |     await expect(home).toBeVisible({ timeout: 20_000 });
  42  |     await expect(home.getByRole('heading', { name: SCHOOL_NAME })).toBeVisible();
  43  | 
  44  |     // The two lifecycle badges moved off the analytics home into
  45  |     // Account > My account > School details (redesign spec section 5).
  46  |     await page.goto('/dashboard/school/account');
  47  |     const details = page.locator('[data-slot="account-details-card"]');
  48  |     await expect(details).toBeVisible({ timeout: 20_000 });
  49  |     await expect(
  50  |       details.getByText(cat(en, 'SchoolAdmin.accountStatus.active'), { exact: true }),
  51  |     ).toBeVisible();
  52  |     await expect(
  53  |       details.getByText(cat(en, 'SchoolAdmin.onboardingStatus.not_started'), { exact: true }),
  54  |     ).toBeVisible();
  55  | 
  56  |     // The thin section pages behind the task-25 nav items render, not 404.
  57  |     for (const [path, surface] of [
  58  |       ['/dashboard/school/classes', 'school-admin-classes'],
  59  |       ['/dashboard/school/students', 'school-admin-students'],
  60  |       ['/dashboard/school/teachers', 'school-admin-teachers'],
  61  |     ] as const) {
  62  |       await page.goto(path);
  63  |       await expect(page.locator(`[data-surface="${surface}"]`)).toBeVisible({ timeout: 20_000 });
  64  |     }
  65  | 
  66  |     // TeacherGuard keeps a school_admin out of the teacher section. R-12
  67  |     // retired the section root, so the guard is proven on a surviving route.
  68  |     await page.goto('/dashboard/teach/classes');
  69  |     await page.waitForURL('**/dashboard/school', { timeout: 20_000 });
  70  |     await expect(page.locator('[data-surface="teacher-results"]')).toHaveCount(0);
  71  |   });
  72  | 
  73  |   test('teacher: /dashboard renders the teacher dashboard; school section bounces', async ({
  74  |     page,
  75  |   }) => {
  76  |     await signIn(page, TEACHER.email, TEACHER.password, '/dashboard');
  77  |     // scoring/10 (R-16): the teacher is now redirected to the class list.
  78  |     await page.waitForURL('**/dashboard/results', { timeout: 20_000 });
  79  |     await expect(page.locator('[data-surface="teacher-results"]')).toBeVisible({
  80  |       timeout: 20_000,
  81  |     });
  82  | 
  83  |     // SchoolAdminGuard bounces a teacher to the role-filtered dashboard.
  84  |     await page.goto('/dashboard/school');
  85  |     await page.waitForURL('**/dashboard/results', { timeout: 20_000 });
  86  |     await expect(page.locator('[data-surface="teacher-results"]')).toBeVisible();
  87  |     await expect(page.locator('[data-surface="school-admin-home"]')).toHaveCount(0);
  88  |   });
  89  | 
  90  |   test('parent: portal masked flag-OFF; school + teach sections bounce to /dashboard', async ({
  91  |     page,
  92  |   }) => {
  93  |     await signIn(page, PARENT.email, PARENT.password, '/dashboard');
  94  |     // Flag OFF (NEXT_PUBLIC_PARENT_VIEWS_ENABLED=false): the parent portal is
  95  |     // masked behind the not-available state (W11). The (portal) routes still
  96  |     // resolve; they render the mask, not the old parent surfaces.
  97  |     await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
  98  |       timeout: 20_000,
  99  |     });
  100 |     expect(page.url()).not.toContain('/dashboard/school');
  101 |     expect(page.url()).not.toContain('/dashboard/teach');
  102 | 
  103 |     await page.goto('/dashboard/school');
  104 |     await page.waitForURL('**/dashboard', { timeout: 20_000 });
  105 |     await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
  106 |       timeout: 20_000,
  107 |     });
  108 | 
  109 |     // scoring/10 (R-12): the teach ROOT is retired (404 for everyone); a
  110 |     // surviving guarded teach route still bounces a parent to /dashboard.
  111 |     await page.goto('/dashboard/teach/classes');
  112 |     await page.waitForURL('**/dashboard', { timeout: 20_000 });
  113 |     await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
  114 |       timeout: 20_000,
  115 |     });
  116 | 
  117 |     // Existing parent routes still load under the (portal) route group, masked.
  118 |     await page.goto('/dashboard/children');
  119 |     await expect(page).toHaveURL(/\/dashboard\/children/, { timeout: 20_000 });
  120 |     await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({
  121 |       timeout: 20_000,
  122 |     });
  123 |     await page.goto('/dashboard/settings');
  124 |     await expect(page).toHaveURL(/\/dashboard\/settings/, { timeout: 20_000 });
  125 |   });
  126 | 
  127 |   test('signed out: /dashboard/school and /dashboard/teach bounce to /sign-in', async ({
  128 |     page,
  129 |   }) => {
  130 |     await page.goto('/dashboard/school');
  131 |     await page.waitForURL('**/sign-in', { timeout: 20_000 });
  132 | 
  133 |     // scoring/10 (R-12): the teach root is gone; a surviving guarded route
  134 |     // still bounces an anonymous visitor to /sign-in.
  135 |     await page.goto('/dashboard/teach/classes');
> 136 |     await page.waitForURL('**/sign-in', { timeout: 20_000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  137 |   });
  138 | });
  139 | 
```