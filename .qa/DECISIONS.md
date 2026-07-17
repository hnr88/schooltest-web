# DECISIONS.md — operational choices made under full autonomy

Mission intake answered: "no question asked form now full autonomus" → detected defaults adopted, no questions asked. Logged per RULES OF ENGAGEMENT #2.

## 2026-07-17 D1 — Mission scope is schooltest-web ONLY
The `design-system-and-components/` folder (repo root) is the authoritative design spec.
Deliverables: (a) a reusable design-system module wrapping the shadcn-on-Base-UI primitives
with the spec's variants, (b) the full landing page built from separate section components,
(c) all landing copy from `src/i18n/messages/{en,de}.json` — nothing hardcoded.
schooltest-api / schooltest-app are NOT touched. No datastore: landing content is static and
lives in the message catalogs (the "langs JSONs" of the spec).

## 2026-07-17 D2 — Design-source precedence within the spec folder
`SchoolTest Landing.dc.html` is the landing source of truth (11 sections, exact copy).
`SchoolTest Design System.dc.html` (== export-src.dc.html) is the component/tokens source.
`tokens.css` is the token source ("Drop into app/globals.css"). The `-print-` hero variant
(dashboard mockup) and `SchoolTest App Screens.dc.html` are EXCLUDED: app/product screens are
not part of "the design system + landing page" mission; the non-print hero (copy + 3-step
flow) is implemented. App-screen composites (MCQ player, PTE task cards, dashboards) are
excluded from the design-system module — they are product features, not primitives.

## 2026-07-17 D3 — Old landing replaced; old brand tokens removed
The previous landing (Australia/EAL-D positioning, `Home.*` keys, rausch/babu/arches tokens)
is REPLACED by the spec'd SchoolTest landing. Grep proved the old brand classes
(rausch/babu/arches/canvas/ink/divider/progress-track) are used ONLY by the old landing
module + page.tsx → tokens are removed from globals.css when the module is rewritten
(task 12), leaving ONE design system (no parallel dead brands).

## 2026-07-17 D4 — Tokens ported hex→OKLCH
tailwind.md mandates OKLCH only. All tokens.css hex values were converted to exact OKLCH
(sRGB→linear→XYZ→OKLab→OKLCh, 4-decimal rounding) and embedded in task 01's file. Brand
scale names: navy-950/900/800, blue-700/600/500/100/50, teal-600/500/100/50 + shadcn
semantic tokens (background…ring), success/warning added (spec ships them), charts, sidebar,
shadows sm–xl. Dark mode: spec's `.dark` overrides.

## 2026-07-17 D5 — Font: Google Sans via next/font/local
Spec ships GoogleSans-Variable.ttf (+Italic). quality.md mandates next/font; tailwind.md's
approved-font list conflicts with the authoritative spec → spec wins (logged). Geist removed
from layout.tsx; Google Sans wired with next/font/local (variable, weights 400–800).

## 2026-07-17 D6 — Port 3100 + Playwright-managed server
Port 3000 is BUSY (neighbor instance). 3100 probed FREE → frontend e2e port.
CLAUDE.md law 12 (never run dev/build/start) reconciled with the mission's real-app
verification: `playwright.config.ts` gets a `webServer` block (`next dev -p 3100`), so the
allowed command `pnpm exec playwright test` manages the full lifecycle. No manual servers,
no docker (repo runs natively for dev).

## 2026-07-17 D7 — Links: zero dead ends, no fake pages
The product app (sign-in, register, legal pages, social profiles) does not exist in this
repo. To avoid controls wired to 404s/nothing:
- All CTAs (header "Start free", hero, pricing, final CTA) → existing on-page anchors
  (`#pricing`, `#cta`); "Watch demo" → `#product`; announcement "Learn more" → `#ai-feedback`;
  "Sign in" → `#cta`.
- Nav items: Product→`#product`, For schools→`#for-schools`, Pricing→`#pricing`,
  Resources→`#resources` (sections carry those ids).
