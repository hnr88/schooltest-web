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

## 2026-07-17 D16 — Task-07 showcase decisions (merged from .thellmspace/DECISIONS.md)
# DECISIONS.md — mission decision log

## Task 07 — /design-system showcase page

1. **Demo fixture data is hardcoded, all prose is not.** The `DesignSystem` namespace
   (106 keys, en/de parity from task 02) has no keys for: StatCard values ("24", "312",
   "8.4"), table dates/question counts/averages/footer totals, pagination page numbers,
   avatar initials (LP/MK/JD/AW/ST), AvatarGroupCount "+9", the "⌘D" shortcut glyph, the
   invalid-email `defaultValue` ("demo@schooltest"), and the popover share-link URL
   ("https://schooltest.app/t/science-quiz"). Task 07 mandates EXACTLY the existing
   namespace keys and law 4 forbids touching task 02's catalog contract, so these are
   shipped as presentational fixtures (numbers/initials/symbols/URLs — zero English
   words). Every user-facing word, aria-label, and alt text comes from `DesignSystem.*`.
2. **ui-default English strings remain in read-only primitives.** `PaginationPrevious`/
   `PaginationNext` visible text ("Previous"/"Next"), their aria-labels, the pagination
   nav aria-label ("pagination"), and `Spinner`'s aria-label ("Loading") are hardcoded
   inside `src/components/ui/*`, which law 11 makes read-only. No `DesignSystem` keys
   exist to override them with (`text` prop left at default). Flagged for tasks 14–15:
   de mode will show these ui defaults on /design-system.
3. **No pagination island.** The task file's island list is explicit and exhaustive
   ("Client islands ONLY": TagDemo, AlertDismissDemo, DialogDemo, DropdownDemo,
   PopoverDemo, SegmentedDemo; tooltip composed directly since ui Tooltip is already
   client). Pagination therefore renders as plain anchors (`href="#"`, page 1
   `isActive`). C-E2E-DS-VARIANTS mentions "pagination/tabs switch" — tabs switch via
   uncontrolled Base UI Tabs (`defaultValue`); pagination has no state. Task 14 must
   assert accordingly.
4. **7 barrel exports render through composition, not direct JSX**: `DialogPortal` +
   `DialogOverlay` (inside ui `DialogContent`, src/components/ui/dialog.tsx:50-52),
   `DropdownMenuPortal` (inside ui `DropdownMenuContent`, dropdown-menu.tsx:34),
   `SelectScrollUpButton` + `SelectScrollDownButton` (inside ui `SelectContent`,
   select.tsx:89,91), `ProgressTrack` + `ProgressIndicator` (inside ui `Progress` root,
   progress.tsx:21-23). Placing them directly would duplicate portals/tracks; they do
   render in the DOM via the composed parents.
5. **Namespace key reuse where no dedicated key exists**: SegmentedControl
   `ariaLabel` = `sectionData`; CountBadge `ariaLabel` = `buttonNotifications`; popover
   link-input aria-label = `tooltipContent` ("Copy share link"); dropdown group labels
   = `tableTest` / `selectLabel`; dropdown sub-menu items = `tooltipContent` /
   `popoverCopy`; accordion items reuse the `tabs*` keys; Badge variant labels cycle
   `badgeLive`/`badgeScheduled`/`badgeDraft`/`tagGrade`.
6. **Structural splits for the size rules**: `ChoiceControls` extracted from
   `FormsSection` (component ≤120 lines); `components/showcase/index.ts` sub-barrel
   added and re-exported via `export * from './components/showcase'` under the
   barrel's `// showcase` group (module barrel stays ≤200 lines). `ChoiceControls` and
   `DataTable` are internal helpers, intentionally not barrel-exported.
7. **AvatarImage src** points to `/brand/logo-mark.png` (the only suitable public
   image) so the `AvatarImage` export renders a real image; alt from `avatarAlt`.
8. **Choice controls use `aria-labelledby`** (Checkbox/RadioGroupItem/Switch render
   `<span role="...">` in Base UI, so `htmlFor` association is impossible); visible
   `Label` siblings carry the ids. RadioGroup additionally gets
   `aria-label={t('selectLabel')}`.

## 2026-07-17 D17 — Pagination i18n
Added DesignSystem.paginationPrevious/Next(+Aria)/NavAria keys (en+de) and passed
text/aria-label props in the showcase data-table (ui/pagination defaults are English).
Demo fixtures in the showcase (numerals, initials, dd.mm dates, demo@schooltest, share URL)
are locale-invariant data, not copy — accepted by verifier ruling.

## 2026-07-17 D18 — Wave-3 critic fixes
1. ui-baked English sr-only leaks addressed showcase-side: dialog demo now uses
   showCloseButton={false} + own DialogClose X (dialogCloseLabel key); Spinner gets
   spinnerLabel; Breadcrumb nav gets breadcrumbNavAria. Ellipsis sr-only strings
   (pagination/breadcrumb "More") live in aria-hidden subtrees — not exposed, documented.
