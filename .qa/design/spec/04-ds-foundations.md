# 04 — Design System Foundations

**Scope:** brand/logo, colour system, type scale, buttons, form controls, badges, alerts & toasts.

**Sources read in full (every claim below cites one of these):**

| Ref | Path |
|---|---|
| `[HDR]` | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--header.html` |
| `[LOGO]` | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--logo.html` |
| `[COL]` | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--colors.html` |
| `[TYP]` | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--typography.html` |
| `[BTN]` | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--buttons.html` |
| `[FRM]` | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--forms.html` |
| `[BDG]` | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--badges.html` |
| `[ALR]` | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--alerts.html` |
| `[TOK]` | `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/tokens.css` |
| `[SRC]` | `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/SchoolTest Design System.dc.html` — read for the global `<style>` block (lines 11–25) and the JS state/derived-value block (lines 1526–1727) that resolves the `{{ … }}` placeholders left in the slices |

---

## 0. Markup conventions in the export

The slices are inline-styled HTML with two **non-standard attributes** invented by the export tool. A downstream engineer must read them as pseudo-class specs, not as real HTML:

- `style-hover="…"` — the `:hover` declaration block for that element. Present on buttons `[BTN:8–15,21–26]`, alert action buttons `[ALR:10,15,23,24,34,44,49,54]`.
- `style-focus="…"` — the `:focus` declaration block. Present on text inputs / search input / textarea `[FRM:8,25,39]`.
- `{{ name }}` — a value injected by the demo's React logic; resolved in `[SRC:1536–1553]` (initial state) and `[SRC:1557,1685–1696]` (derived values). Every one is resolved explicitly in this document.
- `<sc-if value="{{ x }}" hint-placeholder-val="{{ true|false }}">` — conditional render; `hint-placeholder-val` is the value used for the static export.

### 0.1 Global stylesheet `[SRC:11–25]`

```css
@font-face { font-family:'Google Sans'; src:url('fonts/GoogleSans-Variable.ttf') format('truetype');
             font-weight:400 800; font-style:normal; font-display:swap; }
@font-face { font-family:'Google Sans'; src:url('fonts/GoogleSans-Italic-Variable.ttf') format('truetype');
             font-weight:400 800; font-style:italic; font-display:swap; }
body { margin:0; background:#F7F9FC;
       font-family:'Google Sans', -apple-system, 'Segoe UI', system-ui, sans-serif;
       color:#475569; -webkit-font-smoothing:antialiased; }
a       { color:#2563EB; text-decoration:none; }
a:hover { color:#1D4ED8; }
input::placeholder, textarea::placeholder { color:#94A3B8; }
input, textarea, button, select { font-family:inherit; }
```

`[TOK:116–129]` declares the same two `@font-face` rules. The `--font-sans` stack in `[TOK:8]` differs slightly from the body stack — it adds `BlinkMacSystemFont` and `system-ui`:
`'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`.

Variable font axis range: **weight 400–800**, normal + italic. Only 400 / 500 / 600 / 700 are actually used across the eight slices.

### 0.2 Keyframes — the complete animation inventory `[SRC:19–24]`

| Name | Keyframes | Animates | Used by |
|---|---|---|---|
| `st-toast-in` | `from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none }` | opacity + translateY | Live toast, `animation:st-toast-in .25s ease` `[SRC:1527]` |
| `st-fade-in` | `from { opacity:0 } to { opacity:1 }` | opacity | dialog scrim `.18s ease` `[SRC:1513]` (outside these slices) |
| `st-pop-in` | `from { opacity:0; transform:scale(.96) } to { opacity:1; transform:none }` | opacity + scale | dialog panel `.18s ease` `[SRC:1514]` (outside these slices) |
| `st-spin` | `to { transform:rotate(360deg) }` | rotation | button loading spinner, `st-spin .7s linear infinite` `[SRC:1580]` |
| `st-shimmer` | `0% { background-position:-400px 0 } 100% { background-position:400px 0 }` | background-position | skeletons `1.4s ease infinite` `[SRC:1327–1334]` (outside these slices) |
| `st-rec-pulse` | `0% { box-shadow:0 0 0 0 rgba(220,38,38,.35) } 70% { box-shadow:0 0 0 16px rgba(220,38,38,0) } 100% { box-shadow:0 0 0 0 rgba(220,38,38,0) }` | box-shadow ring | record button `1.5s ease-out infinite` `[SRC:1687-block]` (outside these slices) |

**Transitions declared inside the eight foundation slices** (there are only five distinct ones):

| Transition | Where |
|---|---|
| `background .15s` | all 7 filled/outline/ghost button variants `[BTN:8–14]` |
| `border-color .15s, box-shadow .15s` | text input, search input, textarea `[FRM:8,25,39]` |
| `all .15s` | checkbox box `[FRM:47,53]`, radio ring + radio dot `[FRM:66,70]` |
| `background .18s` | switch track `[FRM:77,81]` |
| `transform .18s` | switch knob `[FRM:77,81]` |

No easing function is named on any of them → they all use the CSS default `ease`. No `transition` is declared on badges, alerts, alert action buttons, the Link button, the Small/Large/icon-only buttons, or the disabled/loading buttons.

---

## 1. Logo `[LOGO]`

**Assets on disk:** `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/assets/logo.png` (37 604 B) and `.../assets/logo-mark.png` (13 727 B). PNG only — no SVG exists in the export.

**Section frame** `[LOGO:1]`: `max-width:1240px; margin:0 auto; padding:64px 48px 0`.
**Eyebrow** `[LOGO:2]`: text `01 · Brand`, `font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#2563EB; margin-bottom:8px`.
**Heading** `[LOGO:3]`: `<h2>Logo</h2>`, `margin:0 0 24px; font-size:26px; font-weight:700; color:#0E2350`.
**Grid** `[LOGO:4]`: `display:grid; grid-template-columns:repeat(3,1fr); gap:20px`.

| # | Tile shell | Asset | Rendered size | Notes |
|---|---|---|---|---|
| 1 | `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:36px; display:flex; align-items:center; justify-content:center; min-height:160px` `[LOGO:5]` | `assets/logo.png`, `alt="SchoolTest logo"` | `height:44px` (width auto) | Primary lockup on light |
| 2 | identical shell `[LOGO:6]` | `assets/logo-mark.png`, `alt="SchoolTest mark"` | `height:56px` | Mark-only; rendered **12px taller** than the lockup |
| 3 | `background:#0E2350; border-radius:16px; padding:36px; …; min-height:160px` — **no border** `[LOGO:7]` | `assets/logo.png`, `alt="SchoolTest on navy"` | `height:44px`, `filter:brightness(0) invert(1)` | Reversed/knock-out white lockup on navy |

**Usage rules derivable from the markup:** the lockup renders at 44px height inside content, and at **52px** height in the page masthead (`height:52px; width:auto; align-self:flex-start` `[HDR:3]`). Minimum clear space = the tile padding, **36px** on all sides. On dark backgrounds the coloured logo is not swapped for a separate asset — it is knocked out to solid white via `filter:brightness(0) invert(1)`.

### 1.1 Page masthead `[HDR]`

| Element | Spec |
|---|---|
| `<section>` `[HDR:1]` | `background:#FFFFFF; border-bottom:1px solid #E3E8F0` |
| Container `[HDR:2]` | `max-width:1240px; margin:0 auto; padding:64px 48px 56px; display:flex; flex-direction:column; gap:20px` |
| Logo `[HDR:3]` | `assets/logo.png`, `height:52px; width:auto; align-self:flex-start` |
| `<h1>` `[HDR:4]` | text `Design System` — `margin:0; font-size:44px; line-height:1.1; font-weight:700; letter-spacing:-0.02em; color:#0E2350` |
| `<p>` `[HDR:5]` | `margin:0; max-width:640px; font-size:16px; line-height:1.6; color:#64748B` |
| Inline code `[HDR:5]` | text `tokens.css` — `font-family:ui-monospace,Menlo,monospace; font-size:14px; background:#F1F5F9; padding:2px 7px; border-radius:6px; color:#16326E` |
| Pill row `[HDR:6]` | `display:flex; gap:10px; flex-wrap:wrap` |
| Pill base `[HDR:7–9]` | `display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; padding:5px 12px; border-radius:999px` |
| Pill `v1.0` `[HDR:7]` | `color:#16326E; background:#EFF5FF` |
| Pill `Google Sans` `[HDR:8]` | `color:#0D9488; background:#F0FDFA` |
| Pill `Light + Dark` `[HDR:9]` | `color:#64748B; background:#F1F5F9` |

Note the masthead pill (`padding:5px 12px`) is **1px taller and 1px wider** than the badge component (`padding:4px 11px`, §5) despite identical font metrics.

---

## 2. Colour system

### 2.1 Swatch-board layout `[COL]`

`section: max-width:1240px; margin:0 auto; padding:64px 48px 0` `[COL:1]`.
Eyebrow `02 · Foundations` — `12px/700`, `letter-spacing:.1em`, uppercase, `#2563EB`, `margin-bottom:8px` `[COL:2]`.
`<h2>Color</h2>` — `margin:0 0 24px; font-size:26px; font-weight:700; color:#0E2350` `[COL:3]`.
Card `[COL:4]`: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:28px`.
Group label `[COL:6,14,24,33,44]`: `font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#94A3B8; margin-bottom:12px`.
Every group grid `[COL:7,15,25,34,45]`: `display:grid; grid-template-columns:repeat(6,1fr); gap:12px` — **always 6 columns**, so groups with fewer swatches leave trailing empty cells.
Swatch chip: `height:72px; border-radius:10px; background:<hex>`. Very light swatches additionally carry `border:1px solid #E3E8F0` (`blue-50` `[COL:20]`, `teal-50` `[COL:29]`, `background` `[COL:40]`).
Swatch name: `margin-top:8px; font-size:13px; font-weight:600; color:#0E2350`.
Swatch caption (the hex + role): `font-size:12px; color:#94A3B8`.

### 2.2 Every swatch on the board `[COL:8–48]`