- Footer columns map to the same section anchors.
- Social icons → real external hrefs (https://x.com/schooltest,
  https://www.youtube.com/@schooltest, https://www.linkedin.com/company/schooltest) —
  brand handles to be updated by marketing.
- Legal links (Privacy/Terms/Security) OMITTED this milestone (no routes exist; a fake link
  is worse than an honest omission). Bottom bar = copyright + status pill.

## 2026-07-17 D8 — Showcase route /design-system
Acceptance requires "a test page" rendering every design-system export with variants →
public route `/design-system` (same pattern as the existing `/articles` demo route), copy
from a `DesignSystem` i18n namespace (en+de), server component + small client demo islands
for interactive widgets (dialog, segmented control, dismissible alert, removable tag).

## 2026-07-17 D9 — Hero image extracted from the spec
The hero photo lives as a base64 data-URI inside `.image-slots.state.json` (key
`hero-field`, 1200×800 WebP). Task 01 extracts it to `public/brand/hero-field.webp`;
logos copied to `public/brand/{logo.png,logo-mark.png}`; white logo variants via CSS filter
(brightness-0 invert) exactly as the spec does — no duplicated assets.

## 2026-07-17 D10 — Watchdog adapted: no persistent servers
Detected run path = on-demand Playwright webServer; there are no long-running servers or
infra for a watchdog to restart. qa-watchdog.sh therefore runs ONLY the stuck-checker
(11–50 tasks band: CHECK_EVERY=600, STALL_LIMIT=600, HARD_STALL=1200); server-restart blocks
are disabled by config and documented in the script header.

## 2026-07-17 D11 — @axe-core/playwright added (devDependency)
Mission §F explicitly authorizes an accessibility engine for e2e. This is the only new
dependency. No runtime deps added.

## 2026-07-17 D12 — i18n: keep `Home` namespace for landing, add `DesignSystem`
Page already uses `Home.*`; keys are fully restructured to the new catalog (task 02 carries
the exact en literal; de translated to match, key-parity enforced by script). `Articles`,
`Auth`, `LocaleSwitcher`, `Common`, `Nav` namespaces untouched.

## 2026-07-17 D13 — German price format
Wave-1 critic NOTE: de.json prices now symbol-after ("0 $", "29 $") for consistency
with the localized number formats ("2,4 Mio.", "6 Std."). USD branding kept.

## 2026-07-17 D14 — DS actions/brand judgment calls (task 03)
- Loading `Button` renders ui `Spinner` with `aria-hidden="true"` (button keeps `aria-busy`):
  ui/spinner.tsx hardcodes an English `aria-label="Loading"` and ui/* is read-only — hiding the
  decorative spinner prevents en leakage in de mode while the button label stays visible.
- DS `Badge` variant union EXCLUDES ui's `destructive` (C-DS list has `error` instead).
- Badge `warning`/`error` dark variants (amber-950/300, red-950/300) inferred from the task's
  own success/accent dark pattern (task specifies light tints only for these two).
- `Logo` width derived from intrinsic aspect (503×160 lockup, 179×119 mark, verified on disk)
  via Math.round — next/image requires numeric width/height.
- Arbitrary values `text-[15px]`, `text-[11px]`, `tracking-[0.1em]` kept exactly as the task
  file specifies (explicit spec overrides the no-arbitrary-values rule for these).

## 2026-07-17 D15 — Wave-2 critic fixes applied (spec wins over task files)
Critic found 4 SHOULD-FIX where task files deviated from the authoritative DS spec; fixed:
1. Alert icon tiles success/warning/error -50 → spec -100 shades; role="alert" restored.
2. StatusBadge reworked to spec tinted pills (live green / scheduled BLUE (was amber) / draft slate).
3. Tag: removeLabel now required when onRemove set (discriminated union, mirrors Alert).
4. Button destructive overridden to spec solid bg (was ui soft tint).
Plus NOTE fixes: SegmentedControl spacing={1} (spec 4px), ProgressBar track h-1.5 (spec 6px).
Pixel-level NOTEs (font-size nits, inherited ui colors) intentionally left — scope discipline.