2. All 48 upward-relative imports in the design-system module converted to @/ alias
   (imports.md compliance); same-dir ./x imports kept.

## 2026-07-17 D19 — Wave-4 critic fixes
Desktop header targets bumped to ≥44px: nav links py-3, Sign in / Start free h-11.
Inline text links (announcement, footer columns) stay exempt per WCAG 2.5.8 inline
exception + C-E2E-6 standalone-controls scoping. Contract-over-spec drift accepted:
flow strip inside navy hero card, horizontal scrim, hero pill without decorative dot,
rounded-4xl token radii.

## 2026-07-17 D20 — LocaleSwitcher client-graph violation (task-12 verify FAIL → fix)
Verifier proved / returned 500: LocaleSwitcher (client) imported LOCALE_COOKIE from
@/i18n/request which imports next/headers (server-only) — latent since the switcher was
never rendered before the task-11 footer. Fix: LOCALE_COOKIE moved to isomorphic
src/i18n/routing.ts; request.ts and LocaleSwitcher.tsx import it from there.
Lesson recorded for the mission: tsc+lint do not catch server/client boundary violations
— runtime smoke is mandatory before closing integration tasks.

## 2026-07-17 D21 — DS Button gains href prop (true link semantics)
Task-13 surfaced Base UI warning for render={<a/>} buttons; first fix (nativeButton=
false) silenced it but Base UI then applies role=button — wrong for navigation CTAs.
Correct design: DS Button now takes href and renders a real <a> styled via
buttonVariants (shadcn idiom); Base UI Button is used only for actual buttons.
All 7 landing CTA usages converted from render={<a/>} to href. nativeButton passthrough
kept for other render cases.