| Group | Name shown | Hex | Caption suffix shown | `tokens.css` variable |
|---|---|---|---|---|
| Brand navy | `navy-950` | `#0A1A3C` | — | `--navy-950` `[TOK:11]` |
| Brand navy | `navy-900` | `#0E2350` | `· brand` | `--navy-900` `[TOK:12]`, `--foreground` `[TOK:26]`, `--card-foreground` `[TOK:28]`, `--popover-foreground` `[TOK:30]` |
| Brand navy | `navy-800` | `#16326E` | — | `--navy-800` `[TOK:13]`, `--secondary-foreground` `[TOK:34]`, `--sidebar-accent-foreground` `[TOK:63]` |
| Primary blue | `blue-700` | `#1D4ED8` | `· hover` | `--blue-700` `[TOK:14]`; dark `--chart-4` `[TOK:103]` |
| Primary blue | `blue-600` | `#2563EB` | `· primary` | `--blue-600` `[TOK:15]`, `--primary` `[TOK:31]`, `--chart-1` `[TOK:51]`, `--sidebar-primary` `[TOK:60]` |
| Primary blue | `blue-500` | `#3B82F6` | — | `--blue-500` `[TOK:16]`; dark `--primary` `[TOK:82]`, dark `--sidebar-primary` `[TOK:108]` |
| Primary blue | `blue-100` | `#DBEAFE` | — | `--blue-100` `[TOK:17]`; dark `--sidebar-accent-foreground` `[TOK:111]` |
| Primary blue | `blue-50` | `#EFF5FF` | `· secondary` | `--blue-50` `[TOK:18]`, `--secondary` `[TOK:33]`, `--sidebar-accent` `[TOK:62]` |
| Accent teal | `teal-600` | `#0D9488` | `· hover` | `--teal-600` `[TOK:19]`; dark `--chart-5` `[TOK:104]` |
| Accent teal | `teal-500` | `#14B8A6` | `· accent` | `--teal-500` `[TOK:20]`, `--accent` `[TOK:37]`, `--chart-2` `[TOK:52]` |
| Accent teal | `teal-100` | `#CCFBF1` | — | `--teal-100` `[TOK:21]` |
| Accent teal | `teal-50` | `#F0FDFA` | — | `--teal-50` `[TOK:22]` |
| Neutrals | `slate-900` | `#0F172A` | — | **no token** — board-only `[COL:35]` |
| Neutrals | `slate-600` | `#475569` | `· body` | `--sidebar-foreground` `[TOK:59]`; also the global `body` colour `[SRC:14]` |
| Neutrals | `slate-500` | `#64748B` | `· muted` | `--muted-foreground` `[TOK:36]` |
| Neutrals | `slate-300` | `#CBD5E1` | `· input` | `--input` `[TOK:46]` |
| Neutrals | `border` | `#E3E8F0` | — | `--border` `[TOK:45]`, `--sidebar-border` `[TOK:64]` |
| Neutrals | `background` | `#F7F9FC` | — | `--background` `[TOK:25]` |
| Semantic | `success` | `#16A34A` | — | `--success` `[TOK:41]` |
| Semantic | `warning` | `#D97706` | — | `--warning` `[TOK:43]` |
| Semantic | `destructive` | `#DC2626` | — | `--destructive` `[TOK:39]` |

### 2.3 Colours used in the eight slices that are **not** on the swatch board and **not** in `tokens.css`

| Hex | Role | Cited at |
|---|---|---|
| `#94A3B8` | muted label / helper text / placeholder / disabled text / dismiss-icon idle / "Draft" dot | `[COL:6]`, `[FRM:9,17,19]`, `[SRC:17]`, `[BTN:27]`, `[ALR:10]`, `[BDG:19]` |
| `#F1F5F9` | muted surface: ghost-button hover, inline-code bg, disabled input bg, neutral badge bg, dismiss hover bg | `[BTN:13]`, `[HDR:5]`, `[FRM:18,59]`, `[BDG:13]`, `[ALR:10]` |
| `#E2E8F0` | disabled button fill | `[BTN:27]` |
| `#EEF2F7` | hairline divider inside forms card; toast progress track | `[FRM:42]`, `[ALR:50]` |
| `#B91C1C` | destructive hover fill; error badge text | `[BTN:14]`, `[ALR:34]`, `[BDG:12]` |
| `#DCFCE7` | success tint surface (badge bg, alert icon chip) | `[BDG:10,17]`, `[ALR:13]` |
| `#15803D` | success badge text | `[BDG:10,17]` |
| `#FEF3C7` | warning tint surface | `[BDG:11]`, `[ALR:18]` |
| `#B45309` | warning badge text | `[BDG:11]` |
| `#FEE2E2` | destructive tint surface | `[BDG:12]`, `[ALR:29]` |
| `#2DD4BF` | success tick inside the dark toast | `[ALR:42]` — matches dark-mode `--accent` `[TOK:88]` |
| `#A9BADC` | secondary text on the dark toast | `[ALR:43]` — matches dark-mode `--sidebar-foreground` `[TOK:107]` |
| `#8FA3C7` | dismiss-icon idle on the dark toast | `[ALR:44]` — matches dark-mode `--muted-foreground` `[TOK:87]` |

### 2.4 `tokens.css` values that never appear on the swatch board

Light `[TOK:25–71]`: `--card`/`--popover` `#FFFFFF`, `--primary-foreground`/`--accent-foreground`/`--destructive-foreground`/`--success-foreground`/`--warning-foreground`/`--sidebar-primary-foreground` `#FFFFFF`, `--muted` `#F1F5F9`, `--sidebar` `#FFFFFF`, `--ring` `rgba(37,99,235,0.35)`, `--radius` `0.625rem` (= **10px**), `--chart-4` `#93C5FD`, `--chart-5` `#5EEAD4`, `--sidebar-ring` `rgba(37,99,235,0.35)`.

Shadow scale `[TOK:68–71]` — all tinted with navy-900 `#0E2350`:

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(14,35,80,.06)` |
| `--shadow-md` | `0 2px 8px rgba(14,35,80,.08)` |
| `--shadow-lg` | `0 8px 24px rgba(14,35,80,.12)` |
| `--shadow-xl` | `0 20px 48px rgba(14,35,80,.18)` |

**Shadows actually used in the eight slices** (none of them exactly equals a `--shadow-*` token — the alpha differs):

| Value | On |
|---|---|
| `0 1px 2px rgba(14,35,80,.08)` | Primary button `[BTN:8]` (= `--shadow-sm` geometry, alpha `.08` not `.06`) |
| `0 1px 2px rgba(14,35,80,.05)` | Alert card ×4 `[ALR:7,12,17,28]` |
| `0 1px 3px rgba(14,35,80,.25)` | Switch knob `[FRM:77,81]` |
| `0 12px 32px rgba(14,35,80,.28)` | Dark toast `[ALR:41]` |
| `0 12px 32px rgba(14,35,80,.14)` | Light toast `[ALR:46]` |
| `0 16px 40px rgba(14,35,80,.35)` | Live fixed toast `[SRC:1527]` |
| `0 0 0 3px rgba(37,99,235,.16)` | Input focus ring `[FRM:8,25,39]` |
| `0 0 0 3px rgba(220,38,38,.10)` | Input error ring `[FRM:13]` |

### 2.5 Dark mode `[TOK:74–113]`

Full `.dark` override set — not exercised by any of the eight slices, but required for the token layer:

| Token | Dark value | Light value |
|---|---|---|
| `--background` | `#0B1226` | `#F7F9FC` |
| `--foreground` | `#E6ECF7` | `#0E2350` |
| `--card` / `--card-foreground` | `#111B33` / `#E6ECF7` | `#FFFFFF` / `#0E2350` |
| `--popover` / `--popover-foreground` | `#162240` / `#E6ECF7` | `#FFFFFF` / `#0E2350` |
| `--primary` / `--primary-foreground` | `#3B82F6` / `#FFFFFF` | `#2563EB` / `#FFFFFF` |
| `--secondary` / `--secondary-foreground` | `#1A2A4E` / `#C7D6F2` | `#EFF5FF` / `#16326E` |
| `--muted` / `--muted-foreground` | `#17233F` / `#8FA3C7` | `#F1F5F9` / `#64748B` |
| `--accent` / `--accent-foreground` | `#2DD4BF` / `#06251F` | `#14B8A6` / `#FFFFFF` |
| `--destructive` / `-foreground` | `#EF4444` / `#FFFFFF` | `#DC2626` / `#FFFFFF` |
| `--success` / `-foreground` | `#22C55E` / `#06250F` | `#16A34A` / `#FFFFFF` |
| `--warning` / `-foreground` | `#F59E0B` / `#2A1B02` | `#D97706` / `#FFFFFF` |
| `--border` / `--input` | `#223154` / `#2C3D66` | `#E3E8F0` / `#CBD5E1` |
| `--ring` | `rgba(59,130,246,.45)` | `rgba(37,99,235,.35)` |
| `--chart-1…5` | `#60A5FA`, `#2DD4BF`, `#93C5FD`, `#1D4ED8`, `#0D9488` | `#2563EB`, `#14B8A6`, `#0E2350`, `#93C5FD`, `#5EEAD4` |
| `--sidebar` / `-foreground` | `#0E1830` / `#A9BADC` | `#FFFFFF` / `#475569` |
| `--sidebar-primary` / `-foreground` | `#3B82F6` / `#FFFFFF` | `#2563EB` / `#FFFFFF` |
| `--sidebar-accent` / `-foreground` | `#1A2A4E` / `#DBEAFE` | `#EFF5FF` / `#16326E` |
| `--sidebar-border` / `--sidebar-ring` | `#223154` / `rgba(59,130,246,.45)` | `#E3E8F0` / `rgba(37,99,235,.35)` |

> **Defect to carry forward:** `[TOK:79]` and `[TOK:80]` both declare `--popover` in `.dark` — `#16224080` (8-digit hex, 50% alpha) is immediately overwritten by `#162240`. The effective dark popover is the **opaque** `#162240`. Do not port the dead line.

---

## 3. Type scale `[TYP]`

Board frame: `section max-width:1240px; margin:0 auto; padding:64px 48px 0` `[TYP:1]`; eyebrow `03 · Foundations` `12px/700/.1em/uppercase/#2563EB` `[TYP:2]`; `<h2>Typography — Google Sans</h2>` `26px/700/#0E2350, margin:0 0 24px` `[TYP:3]`; card `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:22px` `[TYP:4]`.
Each specimen row `[TYP:5–12]`: `display:flex; align-items:baseline; gap:24px`; the left gutter label is `width:150px; flex:none; font-size:12px; color:#94A3B8`.

### 3.1 The eight published steps

