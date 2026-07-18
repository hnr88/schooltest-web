# CONTRACTS.md — single source of truth for this mission

Mission: implement the design system + landing page from `/design-system-and-components/`
(authoritative spec) in `schooltest-web`. All landing copy from i18n JSONs (en/de) — nothing
hardcoded. This mission has NO HTTP/API endpoints; contracts are: tokens, component APIs,
content keys, page composition, e2e acceptance.

---

## C-TOKENS — design tokens (owner: task 01)

`src/app/globals.css` is rewritten to the spec token set (tokens.css), converted hex→OKLCH
(exact values listed in task 01 file):

- Brand scales: `--navy-950/900/800`, `--blue-700/600/500/100/50`, `--teal-600/500/100/50`.
- shadcn semantic: `--background #F7F9FC`, `--foreground #0E2350`, `--card/-foreground`,
  `--popover/-foreground`, `--primary #2563EB`, `--primary-foreground`,
  `--secondary #EFF5FF` / `--secondary-foreground #16326E`, `--muted #F1F5F9` /
  `--muted-foreground #64748B`, `--accent #14B8A6` / `--accent-foreground`,
  `--destructive #DC2626`, `--success #16A34A` + `-foreground`, `--warning #D97706` +
  `-foreground`, `--border #E3E8F0`, `--input #CBD5E1`, `--ring` = primary @ 35%,
  `--radius: 0.625rem`.
- `.dark` overrides per spec (`--background #0B1226` … `--ring` blue-500 @ 45%).
- `--chart-1..5`, `--sidebar*` per spec light+dark.
- Shadows: `--shadow-sm/md/lg/xl` (navy 900 at 6/8/12/18%).
- Typography: Google Sans (`--font-sans`) via next/font/local; scale tokens
  `--text-display` 56/700 lh 1.05 ls −0.03em (fluid clamp ok), h1 40/700, h2 32/700,
  h3 24/600, h4 18/600 — expressed with Tailwind utilities in components, not extra tokens
  (except `--text-display`, kept).
- Old brand tokens (rausch/babu/arches/canvas/ink/divider/progress-track) REMOVED in task 12
  after the old landing module is gone (D3).
- Fonts copied to `src/app/fonts/`; brand assets to `public/brand/` (logo.png,
  logo-mark.png, hero-field.webp).

## C-DS — design-system module API (owner: tasks 03–06; module `src/modules/design-system/`)

Wrappers/composites over read-only `src/components/ui/*` (law 11). All components accept
`className` and merge with `cn()`. Prop types live in `types/` per module-pattern rule;
cva `VariantProps` inference may stay co-located (shadcn idiom). Barrel `index.ts` is the
only import surface. Variant/size names follow shadcn conventions (lowercase string unions).

- `Logo` — props: `variant: 'lockup' | 'mark'` (default lockup), `theme: 'color' | 'white'`
  (white = CSS filter brightness-0 invert, per spec), `alt: string`, `height?: number`.
  next/image, assets from /public/brand/.
- `Eyebrow` — section kicker; props `tone: 'blue' | 'teal'` (default blue); uppercase,
  tracking wide, text-xs font-bold.
- `Button` — wraps ui/Button; variants: `default | navy | accent | secondary | outline |
  ghost | destructive | link | white | outline-white`; sizes: ui sizes + `xl` (hero CTA,
  h-12 px-7 rounded-xl); extra prop `loading?: boolean` (Spinner + disabled + aria-busy,
  keeps label width).
- `Badge` — wraps ui/Badge; variants: `default | secondary | navy | accent | success |
  warning | error | outline | ghost | link`.
- `StatusBadge` — dot + label; props `status: 'live' | 'scheduled' | 'draft'`, `label`.
- `Tag` — removable chip ('use client'); props `label`, `onRemove?: () => void`.
- `CountBadge` — notification count; props `count: number`, `ariaLabel?`.
- `Alert` — variants `info | success | warning | error`; 36px tinted icon tile, `title`,
  children as description, optional `action?: ReactNode`, optional `onDismiss?: () => void`
  (renders named dismiss button when provided).
- `ProgressBar` — props `value: number` (0–100), `tone: 'gradient' | 'solid'` (gradient =
  blue-600→teal-500 per spec), required `ariaLabel`.
- `StatCard` — props `icon: LucideIcon`, `iconTone: 'blue' | 'teal' | 'navy'`, `label`,
  `value`, `delta?: string`, `deltaTone?: 'positive' | 'neutral'`, `progress?: number`.
- `FeatureCard` — props `icon: LucideIcon`, `title`, `description`, `tone: 'light' | 'navy'`.
- `EmptyState` — props `icon: LucideIcon`, `title`, `description`, `action?: ReactNode`.
- `PresenceAvatar` — Avatar+Fallback initials; props `initials`, `size: 'sm' | 'default' |
  'lg' | 'xl'` (24/32/40/56px), `presence?: 'online' | 'offline'`.
- `SegmentedControl` — 'use client', on ui/toggle-group; props `options: {value,label}[]`,
  `value`, `onValueChange`, `ariaLabel`. Sheet family re-exported and demoed (showcase
  SheetDemo island, added 2026-07-17 after final-critic pass 1).
- `Container` — max-w per spec (1200px) mx-auto px-6; `Section` — `<section>` with vertical
  rhythm + optional `id`.