## 2026-07-17 D22 — Task-15 a11y sweep: real fixes + showcase 44px ruling
1. **Fixed (real defects, markup-side):** skip link moved out of LandingHeader to be the
   first focusable element on '/' (was preceded by the announcement link, WCAG 2.4.1);
   header logo Link padded to a 46px target; LocaleSwitcher trigger min-h-11 (was 32px);
   announcement text container div→p (documents the D19 inline-link exemption in markup);
   MobileNav SheetClose render={<a>} replaced by controlled Sheet + real links closing via
   onClick (Base UI logged console.errors and dropped link semantics — same class of issue
   as D21); six serious axe color-contrast violations fixed in own components: TrustedBy
   wordmarks muted-foreground/70→slate-600 (2.63→7.2:1), Eyebrow teal-600→teal-700
   (3.55→5.2:1), StatCard delta green-600→green-700 (3.21→5.0:1), DS Button accent variant
   white-on-teal-500→navy-900-on-accent with teal-400 hover (2.48→6.3:1), DS Button
   destructive variant text-destructive-foreground→text-white (the
   --color-destructive-foreground token was never registered in @theme, so the utility
   generated no CSS and text inherited navy-on-red 3.16:1 → 4.83:1), showcase avatar
   fallbacks / tabs triggers / segmented items muted-foreground→slate-600 (4.34/4.1→7.2:1).
   Vendored ui untouched (law 11) — all fixes in modules/* or app/*.
2. **Showcase 44px ruling:** the 44px target sweep asserts zero failures on '/' (375+1280).
   On '/design-system' it is collected and logged, not asserted: the gallery exhibits the
   full vendored size scale (h-7…h-9 buttons, size-8 icons, size-4 checkboxes, 18px
   switches, h-8 inputs) which law 11 forbids editing and task-14's spec explicitly asserts
   (button.h-7/.h-8/.h-9) — a three-way contract conflict. The showcase is a component
   gallery, not user-facing UI chrome; small sizes there are essential to the information
   conveyed (WCAG 2.5.8 essential-presentation exception). 43 undersized exhibits at both
   widths, all vendored-primitive demos.
3. **Test-infra notes:** TanStack Query devtools trigger (dev-only, absent from production
   builds) is excluded from the sweep (.tsqd-parent-container). Playwright screenshots hide
   the caret by writing inline caret-color:transparent — taking one while the RSC tree is
   still hydrating triggers a spurious React hydration-mismatch console.error, so the
   responsive spec waits for networkidle after goto before screenshots.
4. **Orchestrator follow-up:** `--color-destructive-foreground` registered in @theme
   (globals.css:55) so the token utility now generates for future consumers.


## 2026-07-17 D23 — Final-critic pass-1 fixes
1. Footer Company column REMOVED (About/Blog/Careers/Contact → #cta was label/destination
   fakery, against D7s own rationale); 5 company keys removed; footer grid → 3 columns.
2. Sheet family now demoed on /design-system (SheetDemo island + e2e assertion) — the last
   undemoed barrel family (3 new keys; parity 266).
3. e2e strengthened: flow.title asserted EN+DE; nav.*, pricing suffixes, meta.description
   added; aria-label keys proven rendered (new landing-aria.spec.ts, EN+DE); composition
   chain now covers all 13 sections (data-slot hooks on AnnouncementBar/TrustedBy/StatsBand).
4. Spec files re-split under the 200-line cap (design-system-de.spec.ts).

## 2026-07-17 D24 — Critic pass-5 fixes
1. SheetFooter now demoed (sheet-demo close button lives inside SheetFooter; duplicate
   close button from the move removed — caught by the interactions spec).
2. Turbopack FATAL panic root-caused and eliminated: stray package.json/package-lock.json/
   node_modules at the schooltest root (accidental npm-install debris from this session)
   poisoned Nexts workspace-root inference; debris removed + stale .next cache cleared.
   The turbopack.root config line was reverted (config transpile context resolves neither
   import.meta.dirname nor __dirname correctly — documented for the future).
3. not-found.tsx "← Home" hardcoded string replaced by the Nav.home catalog key (de: Startseite).

## 2026-07-17 D25 — Critic pass-6 clarifications (docs only)
1. D17 wording clarified: pagination text/aria keys are passed to DS Button href anchors,
   NOT to ui PaginationLink/Previous/Next — those 3 exports remain deliberately unexercised
   per the C-PAGE-DS addendum (vendored role=button anchors + hydration mismatch; law 11).
2. D23.2 wording corrected: Sheet was the last undemoed family intended for demo; the
   pagination trio stays unexercised by design (same addendum).
3. Ruling on LandingHeader backdrop-blur: functional sticky-nav treatment straight from the
   spec (rgba white .88 + blur) — accepted as borderline-functional, not the decorative
   glassmorphism tailwind.md bans. No change.

## 2026-07-17 D26 — Critic pass-8 fixes
1. Dark-mode contrast fixed (theme is system-default, so dark is reachable): Eyebrow
   dark:text-blue-300/teal-300; TrustedBy label+wordmarks dark:text-slate-400;
   SegmentedControl items dark:text-slate-400; showcase tab triggers + avatar fallbacks
   dark:text-slate-400. Landing spec is light-first but dark tokens shipped — AA now holds
   in both themes.
2. /design-system added to sitemap.ts.
3. openGraph title/description added to both pages generateMetadata (from catalogs).

## 2026-07-17 D27 — Critic pass-9 fixes (dark family, final)
1. StatCard positive delta dark:text-green-400 (was green-700 = 1.56:1 on dark card).
2. Logo color theme now flips to white in dark mode via dark:brightness-0 dark:invert
   (navy lockup was near-invisible in the dark header/sheet; theme=white path unchanged).
3. HeroFlow blue span text-blue-500 → text-blue-300 (2.72:1 on navy, below the 3:1
   large-text floor; AA fix — spec-light-color kept for light mode since the span lives
   on the navy card in both themes).
4. Decorative teal check icons dark:text-teal-400 (PricingCard, FeatureDetailSection).
5. /design-system openGraph.url set (was inheriting layout og:url "/").

## 2026-07-18 D28 — Spec-fidelity pass (user-reported visual drift)
User review found the implementation drifted from the design in several places. Fixed by
direct comparison against SchoolTest Landing.dc.html renders:
- Hero: flow strip MOVED OUT of the navy card (spec: light section below it — the fill
  image bled into it); scrim → spec vertical gradient token (was heavy horizontal); badge
  teal dot restored; CTAs → spec colors (blue primary + white glass, was white + outline);
  hero container 1360px token; section bg white→background gradient; h1/subtitle text-shadow.
- AI feedback card: rebuilt as spec — blue-50→teal-50 gradient card + blue-200 border,
  3 score TILES with mini bars (was full-width rows), white suggestion box, exact header.
- Icons: CircleCheck → plain Check (pricing, checklist); how-it-works numbers → solid
  blue rounded-squares (was light circles); testimonial avatar teal (initials navy-900 for
  AA); stars amber-500; footer social tiles navy-800.
- Pricing: "Most popular" badge straddles Pro card top edge (spec) instead of in-card.
- Colors: stats accuracy teal-300/saved blue-300/labels slate-400; navy-tier features
  blue-200; footer tagline/column titles slate-400, column links blue-200.
- Sections: features + feature-detail on white (spec alternation), light feature cards
  bg-background + hover lift; FAQ wrapped in the white card; how-it-works card bg-background.
AA kept where the spec itself fails contrast (teal avatar text, muted-foreground role text).
Suite re-verified: 19/19 green, tsc/lint 0 errors, axe 0 serious/critical.

## 2026-07-18 D29 — Exact spec icons (user: "lucide is AI slop")
Lucide glyphs differ from the designs own SVGs (sparkle shape, file-text line count,
play triangle, bar-chart axis). Created LandingIcons.tsx with the EXACT paths extracted
from SchoolTest Landing.dc.html: FileTextIcon, SparklesIcon (big+small), SparkleIcon,
BarChartIcon, PlayIcon (same pattern as SocialIcons.tsx). FeatureCard icon prop type
widened to ComponentType<{className?}> (lucide still compatible). Check/X/Star/ArrowRight
are path-identical to lucide and stay on lucide-react.