| Semantic name | Gutter label | font-size | line-height | weight | letter-spacing | colour | Specimen copy | Cite |
|---|---|---|---|---|---|---|---|---|
| **Display** | `Display · 56/700` | `56px` | `1.05` | `700` | `-0.03em` | `#0E2350` | "Smarter Tests. Better Results." | `[TYP:5]` |
| **H1** | `H1 · 40/700` | `40px` | `1.15` | `700` | `-0.02em` | `#0E2350` | "Create a test in minutes" | `[TYP:6]` |
| **H2** | `H2 · 32/700` | `32px` | `1.2` | `700` | `-0.015em` | `#0E2350` | "Track every student" | `[TYP:7]` |
| **H3** | `H3 · 24/600` | `24px` | `1.3` | `600` | *not declared* (normal) | `#0E2350` | "Results at a glance" | `[TYP:8]` |
| **H4** | `H4 · 18/600` | `18px` | `1.4` | `600` | *not declared* (normal) | `#0E2350` | "Recent activity" | `[TYP:9]` |
| **Body** | `Body · 16/400` | `16px` | `1.6` | *not declared* (inherits `400`) | normal | `#475569` | measure capped at `max-width:560px` | `[TYP:10]` |
| **Body sm** | `Body sm · 14/400` | `14px` | `1.55` | *not declared* (`400`) | normal | `#475569` | "Supporting copy for cards, table cells and form helpers." | `[TYP:11]` |
| **Caption** | `Caption · 12.5/500` | `12.5px` | `1.5` | `500` | normal | `#64748B` | "UPDATED 2 HOURS AGO" (copy is authored uppercase; **no** `text-transform`) | `[TYP:12]` |

Letter-spacing tightens monotonically as size grows: 56 → `-0.03em`, 40 → `-0.02em`, 32 → `-0.015em`, ≤24 → normal.

### 3.2 Additional type steps used by the DS chrome but absent from the board

| Role | Spec | Cite |
|---|---|---|
| Page title (masthead H1) | `44px / 1.1 / 700 / -0.02em / #0E2350` | `[HDR:4]` |
| Section heading (`<h2>` on every section) | `26px / 700 / #0E2350`, `margin:0 0 24px`, no line-height or letter-spacing declared | `[LOGO:3]`, `[COL:3]`, `[TYP:3]`, `[BTN:3]`, `[FRM:3]`, `[BDG:3]`, `[ALR:3]` |
| Section eyebrow | `12px / 700 / letter-spacing .1em / text-transform:uppercase / #2563EB`, `margin-bottom:8px` | `[LOGO:2]`, `[COL:2]`, `[TYP:2]`, `[BTN:2]`, `[FRM:2]`, `[BDG:2]`, `[ALR:2]` |
| Group label (inside cards) | `11px / 700 / letter-spacing .08em / uppercase / #94A3B8` | `[COL:6]`, `[BTN:6,19]`, `[FRM:45,64,75]`, `[ALR:5,39]` |
| Lead paragraph | `16px / 1.6 / #64748B`, `max-width:640px` | `[HDR:5]` |
| Inline code | `ui-monospace, Menlo, monospace` at `14px`, `#16326E` on `#F1F5F9`, `padding:2px 7px`, `radius:6px` | `[HDR:5]` |
| Form label | `13.5px / 600 / #0E2350` | `[FRM:7,12,22,29,38]` |
| Field helper / inline error | `12.5px`, helper `#94A3B8` (400), error `#DC2626` (500) | `[FRM:9,14,19]` |
| Alert title | `14px / 600 / #0E2350` | `[ALR:9,14,20,31]` |
| Alert body | `13.5px / 1.5 / #64748B` | `[ALR:9,14,21,32]` |
| Toast title | `13.5px / 600` (`#FFFFFF` dark toast, `#0E2350` light toast) | `[ALR:43,48]` |
| Toast body | `12.5px` (`#A9BADC` dark, `#64748B` light) | `[ALR:43,48]` |
| Small caption (helper next to trigger) | `13px / #94A3B8` | `[ALR:55]` |
| Swatch name / swatch hex | `13px / 600 / #0E2350` and `12px / #94A3B8` | `[COL:8]` |
| Count-badge numeral | `11.5px / 700 / #FFFFFF` | `[BDG:21]` |

**Full font-size inventory across the eight slices** (13 distinct steps): `11px`, `11.5px`, `12px`, `12.5px`, `13px`, `13.5px`, `14px`, `15px`, `16px`, `18px`, `24px`, `26px`, `32px`, `40px`, `44px`, `56px`. Half-pixel steps (`12.5`, `13.5`) are real and load-bearing — they appear on badges, captions, form labels and alert bodies.

---

## 4. Buttons `[BTN]`

Board frame `[BTN:1–4]`: section `max-width:1240px; padding:64px 48px 0`; eyebrow `04 · Components`; `<h2>Buttons</h2>`; card `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:26px`.
Two groups: **Variants** `[BTN:6]` and **Sizes · icons · states** `[BTN:19]`, each preceded by the `11px/700/.08em` group label with `margin-bottom:14px`, and each laid out as `display:flex; gap:14px; flex-wrap:wrap; align-items:center` `[BTN:7,20]`.

### 4.1 Shared base (default size)

```
display:inline-flex; align-items:center; gap:8px;
font-size:14px; font-weight:600;
padding:10px 18px; border-radius:10px;
cursor:pointer; transition:background .15s;
font-family: inherit  (from the global reset, [SRC:18])
```
Computed default height = 14px × normal line-height + 20px vertical padding. Outline compensates with `padding:9px 17px` so its border-box height matches the borderless variants exactly.

### 4.2 Variants — all seven states each

| Variant | default | hover (`style-hover`) | focus-visible | active | disabled | loading | Cite |
|---|---|---|---|---|---|---|---|
| **Primary** | `background:#2563EB; color:#FFFFFF; border:none; box-shadow:0 1px 2px rgba(14,35,80,.08)` | `background:#1D4ED8` | **not specified** | **not specified** | see §4.4 | see §4.4 | `[BTN:8,22]` |
| **Navy** | `background:#0E2350; color:#FFFFFF; border:none` (no shadow) | `background:#16326E` | not specified | not specified | not specified | not specified | `[BTN:9]`, `[ALR:54]` |
| **Accent** | `background:#14B8A6; color:#FFFFFF; border:none` | `background:#0D9488` | not specified | not specified | not specified | not specified | `[BTN:10]` |
| **Secondary** | `background:#EFF5FF; color:#16326E; border:none` | `background:#DBEAFE` | not specified | not specified | not specified | not specified | `[BTN:11]`, `[ALR:23]` |
| **Outline** | `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; padding:9px 17px` | `background:#F7F9FC` (border unchanged) | not specified | not specified | not specified | not specified | `[BTN:12,25,26]` |
| **Ghost** | `background:transparent; color:#16326E; border:none` | `background:#F1F5F9` | not specified | not specified | not specified | not specified | `[BTN:13]`, `[ALR:24]` (ghost at `#64748B`) |
| **Destructive** | `background:#DC2626; color:#FFFFFF; border:none` | `background:#B91C1C` | not specified | not specified | not specified | not specified | `[BTN:14]`, `[ALR:34]` |
| **Link** | `background:none; border:none; color:#2563EB; font-size:14px; font-weight:600; padding:10px 4px` — **no border-radius, no gap, no transition** | `color:#1D4ED8; text-decoration:underline` | not specified | not specified | not specified | not specified | `[BTN:15]` |

The global `a`/`a:hover` rule `[SRC:15–16]` uses the same pair (`#2563EB` → `#1D4ED8`) but without the underline, so anchors and Link-buttons differ on hover.

### 4.3 Sizes `[BTN:21–26]`

| Size | font-size | padding | border-radius | icon gap | Height driver |
|---|---|---|---|---|---|
| **sm** | `13px` | `7px 13px` | `8px` | `6px` | `[BTN:21]` |
| **default** | `14px` | `10px 18px` | `10px` | `8px` | `[BTN:22]` |
| **lg** | `15px` | `13px 26px` | `12px` | `8px` | `[BTN:23]` |
| **icon** | — | none | `10px` | — | fixed `width:38px; height:38px; display:inline-grid; place-items:center` `[BTN:26]` |
| **xs (alert action)** | `12.5px` | `6px 12px` | `8px` | — | `[ALR:23,24,34]` |

### 4.4 Icons and remaining states

- **Leading icon** `[BTN:24]` — "Create test", Primary default size, `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">` with paths `M5 12h14` + `M12 5v14` (lucide `plus`). Gap `8px`.
- **Trailing icon** `[BTN:25]` — "View results", Outline default size, same 15×15 / stroke-width `2.4` / `stroke-linecap:round` `stroke-linejoin:round`, paths `M5 12h14` + `m12 5 7 7-7 7` (lucide `arrow-right`).
- **Icon-only** `[BTN:26]` — `aria-label="Settings"`, Outline colours (`#FFFFFF` bg, `#16326E` fg, `1px solid #CBD5E1`), 38×38, `border-radius:10px`, `style-hover="background:#F7F9FC"`; inner `<svg width="16" height="16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` (lucide `settings`).
- **Disabled** `[BTN:27]` — `background:#E2E8F0; color:#94A3B8; border:none; font-size:14px; font-weight:600; padding:10px 18px; border-radius:10px; cursor:not-allowed`, attribute `disabled`. No hover, no shadow, no opacity change. Label "Disabled".
- **Loading** `[BTN:28]` — Primary fill, `gap:9px` (not 8), `cursor:progress`, `opacity:.85`, label `Saving…`. The spinner (`{{ spinner }}`, resolved at `[SRC:1578–1581]`) is:
  ```
  display:inline-block; width:14px; height:14px;
  border:2px solid rgba(255,255,255,.35); border-top-color:#fff;
  border-radius:50%; animation: st-spin .7s linear infinite;
  ```
- **focus-visible / active(pressed)** — see **UNKNOWNS**. No `:focus`, `:focus-visible` or `:active` declaration exists on any button in these slices; the only focus treatment anywhere in the eight files is the input ring in §5.

---

## 5. Form controls `[FRM]`

Board frame `[FRM:1–4]`: eyebrow `05 · Components`; `<h2>Forms &amp; inputs</h2>`; card `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:28px`.
Two blocks separated by a hairline `<div style="height:1px;background:#EEF2F7">` `[FRM:42]`.
Block A `[FRM:5]` and Block B `[FRM:43]` are both `display:grid; grid-template-columns:repeat(3,1fr); gap:24px`.
Field wrapper `[FRM:6,11,16,21,28,37]`: `display:flex; flex-direction:column; gap:7px`.