- Re-exports through the barrel (single import surface, no edits to ui/*): Card family,
  Input, Textarea, Label, Checkbox, RadioGroup, Switch, Select family, NativeSelect, Field
  family, InputGroup family, Progress, Skeleton, Spinner, Dialog family, DropdownMenu family,
  Tooltip family, Popover family, Avatar/AvatarFallback, Tabs family, Table family,
  Pagination family, Breadcrumb family, Separator, Accordion family.

## C-CONTENT — i18n catalogs (owner: task 02)

- `Home` namespace fully restructured to the new landing copy (exact en literal in task 02
  file; de.json mirrors with identical key shape — parity enforced by key-diff script).
- New `DesignSystem` namespace for the showcase page (en+de).
- Untouched namespaces: Nav, Articles, Auth, LocaleSwitcher, Common.
- Conventions: PascalCase namespaces, camelCase keys, ICU params `{value}` where dynamic,
  `t.rich` for inline markup (hero line break, flow title spans).
- Numbers/scores that are spec content (e.g. "8.5", "2.4M") live in the messages, NOT in
  components (nothing hardcoded).

## C-PAGES — page composition contracts

### C-PAGE-LANDING (owner: tasks 08–12) — route `/`
Order (spec Landing.dc.html), each its own server component in `src/modules/landing/`:
1. `AnnouncementBar` (navy strip, message + Learn more → `#ai-feedback`)
2. `LandingHeader` (sticky, logo, nav anchors, Sign in→`#cta`, Start free→`#pricing`;
   `MobileNav` client sheet for <lg)
3. `HeroSection` — navy rounded-4xl card (page.tsx owns `<main id="main-content">` wrapping sections 3–12), hero-field.webp bg + navy scrim,
   badge pill, h1 (rich, 2 lines), subtitle, CTAs (`#pricing`, `#product`), microcopy
4. `HeroFlow` — rich title (blue/teal spans) + 3 numbered steps with arrows
5. `TrustedByStrip` — label + 5 wordmarks
6. `FeaturesSection` id=`product` — eyebrow, h2, 3 FeatureCards (middle = navy tone)
7. `FeatureDetailSection` id=`ai-feedback` — copy + checklist + `AiFeedbackCard`
   (BETA badge, 3 score bars, suggestion box)
8. `StatsBand` — navy rounded band, watermark logo-mark, 3 stats
9. `HowItWorksSection` id=`for-schools` — 3 steps card + `TestimonialCard` (5 stars, quote,
   avatar initials LP)
10. `PricingSection` id=`pricing` — 3 tiers (Free outline / Pro navy + "Most popular" badge /
    School outline); CTAs → `#cta`
11. `FaqSection` id=`resources` — h2 + Accordion, 4 items, first open by default
12. `CtaSection` id=`cta` — navy gradient panel, watermark, h2, sub, 2 buttons
13. `LandingFooter` — navy, white logo + tagline, socials, 2 link columns (section anchors; the spec's Company column omitted — no real targets, same rationale as the D7 legal-link omission),
    LocaleSwitcher, bottom bar (copyright + status pill)
`page.tsx` composes them; `generateMetadata` from `Home.meta`. ONE h1 (hero). `Nav`/header
anchor targets all exist (D7).

### C-PAGE-DS (owner: task 07) — route `/design-system`
Server component showcasing EVERY barrel export with ALL variants (buttons ×10 variants ×
sizes + loading/disabled/icon; badges ×9 + status/tag/count; alerts ×4 + actions/dismiss;
cards; stat cards; feature cards; form controls + field states (default/error/disabled);
tabs; segmented; table + pagination; dialog/dropdown/tooltip/popover demos; avatars;
progress; empty state; logo variants; eyebrow). Client demo islands only where interactivity
is required. Copy from `DesignSystem` namespace. generateMetadata from same namespace.

## C-E2E — acceptance flows (owner: tasks 13–15; Playwright, port 3100)

1. **E2E-LANDING-EN/DE**: `/` renders every section (13) with strings from en.json; with
   `NEXT_LOCALE=de` cookie every asserted string equals de.json values; zero en leakage in de
   mode (and vice versa); no hardcoded user-visible copy (asserted by catalog spot-checks
   across all sections incl. aria labels).
2. **E2E-DS-VARIANTS**: `/design-system` renders every export; each variant prop visibly
   distinct (per-component role/text queries); interactive demos work (dialog opens/closes,
   dropdown item clickable, tooltip on hover/focus, segmented switches value, tag removes,
   alert dismisses, pagination/tabs switch).
3. **E2E-LOCALE-TOGGLE**: footer LocaleSwitcher en→de updates ALL landing content (hero,
   sections, footer) without reload-navigation (cookie + router.refresh); de→en back.
4. **E2E-COMPOSITION**: landing DOM contains each section component landmark in contract
   order (ids/roles/data-slot), proving separate reusable components; every header/footer
   anchor href resolves to an existing element id.
5. **E2E-DS-PROPS**: component prop types match shadcn conventions — compile-time: tsc;
   runtime: variants render (covered by E2E-DS-VARIANTS) + showcase exercises every
   configurable prop (className merge verified via computed style on one custom className).
6. **E2E-A11Y-RESP**: axe (serious/critical = 0) on `/` + `/design-system`; 375px + 1280px:
   no horizontal scroll, no console errors, touch targets ≥44px on interactive elements;
   screenshots to .qa/screenshots/ (en, de, mobile, dark optional).

Existing `tests/e2e/home.spec.ts` must stay green (title /Schooltest/i — new meta title
"SchoolTest — …" matches; /articles untouched).

### C-PAGE-DS addendum (2026-07-17, task-14 verify)
`PaginationLink`/`PaginationPrevious`/`PaginationNext` (ui re-exports) are NOT exercised
on the showcase: the vendored ui/pagination.tsx renders anchors with role=button +
a hydration data-slot mismatch (proven in Base UI useButton source), and law 11 forbids
editing it. The showcase demos pagination with DS Button href (real link semantics)
plus Pagination/PaginationContent/PaginationItem/PaginationEllipsis (still exercised).