### 5.1 Text input

| State | Spec | Cite |
|---|---|---|
| **default** | `width:100%; box-sizing:border-box; padding:10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF; outline:none; transition:border-color .15s, box-shadow .15s` | `[FRM:8]` |
| **placeholder** | `color:#94A3B8` (global rule) — example `e.g. Midterm Algebra` | `[SRC:17]`, `[FRM:8]` |
| **focus** (`style-focus`) | `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` | `[FRM:8,25,39]` |
| **error** | `border:1px solid #DC2626; box-shadow:0 0 0 3px rgba(220,38,38,.10)` — persistent (not a focus-only shadow), no transition declared | `[FRM:13]` |
| **disabled** | `border:1px solid #E3E8F0; color:#94A3B8; background:#F1F5F9; cursor:not-allowed`, attribute `disabled`; label also drops to `#94A3B8` | `[FRM:17,18]` |
| **hover** | **not specified** | — |

**Label** `[FRM:7]`: `font-size:13.5px; font-weight:600; color:#0E2350`. **Required marker** `[FRM:12]`: a `<span style="color:#DC2626">*</span>` appended after a space.
**Helper text** `[FRM:9,19]`: `font-size:12.5px; color:#94A3B8`.
**Inline error message** `[FRM:14]`: `display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:500; color:#DC2626`, preceded by `<svg width="13" height="13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">` = lucide `alert-circle` (`circle r=10`, `M12 8v4`, `M12 16h.01`).

### 5.2 Search input `[FRM:23–26]`

Wrapper `position:relative`. Icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round" style="position:absolute; left:13px; top:50%; transform:translateY(-50%)">` (lucide `search`: `circle cx=11 cy=11 r=8`, `m21 21-4.35-4.35`). Input identical to §5.1 default except `padding:10px 13px 10px 38px`. Same `style-focus`. Placeholder `Search tests…`.

### 5.3 Select `[FRM:30–35]`

Wrapper `position:relative`.
`<select>`: `appearance:none; width:100%; box-sizing:border-box; padding:10px 36px 10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF; outline:none; cursor:pointer`. **No `transition` and no `style-focus` are declared on the select** — unlike the text inputs.
Chevron: `<svg width="15" height="15" stroke="#64748B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute; right:13px; top:50%; transform:translateY(-50%); pointer-events:none">` path `m6 9 6 6 6-6`.

### 5.4 Textarea `[FRM:39]`

`rows="3"`, `width:100%; box-sizing:border-box; padding:10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF; outline:none; resize:vertical; line-height:1.5; transition:border-color .15s, box-shadow .15s`; same `style-focus` as the text input. Placeholder `Optional notes shown before the test starts…`.

### 5.5 Checkbox `[FRM:44–61]`

Column: `display:flex; flex-direction:column; gap:14px`, headed by the group label `Checkbox — try it` (`11px/700/.08em/uppercase/#94A3B8`).
Row: `display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none`.
Box: `display:inline-grid; place-items:center; width:18px; height:18px; border-radius:5px; border:1.5px solid <border>; background:<bg>; transition:all .15s`.
Tick (rendered only when checked): `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">` path `M20 6 9 17l-5-5`.
Row label: `font-size:14px; color:#0E2350`.

| State | border | background | tick | Resolution |
|---|---|---|---|---|
| unchecked | `#CBD5E1` | `#FFFFFF` | none | `BORDER` const `[SRC:1557]`, `[SRC:1685–1686]` |
| checked | `#2563EB` | `#2563EB` | white ✓ | `BLUE` const `[SRC:1557]` |
| disabled | `#CBD5E1` | `#F1F5F9` | none; **row** gets `opacity:.5; cursor:not-allowed`, label colour `#64748B` | `[FRM:58–61]` |
| hover / focus-visible | **not specified** | | | |

Design-time values: `Shuffle question order` = **checked** (`cb1:true` `[SRC:1537]`); `Show results immediately` = **unchecked** (`cb2:false`); third row = `Disabled option`.

### 5.6 Radio `[FRM:63–73]`

Group label `Radio — try it`. Row identical to the checkbox row.
Ring: `display:inline-grid; place-items:center; width:18px; height:18px; border-radius:50%; border:1.5px solid <border>; transition:all .15s`.
Dot (always rendered): `width:8px; height:8px; border-radius:50%; background:<dot>; transition:all .15s`.

| State | ring border | dot background | Resolution |
|---|---|---|---|
| unselected | `#CBD5E1` | `transparent` | `[SRC:1690–1691]` |
| selected | `#2563EB` | `#2563EB` | `[SRC:1690–1691]` |
| disabled / hover / focus-visible | **not specified** | | |

Design-time values: `radio:'a'` `[SRC:1538]` → **Multiple choice selected**, **Open answer** unselected.

### 5.7 Switch `[FRM:74–84]`

Group label `Switch — try it`. Row: `display:flex; align-items:center; gap:12px; cursor:pointer; user-select:none`.
Track: `position:relative; display:inline-block; width:40px; height:22px; border-radius:999px; background:<bg>; transition:background .18s`.
Knob: `position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#FFFFFF; box-shadow:0 1px 3px rgba(14,35,80,.25); transform:<t>; transition:transform .18s`.

| State | track | knob transform | Resolution |
|---|---|---|---|
| off | `#CBD5E1` (`TRACK`) | `translateX(0)` | `[SRC:1557,1695–1696]` |
| on | `#2563EB` (`BLUE`) | `translateX(18px)` | `[SRC:1695–1696]` |
| disabled / hover / focus-visible | **not specified** | | |

Track 40px − knob 18px − left inset 2px − right inset 2px = **18px travel**, matching the transform exactly.
Design-time values: `Timed test` = **on** (`sw1:true` `[SRC:1539]`), `Email me results` = **off** (`sw2:false`).

---

## 6. Badges & tags `[BDG]`

Board frame `[BDG:1–4]`: eyebrow `06 · Components`; `<h2>Badges &amp; tags</h2>`; card `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:20px`. Two rows, each `display:flex; gap:12px; flex-wrap:wrap; align-items:center` `[BDG:5,16]`.

### 6.1 Base

```
font-size:12.5px; font-weight:600; padding:4px 11px; border-radius:999px;
```
No `transition`, no `:hover`, no `:focus` on any badge — they are non-interactive except for the tag's remove button (which itself carries no hover style).

### 6.2 Colour variants — all nine `[BDG:6–14]`

| Variant | Label | text | background | border | padding override |
|---|---|---|---|---|---|
| Default | `Default` | `#16326E` | `#EFF5FF` | none | — |
| Primary | `Primary` | `#FFFFFF` | `#2563EB` | none | — |
| Navy | `Navy` | `#FFFFFF` | `#0E2350` | none | — |
| Accent | `Accent` | `#0D9488` | `#CCFBF1` | none | — |
| Success | `Success` | `#15803D` | `#DCFCE7` | none | — |
| Warning | `Warning` | `#B45309` | `#FEF3C7` | none | — |
| Error | `Error` | `#B91C1C` | `#FEE2E2` | none | — |
| Neutral | `Neutral` | `#475569` | `#F1F5F9` | none | — |
| Outline | `Outline` | `#16326E` | `#FFFFFF` | `1px solid #CBD5E1` | `3px 11px` (border compensation, keeps 22px box height) |

### 6.3 Status (dot) badges `[BDG:17–19]`

Base adds `display:inline-flex; align-items:center; gap:6px`; the dot is `width:6px; height:6px; border-radius:50%`.

| Status | text | background | dot |
|---|---|---|---|
| `Live` | `#15803D` | `#DCFCE7` | `#16A34A` |
| `Scheduled` | `#16326E` | `#EFF5FF` | `#2563EB` |
| `Draft` | `#475569` | `#F1F5F9` | `#94A3B8` |

### 6.4 Removable tag `[BDG:20]`

`display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#16326E; background:#EFF5FF; padding:4px 6px 4px 11px; border-radius:999px` — note the asymmetric padding (right inset shrinks to 6px to seat the ✕). Icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.4" stroke-linecap="round">` paths `M18 6 6 18` + `m6 6 12 12`. Example label `Grade 7`.

### 6.5 Count badge `[BDG:21]`

`display:inline-grid; place-items:center; min-width:20px; height:20px; padding:0 6px; border-radius:999px; background:#DC2626; color:#FFFFFF; font-size:11.5px; font-weight:700`. Example value `3` — the only true metric on this board (see §8).

---

## 7. Alerts & toasts `[ALR]`

Board frame `[ALR:1–4]`: eyebrow `07 · Components`; `<h2>Alerts &amp; toasts</h2>`; card `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:14px`. Group labels `Alerts` `[ALR:5]` and `Toasts` `[ALR:39]` (the latter adds `margin-top:12px`).

### 7.1 Alert — shared anatomy

Grid `[ALR:6]`: `display:grid; grid-template-columns:1fr 1fr; gap:14px` (fixed 2-up, no breakpoint).
Shell `[ALR:7,12,17,28]`:
```
display:flex; gap:13px; align-items:flex-start;
background:#FFFFFF; border:1px solid #E3E8F0; border-radius:14px;
padding:15px 16px; box-shadow:0 1px 2px rgba(14,35,80,.05);
```
Icon chip: `display:inline-grid; place-items:center; width:36px; height:36px; border-radius:10px; background:<tint>; flex:none`; inner `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="<accent>" stroke-width="2.2" stroke-linecap="round">`.
Body: `flex:1; min-width:0`; title `font-size:14px; font-weight:600; color:#0E2350`; description `font-size:13.5px; line-height:1.5; color:#64748B; margin-top:2px`.
Dismiss button `[ALR:10,15]`: `display:inline-grid; place-items:center; width:26px; height:26px; border-radius:7px; border:none; background:transparent; color:#94A3B8; cursor:pointer; flex:none`, `aria-label="Dismiss"`, `style-hover="background:#F1F5F9; color:#475569"`; icon `<svg width="13" height="13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">` ✕. **No transition declared.**
Action row (variants 3 & 4): `display:flex; gap:8px; margin-top:11px`.

### 7.2 The four alert variants

| Variant | Icon chip bg | Icon stroke | lucide icon (paths) | Title | Body | Trailing affordance |
|---|---|---|---|---|---|---|
| **Info** `[ALR:7–11]` | `#EFF5FF` | `#2563EB` | `info` — `circle r=10`, `M12 16v-4`, `M12 8h.01` | `Heads up` | `Students will see this test on Monday at 9:00 AM.` | ✕ dismiss button |
| **Success** `[ALR:12–16]` | `#DCFCE7` | `#16A34A` | `circle-check` — `circle r=10`, `m9 12 2 2 4-4` (adds `stroke-linejoin:round`) | `Test published` | `Science Quiz was shared with 28 students.` | ✕ dismiss button |
| **Warning** `[ALR:17–27]` | `#FEF3C7` | `#D97706` | `triangle-alert` — `m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2Z`, `M12 9v4`, `M12 17h.01` | `Unsaved changes` | `Two questions have no correct answer marked.` | 2 action buttons, **no** ✕ |
| **Destructive** `[ALR:28–37]` | `#FEE2E2` | `#DC2626` | `alert-circle` — `circle r=10`, `M12 8v4`, `M12 16h.01` | `Couldn't publish` | `Check your connection and try again.` | 1 action button, **no** ✕ |

Alert action buttons (xs size, `font-size:12.5px; font-weight:600; padding:6px 12px; border-radius:8px; border:none; cursor:pointer`, no transition):

| Label | default | hover | Cite |
|---|---|---|---|
| `Review questions` | `background:#EFF5FF; color:#16326E` | `background:#DBEAFE` | `[ALR:23]` |
| `Dismiss` | `background:transparent; color:#64748B` | `background:#F1F5F9` | `[ALR:24]` |
| `Retry` | `background:#DC2626; color:#FFFFFF` | `background:#B91C1C` | `[ALR:34]` |

### 7.3 Toasts

Row `[ALR:40]`: `display:flex; gap:14px; flex-wrap:wrap; align-items:flex-start`.

**Toast A — dark / success** `[ALR:41–45]`
```
display:flex; align-items:center; gap:12px;
background:#0E2350; color:#FFFFFF;
padding:14px 16px; border-radius:12px;
box-shadow:0 12px 32px rgba(14,35,80,.28);
max-width:330px;
```
Leading icon: 17×17 `circle-check`, `stroke:#2DD4BF`, `stroke-width:2.2`, `stroke-linecap/linejoin:round`, `flex:none`.
Title `Test published` — `13.5px/600` inheriting `#FFFFFF`. Body `Science Quiz shared with 28 students.` — `12.5px; color:#A9BADC; margin-top:1px`.
Dismiss: 26×26, `border-radius:7px`, `background:transparent`, `color:#8FA3C7`, `style-hover="background:#16326E"`, 13×13 ✕ at stroke-width `2.4`.

**Toast B — light / progress** `[ALR:46–51]`
```
position:relative; display:flex; align-items:center; gap:12px;
background:#FFFFFF; border:1px solid #E3E8F0;
padding:13px 14px 17px;   /* extra 4px bottom for the progress rail */
border-radius:12px; box-shadow:0 12px 32px rgba(14,35,80,.14);
max-width:330px;
```
Icon chip: `inline-grid; place-items:center; width:32px; height:32px; border-radius:9px; background:#EFF5FF; flex:none`; inner 15×15 lucide `download` (`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`, `m7 10 5 5 5-5`, `M12 15V3`), `stroke:#2563EB`, `stroke-width:2.2`.
Title `Exporting results…` — `13.5px/600/#0E2350`. Body `230 responses · 65% complete` — `12.5px; color:#64748B; margin-top:1px`.
Dismiss: 26×26, `border-radius:7px`, `color:#94A3B8`, `style-hover="background:#F1F5F9"`.
Progress rail `[ALR:50]`: `position:absolute; left:14px; right:14px; bottom:7px; height:3px; border-radius:999px; background:#EEF2F7`; fill `width:65%; height:100%; border-radius:999px; background:#2563EB`. **No transition on the fill.**

**Trigger row** `[ALR:53–56]`: `display:flex; gap:14px; align-items:center; margin-top:8px`. Button is the **Navy** variant at default size (`#0E2350` → hover `#16326E`), label `Trigger toast`. Caption `Toasts slide in bottom-right and auto-dismiss after 4s.` — `font-size:13px; color:#94A3B8`.

**Live toast behaviour** `[SRC:1526–1533, 1720–1726]` — the runtime realisation of that caption:
```
position:fixed; right:24px; bottom:24px; z-index:95;
display:flex; align-items:center; gap:12px;
background:#0E2350; color:#FFFFFF; padding:14px 16px; border-radius:12px;
box-shadow:0 16px 40px rgba(14,35,80,.35);
animation: st-toast-in .25s ease;
max-width:340px;
```
Auto-dismiss timer = **4000 ms** (`setTimeout(… , 4000)` `[SRC:1724]`), cleared and restarted on each trigger. Note the live toast's shadow (`0 16px 40px / .35`) and `max-width` (340px) differ from the static specimen (`0 12px 32px / .28`, 330px).

---

## 8. Data inventory

These eight screens are the design-system reference; almost everything on them is **static specification copy**. The complete inventory:

### 8.1 Metrics (numbers that would have to be computed)

| Visible label / context | Example value in design | Unit / format | Would be computed from | Cite |
|---|---|---|---|---|
| Count badge (unlabelled pill) | `3` | integer, no separator; pill grows via `min-width:20px` + `padding:0 6px` | count of unread notifications for the signed-in user | `[BDG:21]` |
| Toast B secondary line, part 1 | `230 responses` | integer + noun; pluralisation not shown | `COUNT(responses)` for the exporting test | `[ALR:48]` |
| Toast B secondary line, part 2 | `65% complete` | integer percent, `%` suffix, no decimals | export job progress = processed ÷ total × 100 | `[ALR:48]` |
| Toast B progress fill width | `width:65%` | CSS percentage, must equal the number above | same export-job progress | `[ALR:50]` |
| Success alert body | `28 students` (inside "…shared with 28 students.") | integer | `COUNT(students)` in the assigned class/roster | `[ALR:14]` |
| Success toast body | `28 students` | integer | same as above | `[ALR:43]` |
| Warning alert body | `Two questions` (spelled out) | English cardinal word, not a numeral | `COUNT(questions WHERE correct_answer IS NULL)` — note the design spells small numbers as words here but uses numerals elsewhere | `[ALR:21]` |
| Caption specimen | `UPDATED 2 HOURS AGO` | relative time, uppercase copy (no CSS transform) | `now − record.updated_at`, humanised | `[TYP:12]` |
| Info alert body | `Monday at 9:00 AM` | weekday + `h:mm A` | the test's scheduled publish datetime, in the viewer's timezone | `[ALR:9]` |

### 8.2 Labels (element names / field names — translatable UI chrome)

Section eyebrows `01 · Brand`, `02 · Foundations`, `03 · Foundations`, `04 · Components`, `05 · Components`, `06 · Components`, `07 · Components` `[LOGO:2]`, `[COL:2]`, `[TYP:2]`, `[BTN:2]`, `[FRM:2]`, `[BDG:2]`, `[ALR:2]`.
Section headings `Logo`, `Color`, `Typography — Google Sans`, `Buttons`, `Forms & inputs`, `Badges & tags`, `Alerts & toasts`.
Group labels `Brand navy`, `Primary blue`, `Accent teal`, `Neutrals`, `Semantic`, `Variants`, `Sizes · icons · states`, `Checkbox — try it`, `Radio — try it`, `Switch — try it`, `Alerts`, `Toasts`.
Swatch names + hex captions — the 21 rows of §2.2 (these are spec data, not app data).
Type-scale gutter labels — the 8 rows of §3.1.
Button labels `Primary`, `Navy`, `Accent`, `Secondary`, `Outline`, `Ghost`, `Destructive`, `Link`, `Small`, `Default`, `Large`, `Create test`, `View results`, `Disabled`, `Saving…`, `Trigger toast`, `Review questions`, `Dismiss`, `Retry`.
Form labels `Test name`, `Email *`, `Class code`, `Search`, `Subject`, `Instructions`, `Shuffle question order`, `Show results immediately`, `Disabled option`, `Multiple choice`, `Open answer`, `Timed test`, `Email me results`.
Badge labels `Default`, `Primary`, `Navy`, `Accent`, `Success`, `Warning`, `Error`, `Neutral`, `Outline`, `Live`, `Scheduled`, `Draft`, `Grade 7`.
Masthead pills `v1.0`, `Google Sans`, `Light + Dark`.
`aria-label`s: `Settings` `[BTN:26]`, `Dismiss` ×4 `[ALR:10,15,44,49]`.
`alt` text: `SchoolTest` `[HDR:3]`, `SchoolTest logo`, `SchoolTest mark`, `SchoolTest on navy` `[LOGO:5–7]`.

### 8.3 Static copy / placeholders / example field values

| Text | Kind | Cite |
|---|---|---|
| `Design System` | page title | `[HDR:4]` |
| `Foundations and components for the SchoolTest landing page, web dashboard, and desktop app. Token names are shadcn/ui compatible — see tokens.css for the drop-in variables (light + dark).` | lead paragraph | `[HDR:5]` |
| `Smarter Tests. Better Results.` / `Create a test in minutes` / `Track every student` / `Results at a glance` / `Recent activity` | type specimens | `[TYP:5–9]` |
| `Create, manage, and analyze tests effortlessly. Share with your class in one click and watch results arrive in real time.` | body specimen | `[TYP:10]` |
| `Supporting copy for cards, table cells and form helpers.` | body-sm specimen | `[TYP:11]` |
| `e.g. Midterm Algebra` | input placeholder | `[FRM:8]` |
| `Visible to students on the cover page.` | helper text | `[FRM:9]` |
| `mia@schooltest` | **example field value** (deliberately invalid, drives the error state) | `[FRM:13]` |
| `Enter a valid email address.` | inline validation message | `[FRM:14]` |
| `7B-2026` | **example field value**, disabled | `[FRM:18]` |
| `Disabled — assigned by your school.` | helper text | `[FRM:19]` |
| `Search tests…` | input placeholder | `[FRM:25]` |
| `Mathematics`, `Science`, `History`, `English` | select options (example enum) | `[FRM:32]` |
| `Optional notes shown before the test starts…` | textarea placeholder | `[FRM:39]` |
| `Heads up` / `Test published` / `Unsaved changes` / `Couldn't publish` | alert titles | `[ALR:9,14,20,31]` |
| `Students will see this test on Monday at 9:00 AM.` | alert body (contains a metric, §8.1) | `[ALR:9]` |
| `Science Quiz was shared with 28 students.` | alert body (contains a metric) | `[ALR:14]` |
| `Two questions have no correct answer marked.` | alert body (contains a metric) | `[ALR:21]` |
| `Check your connection and try again.` | alert body | `[ALR:32]` |
| `Exporting results…` | toast title | `[ALR:48]` |
| `Toasts slide in bottom-right and auto-dismiss after 4s.` | spec caption | `[ALR:55]` |

---

## 9. Responsive behaviour present in the markup

**There are zero `@media` queries in the design-system source.** (`grep -n "@media" "…/SchoolTest Design System.dc.html"` returns nothing; the only `<style>` block is `[SRC:11–25]` and contains none.) Every responsive affordance is intrinsic:

| Mechanism | Value | Where |
|---|---|---|
| Page container cap | `max-width:1240px; margin:0 auto` | every section `[HDR:2]`, `[LOGO:1]`, `[COL:1]`, `[TYP:1]`, `[BTN:1]`, `[FRM:1]`, `[BDG:1]`, `[ALR:1]` |
| Section padding | `64px 48px 0` (masthead: `64px 48px 56px`) — fixed, does **not** shrink | same |
| Measure caps | `max-width:640px` (lead), `max-width:560px` (body specimen), `max-width:330px` (toasts), `max-width:340px` (live toast) | `[HDR:5]`, `[TYP:10]`, `[ALR:41,46]`, `[SRC:1527]` |
| `flex-wrap:wrap` | masthead pill row, both button rows, both badge rows, toast row | `[HDR:6]`, `[BTN:7,20]`, `[BDG:5,16]`, `[ALR:40]` |
| Fluid inputs | `width:100%; box-sizing:border-box` on input / search / select / textarea | `[FRM:8,13,18,25,31,39]` |
| `flex:1; min-width:0` | alert & toast body columns — lets long strings truncate instead of overflowing | `[ALR:9,14,19,30,43,48]` |
| `flex:none` | icon chips, dismiss buttons, gutter labels (`width:150px; flex:none`) | `[TYP:5]`, `[ALR:8,10]` |
| Fixed grids with **no** breakpoint | `repeat(3,1fr)` (logo tiles `[LOGO:4]`, both form blocks `[FRM:5,43]`), `repeat(6,1fr)` (all five colour groups `[COL:7,15,25,34,45]`), `1fr 1fr` (alert grid `[ALR:6]`) | — |

Consequence for the rebuild: **the column collapse behaviour for those grids is undefined by the design** and must be decided by the engineer. See UNKNOWNS.

---

## 10. Radius, spacing and size inventory (as literally used)

**Border-radius steps:** `5px` (checkbox box), `6px` (inline code), `7px` (26px dismiss button), `8px` (sm button, alert action button), `9px` (32px toast icon chip), `10px` (default button, all inputs, colour swatch, 36px alert icon chip, icon-only button) ← equals `--radius: 0.625rem` `[TOK:48]`, `12px` (lg button, toast), `14px` (alert card), `16px` (all section cards, logo tiles), `50%` (radio ring, radio dot, switch knob, status dot), `999px` (pill badge, switch track, progress rail, count badge).

**Border widths:** `1px` (cards, inputs, outline button, outline badge, section rule), `1.5px` (checkbox box, radio ring), `2px` (loading spinner ring), `3px` (input focus/error ring, via box-shadow spread).

**SVG stroke widths:** `2` (settings icon), `2.2` (all alert/toast/form/status icons), `2.4` (plus, arrow-right, all ✕ icons), `3.2` (checkbox tick).

**Icon sizes:** `11px` (tick), `12px` (tag ✕), `13px` (inline error, dismiss ✕), `15px` (button icons, search, chevron, toast B icon), `16px` (icon-only button), `17px` (alert icons, toast A icon).

**Gaps used:** `6, 7, 8, 9, 10, 12, 13, 14, 20, 22, 24, 26, 28` px.
**Paddings used:** `0 6px`, `2px 7px`, `3px 11px`, `4px 11px`, `4px 6px 4px 11px`, `5px 12px`, `6px 12px`, `7px 13px`, `9px 17px`, `10px 4px`, `10px 13px`, `10px 13px 10px 38px`, `10px 18px`, `10px 36px 10px 13px`, `13px 14px 17px`, `13px 26px`, `14px 16px`, `15px 16px`, `28px`, `36px`, `64px 48px 0`, `64px 48px 56px`.

---

## TAILWIND V4 MAPPING

Target file: `src/app/globals.css`, CSS-first `@theme` block. `.claude/rules/tailwind.md:11` forbids raw hex/HSL, so every value below is given as OKLCH (sRGB → Oklab, D65, exact conversion; `L` and `C` to 4 dp, `H` to 2 dp).

### A. Brand ramps → `--color-*`

| `tokens.css` var | Hex | `@theme` variable | OKLCH |
|---|---|---|---|
| `--navy-950` | `#0A1A3C` | `--color-navy-950` | `oklch(0.2270 0.0691 263.09)` |
| `--navy-900` | `#0E2350` | `--color-navy-900` | `oklch(0.2692 0.0871 263.04)` |
| `--navy-800` | `#16326E` | `--color-navy-800` | `oklch(0.3341 0.1099 263.00)` |
| `--blue-700` | `#1D4ED8` | `--color-brand-700` | `oklch(0.4882 0.2172 264.38)` |
| `--blue-600` | `#2563EB` | `--color-brand-600` | `oklch(0.5461 0.2152 262.88)` |
| `--blue-500` | `#3B82F6` | `--color-brand-500` | `oklch(0.6231 0.1880 259.81)` |
| `--blue-100` | `#DBEAFE` | `--color-brand-100` | `oklch(0.9319 0.0316 255.59)` |
| `--blue-50` | `#EFF5FF` | `--color-brand-50` | `oklch(0.9685 0.0148 260.73)` |
| `--teal-600` | `#0D9488` | `--color-accent-600` | `oklch(0.6002 0.1038 184.70)` |
| `--teal-500` | `#14B8A6` | `--color-accent-500` | `oklch(0.7038 0.1230 182.50)` |
| `--teal-100` | `#CCFBF1` | `--color-accent-100` | `oklch(0.9527 0.0498 180.80)` |
| `--teal-50` | `#F0FDFA` | `--color-accent-50` | `oklch(0.9836 0.0142 180.72)` |

> Name the blue ramp `brand-*`/`accent-*` rather than `blue-*`/`teal-*` — Tailwind v4 already ships `--color-blue-*` and `--color-teal-*` in its default theme, and redefining them silently changes every stock utility.

### B. shadcn semantic layer (light) → `@theme` + `:root`

Declare the raw values on `:root` (and `.dark`) and reference them from `@theme` so runtime theme switching works:

| `tokens.css` var | Hex | CSS var to emit | OKLCH |
|---|---|---|---|
| `--background` | `#F7F9FC` | `--color-background` | `oklch(0.9814 0.0045 258.32)` |
| `--foreground` | `#0E2350` | `--color-foreground` | `oklch(0.2692 0.0871 263.04)` |
| `--card` | `#FFFFFF` | `--color-card` | `oklch(1.0000 0 0)` |
| `--card-foreground` | `#0E2350` | `--color-card-foreground` | `oklch(0.2692 0.0871 263.04)` |
| `--popover` | `#FFFFFF` | `--color-popover` | `oklch(1.0000 0 0)` |
| `--popover-foreground` | `#0E2350` | `--color-popover-foreground` | `oklch(0.2692 0.0871 263.04)` |
| `--primary` | `#2563EB` | `--color-primary` | `oklch(0.5461 0.2152 262.88)` |
| `--primary-foreground` | `#FFFFFF` | `--color-primary-foreground` | `oklch(1.0000 0 0)` |
| *(hover, from `[BTN:8]`)* | `#1D4ED8` | `--color-primary-hover` | `oklch(0.4882 0.2172 264.38)` |
| `--secondary` | `#EFF5FF` | `--color-secondary` | `oklch(0.9685 0.0148 260.73)` |
| `--secondary-foreground` | `#16326E` | `--color-secondary-foreground` | `oklch(0.3341 0.1099 263.00)` |
| *(hover, `[BTN:11]`)* | `#DBEAFE` | `--color-secondary-hover` | `oklch(0.9319 0.0316 255.59)` |
| `--muted` | `#F1F5F9` | `--color-muted` | `oklch(0.9683 0.0069 247.90)` |
| `--muted-foreground` | `#64748B` | `--color-muted-foreground` | `oklch(0.5544 0.0407 257.42)` |
| `--accent` | `#14B8A6` | `--color-accent` | `oklch(0.7038 0.1230 182.50)` |
| `--accent-foreground` | `#FFFFFF` | `--color-accent-foreground` | `oklch(1.0000 0 0)` |
| *(hover, `[BTN:10]`)* | `#0D9488` | `--color-accent-hover` | `oklch(0.6002 0.1038 184.70)` |
| `--destructive` | `#DC2626` | `--color-destructive` | `oklch(0.5771 0.2152 27.33)` |
| `--destructive-foreground` | `#FFFFFF` | `--color-destructive-foreground` | `oklch(1.0000 0 0)` |
| *(hover, `[BTN:14]`)* | `#B91C1C` | `--color-destructive-hover` | `oklch(0.5054 0.1905 27.52)` |
| `--success` | `#16A34A` | `--color-success` | `oklch(0.6271 0.1699 149.21)` |
| `--success-foreground` | `#FFFFFF` | `--color-success-foreground` | `oklch(1.0000 0 0)` |
| `--warning` | `#D97706` | `--color-warning` | `oklch(0.6658 0.1574 58.32)` |
| `--warning-foreground` | `#FFFFFF` | `--color-warning-foreground` | `oklch(1.0000 0 0)` |
| `--border` | `#E3E8F0` | `--color-border` | `oklch(0.9295 0.0121 259.82)` |
| `--input` | `#CBD5E1` | `--color-input` | `oklch(0.8690 0.0198 252.89)` |
| `--ring` | `rgba(37,99,235,.35)` | `--color-ring` | `oklch(0.5461 0.2152 262.88 / 0.35)` |

> `--color-card`, `--color-popover`, and every `*-foreground: #FFFFFF` map to `oklch(1 0 0)`, which is literally pure white. `CLAUDE.md §5.12` bans pure `#fff`/`#000`. Resolve before implementing — the safe tinted substitutes matching this palette are `oklch(0.9955 0.0015 258)` for surfaces and `oklch(0.9930 0.0020 258)` for on-colour text. **Decision required from the design owner** (see UNKNOWNS).

### C. Extra colours used by components but absent from `tokens.css`

| Hex | `@theme` variable | OKLCH | Used for |
|---|---|---|---|
| `#94A3B8` | `--color-muted-foreground-soft` | `oklch(0.7107 0.0351 256.79)` | placeholders, helper text, disabled text, idle dismiss icon |
| `#475569` | `--color-body` | `oklch(0.4455 0.0374 257.28)` | body copy, `--sidebar-foreground`, neutral badge text |
| `#0F172A` | `--color-slate-900` | `oklch(0.2077 0.0398 265.75)` | swatch board only |
| `#E2E8F0` | `--color-disabled` | `oklch(0.9288 0.0126 255.51)` | disabled button fill |
| `#EEF2F7` | `--color-rule` | `oklch(0.9595 0.0080 253.85)` | hairline divider, progress rail track |
| `#DCFCE7` | `--color-success-soft` | `oklch(0.9624 0.0434 156.74)` | success badge / alert chip |
| `#15803D` | `--color-success-strong` | `oklch(0.5273 0.1371 150.07)` | success badge text |
| `#FEF3C7` | `--color-warning-soft` | `oklch(0.9619 0.0580 95.62)` | warning badge / alert chip |
| `#B45309` | `--color-warning-strong` | `oklch(0.5553 0.1455 49.00)` | warning badge text |
| `#FEE2E2` | `--color-destructive-soft` | `oklch(0.9356 0.0309 17.72)` | error badge / alert chip |
| `#B91C1C` | `--color-destructive-strong` | `oklch(0.5054 0.1905 27.52)` | error badge text, destructive hover |
| `#E9EEF5` | `--color-shimmer-mid` | `oklch(0.9473 0.0108 256.70)` | skeleton gradient midpoint `[SRC:1327]` |

### D. Charts & sidebar

| var | Hex | `@theme` variable | OKLCH |
|---|---|---|---|
| `--chart-1` | `#2563EB` | `--color-chart-1` | `oklch(0.5461 0.2152 262.88)` |
| `--chart-2` | `#14B8A6` | `--color-chart-2` | `oklch(0.7038 0.1230 182.50)` |
| `--chart-3` | `#0E2350` | `--color-chart-3` | `oklch(0.2692 0.0871 263.04)` |
| `--chart-4` | `#93C5FD` | `--color-chart-4` | `oklch(0.8091 0.0956 251.81)` |
| `--chart-5` | `#5EEAD4` | `--color-chart-5` | `oklch(0.8549 0.1251 181.07)` |
| `--sidebar` | `#FFFFFF` | `--color-sidebar` | `oklch(1.0000 0 0)` |
| `--sidebar-foreground` | `#475569` | `--color-sidebar-foreground` | `oklch(0.4455 0.0374 257.28)` |
| `--sidebar-primary` | `#2563EB` | `--color-sidebar-primary` | `oklch(0.5461 0.2152 262.88)` |
| `--sidebar-primary-foreground` | `#FFFFFF` | `--color-sidebar-primary-foreground` | `oklch(1.0000 0 0)` |
| `--sidebar-accent` | `#EFF5FF` | `--color-sidebar-accent` | `oklch(0.9685 0.0148 260.73)` |
| `--sidebar-accent-foreground` | `#16326E` | `--color-sidebar-accent-foreground` | `oklch(0.3341 0.1099 263.00)` |
| `--sidebar-border` | `#E3E8F0` | `--color-sidebar-border` | `oklch(0.9295 0.0121 259.82)` |
| `--sidebar-ring` | `rgba(37,99,235,.35)` | `--color-sidebar-ring` | `oklch(0.5461 0.2152 262.88 / 0.35)` |

### E. `.dark` overrides

| var | Hex | OKLCH |
|---|---|---|
| `--color-background` | `#0B1226` | `oklch(0.1876 0.0422 267.69)` |
| `--color-foreground` | `#E6ECF7` | `oklch(0.9418 0.0162 262.75)` |
| `--color-card` | `#111B33` | `oklch(0.2267 0.0490 265.59)` |
| `--color-card-foreground` | `#E6ECF7` | `oklch(0.9418 0.0162 262.75)` |
| `--color-popover` | `#162240` | `oklch(0.2583 0.0590 265.97)` |
| `--color-popover-foreground` | `#E6ECF7` | `oklch(0.9418 0.0162 262.75)` |
| `--color-primary` | `#3B82F6` | `oklch(0.6231 0.1880 259.81)` |
| `--color-primary-foreground` | `#FFFFFF` | `oklch(1.0000 0 0)` |
| `--color-secondary` | `#1A2A4E` | `oklch(0.2916 0.0693 264.46)` |
| `--color-secondary-foreground` | `#C7D6F2` | `oklch(0.8736 0.0421 263.00)` |
| `--color-muted` | `#17233F` | `oklch(0.2609 0.0554 265.25)` |
| `--color-muted-foreground` | `#8FA3C7` | `oklch(0.7127 0.0574 262.12)` |
| `--color-accent` | `#2DD4BF` | `oklch(0.7845 0.1325 181.91)` |
| `--color-accent-foreground` | `#06251F` | `oklch(0.2397 0.0381 177.65)` |
| `--color-destructive` | `#EF4444` | `oklch(0.6368 0.2078 25.33)` |
| `--color-destructive-foreground` | `#FFFFFF` | `oklch(1.0000 0 0)` |
| `--color-success` | `#22C55E` | `oklch(0.7227 0.1920 149.58)` |
| `--color-success-foreground` | `#06250F` | `oklch(0.2348 0.0553 149.80)` |
| `--color-warning` | `#F59E0B` | `oklch(0.7686 0.1647 70.08)` |
| `--color-warning-foreground` | `#2A1B02` | `oklch(0.2355 0.0459 77.82)` |
| `--color-border` | `#223154` | `oklch(0.3186 0.0659 265.32)` |
| `--color-input` | `#2C3D66` | `oklch(0.3664 0.0744 265.83)` |
| `--color-ring` | `rgba(59,130,246,.45)` | `oklch(0.6231 0.1880 259.81 / 0.45)` |
| `--color-chart-1` | `#60A5FA` | `oklch(0.7137 0.1434 254.62)` |
| `--color-chart-2` | `#2DD4BF` | `oklch(0.7845 0.1325 181.91)` |
| `--color-chart-3` | `#93C5FD` | `oklch(0.8091 0.0956 251.81)` |
| `--color-chart-4` | `#1D4ED8` | `oklch(0.4882 0.2172 264.38)` |
| `--color-chart-5` | `#0D9488` | `oklch(0.6002 0.1038 184.70)` |
| `--color-sidebar` | `#0E1830` | `oklch(0.2142 0.0496 265.39)` |
| `--color-sidebar-foreground` | `#A9BADC` | `oklch(0.7873 0.0521 264.21)` |
| `--color-sidebar-primary` | `#3B82F6` | `oklch(0.6231 0.1880 259.81)` |
| `--color-sidebar-primary-foreground` | `#FFFFFF` | `oklch(1.0000 0 0)` |
| `--color-sidebar-accent` | `#1A2A4E` | `oklch(0.2916 0.0693 264.46)` |
| `--color-sidebar-accent-foreground` | `#DBEAFE` | `oklch(0.9319 0.0316 255.59)` |
| `--color-sidebar-border` | `#223154` | `oklch(0.3186 0.0659 265.32)` |
| `--color-sidebar-ring` | `rgba(59,130,246,.45)` | `oklch(0.6231 0.1880 259.81 / 0.45)` |

Also required for the dark toast, which is hard-coded to dark values even in light mode `[ALR:41–44]`: `--color-toast-surface: oklch(0.2692 0.0871 263.04)` (`#0E2350`), `--color-toast-body: oklch(0.7873 0.0521 264.21)` (`#A9BADC`), `--color-toast-icon: oklch(0.7845 0.1325 181.91)` (`#2DD4BF`), `--color-toast-dismiss: oklch(0.7127 0.0574 262.12)` (`#8FA3C7`), hover `oklch(0.3341 0.1099 263.00)` (`#16326E`).

### F. Shadows → `--shadow-*`

Every shadow is navy-tinted; emit the tint once and reuse.

| `@theme` variable | Value (OKLCH alpha form) |
|---|---|
| `--shadow-sm` | `0 1px 2px oklch(0.2692 0.0871 263.04 / 0.06)` |
| `--shadow-md` | `0 2px 8px oklch(0.2692 0.0871 263.04 / 0.08)` |
| `--shadow-lg` | `0 8px 24px oklch(0.2692 0.0871 263.04 / 0.12)` |
| `--shadow-xl` | `0 20px 48px oklch(0.2692 0.0871 263.04 / 0.18)` |
| `--shadow-btn` | `0 1px 2px oklch(0.2692 0.0871 263.04 / 0.08)` (Primary button `[BTN:8]`) |
| `--shadow-alert` | `0 1px 2px oklch(0.2692 0.0871 263.04 / 0.05)` `[ALR:7]` |
| `--shadow-knob` | `0 1px 3px oklch(0.2692 0.0871 263.04 / 0.25)` `[FRM:77]` |
| `--shadow-toast` | `0 12px 32px oklch(0.2692 0.0871 263.04 / 0.28)` (dark) / `… / 0.14` (light) `[ALR:41,46]` |
| `--shadow-toast-live` | `0 16px 40px oklch(0.2692 0.0871 263.04 / 0.35)` `[SRC:1527]` |
| `--shadow-ring-focus` | `0 0 0 3px oklch(0.5461 0.2152 262.88 / 0.16)` `[FRM:8]` |
| `--shadow-ring-error` | `0 0 0 3px oklch(0.5771 0.2152 27.33 / 0.10)` `[FRM:13]` |

### G. Radius → `--radius-*`

| `@theme` variable | Value | Source |
|---|---|---|
| `--radius` | `0.625rem` (10px) | `[TOK:48]` |
| `--radius-xs` | `0.3125rem` (5px) — checkbox | `[FRM:47]` |
| `--radius-sm` | `0.5rem` (8px) — sm button, alert action | `[BTN:21]`, `[ALR:23]` |
| `--radius-md` | `0.625rem` (10px) — default button, inputs, swatch, alert icon chip | `[BTN:8]`, `[FRM:8]` |
| `--radius-lg` | `0.75rem` (12px) — lg button, toast | `[BTN:23]`, `[ALR:41]` |
| `--radius-xl` | `0.875rem` (14px) — alert card | `[ALR:7]` |
| `--radius-2xl` | `1rem` (16px) — section cards, logo tiles | `[COL:4]`, `[LOGO:5]` |
| `--radius-chip` | `0.4375rem` (7px) — 26px dismiss button | `[ALR:10]` |
| `--radius-chip-lg` | `0.5625rem` (9px) — 32px toast icon chip | `[ALR:47]` |
| `--radius-full` | `9999px` | badges, switch, progress rail |

### H. Typography → `--font-*` / `--font-size-*` / `--leading-*` / `--tracking-*`

`--font-sans: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;` `[TOK:8]`
`--font-mono: ui-monospace, Menlo, monospace;` `[HDR:5]`

| Step | `--font-size-*` | `--leading-*` | `--tracking-*` | weight | colour token |
|---|---|---|---|---|---|
| Display | `--font-size-display: 3.5rem` (56px) | `1.05` | `-0.03em` | 700 | `--color-foreground` |
| H1 | `--font-size-h1: 2.5rem` (40px) | `1.15` | `-0.02em` | 700 | `--color-foreground` |
| Page title | `--font-size-page: 2.75rem` (44px) | `1.1` | `-0.02em` | 700 | `--color-foreground` |
| H2 | `--font-size-h2: 2rem` (32px) | `1.2` | `-0.015em` | 700 | `--color-foreground` |
| Section H2 | `--font-size-section: 1.625rem` (26px) | normal | normal | 700 | `--color-foreground` |
| H3 | `--font-size-h3: 1.5rem` (24px) | `1.3` | normal | 600 | `--color-foreground` |
| H4 | `--font-size-h4: 1.125rem` (18px) | `1.4` | normal | 600 | `--color-foreground` |
| Button lg | `--font-size-btn-lg: 0.9375rem` (15px) | normal | normal | 600 | per variant |
| Body | `--font-size-body: 1rem` (16px) | `1.6` | normal | 400 | `--color-body` |
| Body sm | `--font-size-body-sm: 0.875rem` (14px) | `1.55` | normal | 400 | `--color-body` |
| Label | `--font-size-label: 0.84375rem` (13.5px) | normal | normal | 600 | `--color-foreground` |
| Caption lg | `--font-size-caption-lg: 0.8125rem` (13px) | normal | normal | 400 | `--color-muted-foreground-soft` |
| Caption | `--font-size-caption: 0.78125rem` (12.5px) | `1.5` | normal | 500/600 | `--color-muted-foreground` |
| Eyebrow | `--font-size-eyebrow: 0.75rem` (12px) | normal | `0.1em` | 700 | `--color-primary` |
| Group label | `--font-size-group: 0.6875rem` (11px) | normal | `0.08em` | 700 | `--color-muted-foreground-soft` |
| Count | `--font-size-count: 0.71875rem` (11.5px) | normal | normal | 700 | `--color-destructive-foreground` |

`.claude/rules/tailwind.md:17` asks for `clamp()` fluid typography via `--font-size-*`. No fluid behaviour exists in the design (§9 — no media queries), so any `clamp()` is an **addition** requiring sign-off. Suggested if approved, preserving the desktop maximum exactly:
`--font-size-display: clamp(2.25rem, 1.25rem + 3.2vw, 3.5rem)`, `--font-size-h1: clamp(1.875rem, 1.15rem + 2.3vw, 2.5rem)`, `--font-size-h2: clamp(1.5rem, 1.1rem + 1.3vw, 2rem)`.

### I. Motion → `--animate-*` / `--ease-*`

The design uses default `ease`/`linear` only. `.claude/rules/tailwind.md:20` mandates exponential easings; that is a deliberate **upgrade**, not a port. Emit both so the port is auditable:

```
--ease-design: ease;                      /* what the HTML actually uses */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);

--duration-fast:   150ms;   /* buttons, inputs, checkbox, radio  */
--duration-switch: 180ms;   /* switch track + knob               */
--duration-enter:  180ms;   /* st-fade-in / st-pop-in            */
--duration-toast:  250ms;   /* st-toast-in                       */
--duration-spin:   700ms;   /* st-spin                           */
--duration-shimmer:1400ms;  /* st-shimmer                        */

--animate-toast-in: toast-in  250ms var(--ease-out-quart);
--animate-fade-in:  fade-in   180ms var(--ease-out-quart);
--animate-pop-in:   pop-in    180ms var(--ease-out-quart);
--animate-spin:     spin      700ms linear infinite;
--animate-shimmer:  shimmer  1400ms ease infinite;
```

`.claude/rules/tailwind.md:19` allows animating **transform and opacity only**. `st-toast-in`, `st-fade-in`, `st-pop-in`, `st-spin` already comply. Three design behaviours do **not** and need a compliant substitute:
1. `transition:background .15s` on all buttons → animate a `background-color` change (colour transitions are outside the transform/opacity set) — either keep it as a documented exception or swap to an opacity-layered overlay.
2. `transition:border-color .15s, box-shadow .15s` on inputs → same class of exception.
3. `st-shimmer` animates `background-position` → replace with a translated overlay element (`transform: translateX()`).
4. `st-rec-pulse` animates `box-shadow` → replace with a scaled + faded pseudo-element ring.

### J. Spacing

`.claude/rules/tailwind.md:12` mandates a 4pt scale and `:13` bans arbitrary values. The design is **not** on a 4pt grid: `7px, 9px, 11px, 13px, 15px, 17px, 18px, 22px, 26px` all appear (§10). Two options — pick one before implementing, do not mix:
- **(a) Faithful:** define named tokens so no square brackets are needed, e.g. `--spacing-input-y: 0.625rem` (10px), `--spacing-input-x: 0.8125rem` (13px), `--spacing-btn-y: 0.625rem`, `--spacing-btn-x: 1.125rem` (18px), `--spacing-card: 1.75rem` (28px), `--spacing-section-x: 3rem` (48px), `--spacing-section-y: 4rem` (64px).
- **(b) Normalised:** snap to 4pt (`13px→12px`, `18px→16px`, `26px→24px`, `9px→8px`) and accept ~1–2px drift per component. This changes the pixel-close guarantee.

---

## UNKNOWNS

The following are genuinely undeterminable from the eight slices, `tokens.css`, and the design-system source. They are **not** guessed anywhere above.

1. **No `:focus` / `:focus-visible` style exists for buttons.** The only focus treatment in any of the eight files is the input ring `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` `[FRM:8,25,39]`. `tokens.css` defines `--ring: rgba(37,99,235,0.35)` `[TOK:47]` but nothing in the markup consumes it. The button focus ring must be specified by the design owner.
2. **No `:active` / pressed state** is declared for any button, badge, alert action, or form control.
3. **No hover state** is declared for: any badge, the removable tag's ✕, the count badge, form inputs, select, textarea, checkbox, radio, or switch.
4. **No disabled state** is declared for: radio, switch, select, textarea, or any button variant other than the single grey `#E2E8F0` specimen `[BTN:27]` (which variant it is a disabled form of is not stated).
5. **No loading state** is declared for any component other than the Primary button `[BTN:28]`.
6. **No error state** is declared for select, textarea, checkbox, radio, or switch — only the text input `[FRM:13]`.
7. **Breakpoint behaviour is undefined.** There are zero `@media` queries in the design system source. What `grid-template-columns:repeat(3,1fr)` `[FRM:5,43]`, `repeat(6,1fr)` `[COL:7]`, and `1fr 1fr` `[ALR:6]` collapse to below 1240px is not designed.
8. **Section padding `64px 48px`** is fixed with no mobile reduction specified.
9. **Whether `#FFFFFF` should stay pure white** — the design uses literal `#FFFFFF` for cards, popovers, and every `*-foreground` on a coloured fill, but `CLAUDE.md §5 pitfall 12` and `.claude/rules/tailwind.md:11` ban pure `#fff`/`#000`. The tinted substitute values in §B are a proposal, not a design decision.
10. **Font conflict.** The design mandates `Google Sans` (variable TTF shipped at `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/fonts/`); `.claude/rules/tailwind.md:18` lists an allow-list (Instrument Sans, Plus Jakarta Sans, Outfit, Onest, Figtree, Urbanist, DM Sans) that does not include Google Sans — though it is also not on the banned list. Licensing for redistributing `GoogleSans-Variable.ttf` is not stated anywhere in the export.
11. **Logo is PNG only.** `assets/logo.png` and `assets/logo-mark.png`. No SVG, no `@2x`, no favicon, no wordmark-only variant, and no stated minimum size or colour-value set for the mark.
12. **The `--shadow-*` tokens in `tokens.css` are never used verbatim by any component.** `--shadow-sm` is `rgba(14,35,80,.06)` but the Primary button uses `.08` and alerts use `.05`. Whether the components or the tokens are authoritative is undecided.
13. **Dark-mode rendering of buttons, badges, alerts, and form controls is not shown.** All eight slices are light-mode; `.dark` exists only as a token block `[TOK:74–113]`. Which component surface maps to `--card` vs `--popover` vs `--muted` in dark is not demonstrated.
14. **`--popover` is declared twice in `.dark`** `[TOK:79–80]`; the first (`#16224080`, 50% alpha) is dead code. Whether the alpha version was the intent is unknown.
15. **Toast placement/stacking:** the caption says "slide in bottom-right and auto-dismiss after 4s" `[ALR:55]` and the runtime confirms `right:24px; bottom:24px; z-index:95; 4000ms` `[SRC:1527,1724]`, but multi-toast stacking, gap, max count, and exit animation are not defined (the runtime unmounts with no exit animation).
16. **Reduced-motion:** no `@media (prefers-reduced-motion)` rule exists anywhere.
17. **Ghost button text colour is ambiguous:** `#16326E` on the buttons board `[BTN:13]` but `#64748B` for the equivalent ghost "Dismiss" inside the warning alert `[ALR:24]`. Which is the canonical ghost foreground is not stated.
