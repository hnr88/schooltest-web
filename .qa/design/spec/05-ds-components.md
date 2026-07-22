# 05 — Design System Components (Cards, Table, Tabs, Overlays, Navigation, Dashboard, Footers, Dark mode)

**Sources read in full (every claim below is traceable to one of these):**

| Source | Path |
|---|---|
| Cards | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--cards.html` (57 lines) |
| Table | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--table.html` (37 lines) |
| Tabs | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--tabs.html` (26 lines) |
| Overlays | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--overlays.html` (59 lines) |
| Navigation | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--navigation.html` (58 lines) |
| Dashboard components | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--dashboard-components.html` (147 lines) |
| Footers | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--footers.html` (106 lines) |
| Dark mode + live dialog + live toast | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--dark-mode.html` (54 lines) |
| Tokens | `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/tokens.css` (129 lines) |
| Keyframes + interaction state machine (parent export the slices were cut from) | `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/SchoolTest Design System.dc.html` — `<style>` at lines 11–25, `class Component` state/renderVals at lines 1535–1729 |
| Cross-reference only: static toast variants | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--alerts.html` lines 39–56 |

---

## 0. Conventions used by the export (read this first)

1. **Every style is an inline `style` attribute.** There is no external stylesheet for components; the inline styles ARE the spec.
2. **`style-hover="…"`** is a non-standard attribute emitted by the export tool. It carries the **hover-state** declarations that override the base `style`. Example: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--cards.html:41` — base `background:#2563EB`, `style-hover="background:#1D4ED8"`.
3. **`style-focus="…"`** carries the **focus-state** declarations. Example: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--dashboard-components.html:8`.
4. **`{{ binding }}`** is a template hole resolved by the `renderVals()` method in `SchoolTest Design System.dc.html:1555–1728`. All resolved values are listed inline in the relevant sections below.
5. **`<sc-for list="{{ x }}" as="row" hint-placeholder-count="N">`** = repeat block, N placeholder rows in the static render. **`<sc-if value="{{ x }}" hint-placeholder-val="{{ false }}">`** = conditional block, default hidden.
6. **Section shell** — every one of these slices is a `<section>` with identical geometry:
   `max-width:1240px; margin:0 auto; padding:64px 48px 0` (dark-mode slice is `padding:64px 48px 96px`, `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--dark-mode.html:1`).
   Section eyebrow: `font-size:12px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#2563EB; margin-bottom:8px`.
   Section H2: `margin:0 0 24px; font-size:26px; font-weight:700; color:#0E2350`.
   Section numbers observed: `08 · Components` Cards, `09 · Components` Table, `10 · Components` Tabs, `11 · Components` Overlays, `12 · Components` Navigation, `16 · Dashboard` Dashboard components, `17 · Page furniture` Footers, `18 · Modes` Dark mode.
7. **Sub-group label** (repeats everywhere): `font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#94A3B8` with `margin-bottom:14px` (or `12px` in Navigation, `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--navigation.html:35`).
8. **Body font** — `'Google Sans', -apple-system, 'Segoe UI', system-ui, sans-serif`, body color `#475569`, body background `#F7F9FC`, `-webkit-font-smoothing:antialiased` (`SchoolTest Design System.dc.html:14`). Global `a { color:#2563EB; text-decoration:none }`, `a:hover { color:#1D4ED8 }` (lines 15–16). `input::placeholder, textarea::placeholder { color:#94A3B8 }` (line 17). `input, textarea, button, select { font-family: inherit }` (line 18).

### 0.1 Hex → token map (light theme, `tokens.css` `:root`)

| Hex used in components | Token(s) in `tokens.css` |
|---|---|
| `#0E2350` | `--navy-900`, `--foreground`, `--card-foreground`, `--popover-foreground` |
| `#0A1A3C` | `--navy-950` (only as `rgba(10,26,60,.45)` scrim) |
| `#16326E` | `--navy-800`, `--secondary-foreground`, `--sidebar-accent-foreground` |
| `#1D4ED8` | `--blue-700`, `--chart-4` (dark) |
| `#2563EB` | `--blue-600`, `--primary`, `--chart-1`, `--sidebar-primary` |
| `#3B82F6` | `--blue-500`, dark `--primary` |
| `#DBEAFE` | `--blue-100` |
| `#EFF5FF` | `--blue-50`, `--secondary`, `--sidebar-accent` |
| `#0D9488` | `--teal-600`, dark `--chart-5` |
| `#14B8A6` | `--teal-500`, `--accent`, `--chart-2` |
| `#CCFBF1` | `--teal-100` (**not used** in these 8 slices) |
| `#F0FDFA` | `--teal-50` |
| `#F7F9FC` | `--background` |
| `#FFFFFF` | `--card`, `--popover`, `--primary-foreground`, `--sidebar`, `--accent-foreground`, `--destructive-foreground`, `--success-foreground`, `--warning-foreground` |
| `#F1F5F9` | `--muted` |
| `#64748B` | `--muted-foreground` |
| `#DC2626` | `--destructive` |
| `#16A34A` | `--success` |
| `#D97706` | `--warning` |
| `#E3E8F0` | `--border`, `--sidebar-border` |
| `#CBD5E1` | `--input` |
| `rgba(37,99,235,.35)` | `--ring` |
| `#475569` | `--sidebar-foreground` |
| `#93C5FD` | `--chart-4` |
| `#5EEAD4` | `--chart-5` |
| `0 1px 2px rgba(14,35,80,.06)` | `--shadow-sm` |
| `0 2px 8px rgba(14,35,80,.08)` | `--shadow-md` |
| `0 8px 24px rgba(14,35,80,.12)` | `--shadow-lg` |
| `0 20px 48px rgba(14,35,80,.18)` | `--shadow-xl` |
| `--radius: 0.625rem` = 10px | matches button/input radius family, **not** card radius (16px) |

**Hexes with NO token** (must be added as new tokens or hard-coded): `#EEF2F7` (progress-track / hairline divider), `#F8FAFD` (table zebra/head + hover), `#EEF2F7` again as demo-panel bg, `#94A3B8` (tertiary text), `#15803D` (positive delta text), `#DCFCE7` (success chip bg), `#FEF3C7` (warning chip bg), `#B45309` (rank-3 bronze), `#B91C1C` (destructive hover), `#FEF2F2` (destructive hover bg), `#DDE5F0`, `#E9EEF5` (shimmer mid-stop), `#FBFCFE` (dropzone hover), `#8FA3C7`, `#A9BADC`, `#C7D6F2` (these three ARE dark-theme tokens but are used on the **light-mode** navy footer), `#86EFAC`, `#F0FDF4`, `#FEE2E2`.

**Card shadow discrepancy (important):** every card in these slices uses `box-shadow:0 1px 2px rgba(14,35,80,.05)` — alpha **.05**, while `--shadow-sm` is alpha **0.06**. They are NOT the same value. Rebuild with `.05` to be pixel-exact, or accept a 0.01-alpha delta by using `--shadow-sm`.

---

## 1. CARDS

Source: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--cards.html`. Heading: eyebrow `08 · Components`, H2 `Cards & stats`.

### 1.0 Base card (the shared shell — 5 of the 6 card types use it verbatim)

```
background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px;
padding:22px; box-shadow:0 1px 2px rgba(14,35,80,.05)
```
No transition, no hover state declared on the card shell itself.

### 1.1 `StatCard` — metric tile with icon chip + delta (variant A)
`ds--cards.html:5–9` ("Tests created") and `:10–14` ("Students").

Layout, top row: `display:flex; align-items:center; justify-content:space-between`.
- **Label**: `font-size:13px; font-weight:500; color:#64748B` (`--muted-foreground`).
- **Icon chip**: `display:inline-grid; place-items:center; width:34px; height:34px; border-radius:10px; background:#EFF5FF` (blue variant) or `#F0FDFA` (teal variant). Icon is a 16×16 lucide-style SVG, `fill:none`, `stroke-width:2`, `stroke-linecap:round`, `stroke-linejoin:round`; stroke `#2563EB` on the blue chip, `#0D9488` on the teal chip.
  - Blue chip icon = file-text (`M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z` + `M14 2v4a2 2 0 0 0 2 2h4` + `M16 13H8` + `M16 17H8`).
  - Teal chip icon = users (`M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2` + `circle cx=9 cy=7 r=4` + `M22 21v-2a4 4 0 0 0-3-3.87` + `M16 3.13a4 4 0 0 1 0 7.75`).
- **Value**: `font-size:34px; font-weight:700; letter-spacing:-0.02em; color:#0E2350; margin-top:10px`.
- **Delta row**: `display:inline-flex; align-items:center; gap:5px; font-size:12.5px; font-weight:600; color:#15803D; margin-top:6px`. Optional leading 12×12 arrow SVG (`stroke:currentColor; stroke-width:2.6`; path `M5 12h14` + `m12 5 7 7-7 7` with `transform="rotate(-45 12 12)"` producing a diagonal up-right arrow). "Students" card has **no** arrow icon — the icon is optional.

**Data:**
| Visible label | Example value | Type | Unit/format | Computed from |
|---|---|---|---|---|
| Tests created | `12` | metric | integer count | COUNT of tests owned by the current teacher/school |
| (delta) | `+3 this week` | metric | signed integer + period phrase | COUNT of tests created in the trailing 7 days |
| Students | `230` | metric | integer count | COUNT of enrolled students in scope |
| (delta) | `+12 enrolled` | metric | signed integer + noun | COUNT of enrolments in the current period |

### 1.2 `StatCard` — metric tile with progress bar (variant B)
`ds--cards.html:15–19` ("Average score").

Same header row + value as 1.1 (label `Average score`, blue icon chip with bar-chart icon: `M3 3v16a2 2 0 0 0 2 2h16` + `M18 17V9` + `M13 17V5` + `M8 17v-3`, stroke `#2563EB`, `stroke-width:2`, `stroke-linecap:round`, **no** `stroke-linejoin`).
Instead of a delta row, a **progress bar**:
- Track: `margin-top:10px; height:6px; border-radius:999px; background:#EEF2F7; overflow:hidden`.
- Fill: `width:85%; height:100%; border-radius:999px; background:linear-gradient(90deg,#2563EB,#14B8A6)` (primary → accent).
- No transition declared.

**Data:** label `Average score`, value `85%` (metric, integer percent with `%` suffix), bar width `85%` — the bar width is the same number as the value. Computed from mean of all graded result scores in scope, rounded to integer percent.

### 1.3 `TestCard` — wide content card with status pill, avatar stack, progress and actions
`ds--cards.html:22–44`. Sits in a `display:grid; grid-template-columns:1.4fr 1fr; gap:20px; margin-top:20px` row (`ds--cards.html:21`).

Base card shell (1.0). Internals:
- **Header row**: `display:flex; align-items:flex-start; justify-content:space-between; gap:12px`.
  - **Title**: `font-size:16px; font-weight:600; color:#0E2350`.
  - **Status pill (`Live`)**: `display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:#15803D; background:#DCFCE7; padding:3px 10px; border-radius:999px`; leading dot `width:6px; height:6px; border-radius:50%; background:#16A34A`.
  - **Meta line**: `font-size:13.5px; color:#64748B; margin-top:4px` — text `Grade 7 · 24 questions · closes Fri, Apr 18` (separator is `·` U+00B7 with surrounding spaces).
  - **Kebab / more button**: `display:inline-grid; place-items:center; width:32px; height:32px; border-radius:8px; border:none; background:transparent; color:#64748B; cursor:pointer`; hover `background:#F1F5F9`; `aria-label="More"`; icon 16×16, `fill:currentColor`, three `circle r=1.6` at cx 5/12/19, cy 12.
- **Progress row**: `display:flex; align-items:center; gap:18px; margin-top:18px`.
  - **Avatar stack**: `display:flex`; each avatar `display:inline-grid; place-items:center; width:28px; height:28px; border-radius:50%; color:#fff; font-size:10.5px; font-weight:700; border:2px solid #fff`; 2nd..4th get `margin-left:-8px` (overlap). Backgrounds in order: `#0E2350` (AK), `#2563EB` (JM), `#14B8A6` (RS), overflow chip `#F1F5F9` with `color:#475569` and label `+19`.
  - **Caption**: `font-size:13px; color:#64748B` — `22 of 28 submitted`.
  - **Bar**: `flex:1; height:6px; border-radius:999px; background:#EEF2F7; overflow:hidden`; fill `width:78%; height:100%; border-radius:999px; background:#2563EB` (solid, NOT gradient).
- **Action row**: `display:flex; gap:10px; margin-top:18px`.
  - **Primary button**: `display:inline-flex; align-items:center; gap:6px; background:#2563EB; color:#FFFFFF; border:none; font-size:13px; font-weight:600; padding:8px 14px; border-radius:9px; cursor:pointer`; hover `background:#1D4ED8`. Label `View results`.
  - **Secondary button**: `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:13px; font-weight:600; padding:7px 13px; border-radius:9px` (padding is 1px smaller on each axis to compensate for the 1px border → identical outer box as primary); hover `background:#F7F9FC`. Leading 13×13 copy icon (`rect x=8 y=8 w=14 h=14 rx=2` + `M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`, `stroke-width:2.2`). Label `Copy link`.

**Data:**
| Visible label | Example value | Type | Format | Computed from |
|---|---|---|---|---|
| (title) | `Midterm Algebra` | label | string | test.name |
| (status pill) | `Live` | label | enum {Live, Closed, Scheduled, Draft} | test.status |
| (meta) | `Grade 7 · 24 questions · closes Fri, Apr 18` | mixed | `{gradeLabel} · {n} questions · closes {EEE, MMM d}` | test.grade, COUNT(items), test.closesAt |
| avatar initials | `AK` `JM` `RS` | label | 2-letter uppercase initials | first+last name of first 3 participants |
| overflow chip | `+19` | metric | `+` integer | participantCount − 3 |
| submitted caption | `22 of 28 submitted` | metric | `{a} of {b} submitted` | COUNT(submissions), COUNT(assignees) |
| progress bar | `78%` width | metric | percent of width | submitted / assigned (22/28 = 78.57 → rendered 78%) |

### 1.4 `FeaturedCard` — navy promo card
`ds--cards.html:45–52`.

```
background:#0E2350; border-radius:16px; padding:22px; color:#FFFFFF;
display:flex; flex-direction:column; justify-content:space-between;
min-height:180px; position:relative; overflow:hidden
```
(no border, no box-shadow).
- **Watermark image**: `assets/logo-mark.png`, `alt=""`, `position:absolute; right:-22px; bottom:-18px; height:120px; opacity:.14; filter:brightness(0) invert(1)` (renders the mark as pure white).
- **Eyebrow**: `font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#8FA3C7` — static copy `Featured card`.
- **Headline**: `font-size:20px; font-weight:700; margin-top:8px; letter-spacing:-0.01em` — static copy `Smarter Tests.<br />Better Results.` (hard line break).
- **CTA button**: `align-self:flex-start; display:inline-flex; align-items:center; gap:8px; background:#FFFFFF; color:#0E2350; border:none; font-size:13.5px; font-weight:600; padding:9px 16px; border-radius:9px; cursor:pointer`; hover `background:#DBEAFE`; label `Get started` + trailing 14×14 arrow-right (`M5 12h14`, `m12 5 7 7-7 7`, `stroke-width:2.4`).

All content on this card is **static copy** — no metrics.

### 1.5 Card grid geometry
- Stat row: `display:grid; grid-template-columns:repeat(3,1fr); gap:20px` (`ds--cards.html:4`).
- Feature row: `display:grid; grid-template-columns:1.4fr 1fr; gap:20px; margin-top:20px` (`ds--cards.html:21`).
- No media queries; no `minmax()` on this section (unlike Overlays/Navigation/Dashboard which use `minmax(0,…)`).

---

## 2. TABLE & PAGINATION

Source: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--table.html`. Eyebrow `09 · Components`, H2 `Table & pagination`.

### 2.1 `TableCard` shell
```
background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px;
overflow:hidden; box-shadow:0 1px 2px rgba(14,35,80,.05)
```
`overflow:hidden` clips rows to the 16px radius.

### 2.2 Table toolbar (`:5–8`)
`display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid #EEF2F7`.
- **Title**: `font-size:16px; font-weight:600; color:#0E2350` — `Recent tests`.
- **Export button** (tonal variant): `display:inline-flex; align-items:center; gap:6px; background:#EFF5FF; color:#16326E; border:none; font-size:13px; font-weight:600; padding:7px 13px; border-radius:9px; cursor:pointer`; hover `background:#DBEAFE`. Label `Export`, no icon.

### 2.3 Table header row (`:9–11`)
```
display:grid; grid-template-columns:2.2fr 1.2fr .8fr .8fr .9fr .5fr;
padding:10px 22px; background:#F8FAFD; border-bottom:1px solid #EEF2F7;
font-size:11.5px; font-weight:700; letter-spacing:.06em;
text-transform:uppercase; color:#94A3B8
```
Column labels in order: `Test`, `Date`, `Questions`, `Avg`, `Status`, `` (empty 6th for the row-actions column). No sort affordance is present in the markup.

### 2.4 Table body row (`:12–21`)
Repeat block `<sc-for list="{{ tableRows }}" as="row" hint-placeholder-count="4">`.
```
display:grid; grid-template-columns:2.2fr 1.2fr .8fr .8fr .9fr .5fr;
align-items:center; padding:14px 22px; border-bottom:1px solid #F1F5F9;
font-size:14px; transition:background .12s
```
**Hover state:** `background:#F8FAFD` (transitioned over 120ms, no easing keyword → CSS default `ease`).

Cells:
1. **Name cell**: `display:flex; align-items:center; gap:10px`. Icon tile `display:inline-grid; place-items:center; width:30px; height:30px; border-radius:9px; background:{{row.iconBg}}`; 14×14 file icon with `stroke:{{row.iconColor}}; stroke-width:2`. Name `font-weight:600; color:#0E2350`.
2. **Date**: `color:#64748B`.
3. **Questions**: `color:#64748B`.
4. **Avg**: `font-weight:600; color:#0E2350`.
5. **Status pill**: `display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:{{row.stColor}}; background:{{row.stBg}}; padding:3px 10px; border-radius:999px`; leading dot `width:6px; height:6px; border-radius:50%; background:{{row.stDot}}`.
6. **Row actions**: cell `text-align:right`; button `display:inline-grid; place-items:center; width:30px; height:30px; border-radius:8px; border:none; background:transparent; color:#64748B; cursor:pointer`, hover `background:#F1F5F9`, `aria-label="Row actions"`, 15×15 kebab icon (`fill:currentColor`, three `r=1.6` circles).

**Resolved `tableRows` data** (`SchoolTest Design System.dc.html:1677–1682`) — this is the complete status-pill colour system for the table:

| name | date | q | avg | status | stColor | stBg | stDot | iconBg | iconColor |
|---|---|---|---|---|---|---|---|---|---|
| Math Quiz | Apr 15, 2026 | 24 | 88% | Live | `#15803D` | `#DCFCE7` | `#16A34A` | `#EFF5FF` | `#2563EB` |
| Science Test | Apr 10, 2026 | 30 | 76% | Closed | `#475569` | `#F1F5F9` | `#94A3B8` | `#F0FDFA` | `#0D9488` |
| History Exam | Apr 19, 2026 | 26 | — | Scheduled | `#16326E` | `#EFF5FF` | `#2563EB` | `#EFF5FF` | `#2563EB` |
| Reading Check | Apr 22, 2026 | 12 | — | Draft | `#475569` | `#F1F5F9` | `#94A3B8` | `#F0FDFA` | `#0D9488` |

**Data semantics:** `name` = label (test.name); `date` = label formatted `MMM d, yyyy`; `q` = metric, integer count of items; `avg` = metric, integer percent with `%`, **em dash `—` when there are no graded submissions**; `status` = enum label. `iconBg`/`iconColor` alternate blue/teal — in the sample data they correlate with subject, not with status.

### 2.5 Pagination bar (`:22–32`)
`display:flex; align-items:center; justify-content:space-between; padding:14px 22px` (no top border).
- **Range caption**: `font-size:13px; color:#94A3B8` — `Showing 1–4 of 12` (en dash U+2013). Metric: `Showing {from}–{to} of {total}` from page offset, page size and total row count.
- **Control cluster**: `display:flex; gap:6px; align-items:center`.
  - **Prev / Next icon buttons**: `display:inline-grid; place-items:center; width:32px; height:32px; border-radius:8px; border:1px solid #E3E8F0; background:#FFFFFF; color:#94A3B8; cursor:pointer`; hover `background:#F7F9FC`; `aria-label="Previous"` / `"Next"`; 14×14 chevrons `m15 18-6-6 6-6` / `m9 18 6-6-6-6`, `stroke-width:2.4`.
  - **Active page button**: `width:32px; height:32px; border-radius:8px; border:none; background:#2563EB; color:#FFFFFF; font-size:13px; font-weight:600; cursor:pointer` — **no hover override declared**.
  - **Inactive page button**: same box but `border:1px solid #E3E8F0; background:#FFFFFF; color:#475569`; hover `background:#F7F9FC`.
  - **Ellipsis**: `color:#94A3B8; font-size:13px; padding:0 4px`, glyph `…` (U+2026).
  - Order rendered: Prev, `1` (active), `2`, `3`, `…`, Next.

Note the Prev/Next buttons carry `color:#94A3B8` while numbered buttons carry `color:#475569` — the chevrons are deliberately lighter than the digits.

---

## 3. TABS & SEGMENTED CONTROL

Source: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--tabs.html`. Eyebrow `10 · Components`, H2 `Tabs & segmented control`.

**Container** (`:4`): `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; display:flex; flex-direction:column; gap:28px` — note **no box-shadow** on this demo container.

### 3.1 `UnderlineTabs`
Group label: `Underline tabs — try it`.
- **Tablist**: `display:flex; gap:26px; border-bottom:1px solid #E3E8F0`.
- **Tab button**: `background:none; border:none; cursor:pointer; font-size:14px; font-weight:600; padding:0 2px 12px; color:{{tabXColor}}; border-bottom:2px solid {{tabXBorder}}; margin-bottom:-1px; transition:color .15s`.
  `margin-bottom:-1px` pulls the 2px indicator over the 1px tablist rule.
- **States** (`SchoolTest Design System.dc.html:1565–1568`):
  - **active** → `color:#2563EB`, `border-bottom-color:#2563EB`
  - **inactive** → `color:#64748B`, `border-bottom-color:transparent`
  - transition is on `color` only (150ms, default `ease`); the border colour change is instant.
  - No hover state is declared for tabs.
- **Panel**: `padding:16px 2px 0; font-size:14px; color:#64748B`.
- **Default state**: `tab: 'overview'` (`:1540`).
- **Tabs & panel copy** (`:1559–1563`, all static copy):
  - `Overview` → `Overview panel — summary stats and recent activity for this test.`
  - `Questions` → `Questions panel — 24 questions, drag to reorder, click to edit.`
  - `Results` → `Results panel — per-student scores and item analysis.`

### 3.2 `SegmentedControl`
Group label: `Segmented — try it`.
- **Track**: `display:inline-flex; gap:4px; background:#F1F5F9; padding:4px; border-radius:11px`.
- **Segment button**: `border:none; cursor:pointer; font-size:13px; font-weight:600; padding:7px 16px; border-radius:8px; background:{{bg}}; color:{{color}}; box-shadow:{{shadow}}; transition:all .15s`.
- **States** (`:1571–1575`):
  - **selected** → `background:#FFFFFF`, `color:#0E2350`, `box-shadow:0 1px 3px rgba(14,35,80,.12)`
  - **unselected** → `background:transparent`, `color:#64748B`, `box-shadow:none`
  - transition `all .15s` (default `ease`) — background, colour and shadow all animate.
  - No hover state declared.
- **Options / default**: `Week` (default, `seg:'week'` at `:1548`), `Month`, `Year`. All three are static labels; selection would drive a date-range filter.

---

## 4. OVERLAYS

Source: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--overlays.html` (static demos) + `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--dark-mode.html:33–53` (the LIVE dialog and LIVE toast, which carry the animations).

**Section grid** (`ds--overlays.html:4`): `display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr); gap:20px; align-items:start`.
**Demo panel** (the grey stage each overlay sits on): `background:#EEF2F7; border:1px solid #E3E8F0; border-radius:16px; padding:32px` (dialog stage) or `padding:24px` (dropdown / tooltip / popover stages); dialog stage additionally `display:flex; flex-direction:column; gap:16px; align-items:center`.

### 4.1 `Dialog` / `Modal`
**Static surface** (`ds--overlays.html:7–14`):
```
background:#FFFFFF; border-radius:16px;
box-shadow:0 20px 48px rgba(14,35,80,.18);   /* == --shadow-xl */
padding:24px; width:100%; max-width:360px; box-sizing:border-box
```
**Live surface** (`ds--dark-mode.html:35`) differs:
```
background:#FFFFFF; border-radius:16px;
box-shadow:0 28px 64px rgba(14,35,80,.3);
padding:24px; width:380px; max-width:calc(100vw - 48px); box-sizing:border-box;
animation:st-pop-in .18s ease
```
**Scrim / overlay** (`ds--dark-mode.html:34`):
```
position:fixed; inset:0; background:rgba(10,26,60,.45);
backdrop-filter:blur(2px); display:grid; place-items:center;
z-index:90; animation:st-fade-in .18s ease
```
Click on the scrim closes (`onClick="{{ closeDialog }}"`); click inside the panel calls `stopProp` (`e.stopPropagation()`, `:1718`). No exit animation is defined — the node is removed by `sc-if` when `dialogOpen` goes false (`:1717`); default state `dialogOpen:false` (`:1549`).

**Internals (identical in both):**
- Header: `display:flex; align-items:flex-start; justify-content:space-between`.
  - Title `font-size:17px; font-weight:700; color:#0E2350` — `Delete this test?`
  - Close button `display:inline-grid; place-items:center; width:28px; height:28px; border-radius:8px; border:none; background:transparent; color:#64748B; cursor:pointer`; hover `background:#F1F5F9`; `aria-label="Close"`; 14×14 X icon, `stroke-width:2.4`, `stroke-linecap:round`.
- Body: `margin:8px 0 0; font-size:14px; line-height:1.55; color:#64748B` — `"History Exam" and its 26 responses will be permanently removed. This can't be undone.` (`26` is a metric: COUNT of responses to be destroyed; the quoted name is a label.)
- Footer: `display:flex; justify-content:flex-end; gap:10px; margin-top:20px`.
  - Cancel: `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:13.5px; font-weight:600; padding:8px 15px; border-radius:9px`, hover `background:#F7F9FC`.
  - Destructive: `background:#DC2626; color:#FFFFFF; border:none; font-size:13.5px; font-weight:600; padding:9px 16px; border-radius:9px`, hover `background:#B91C1C`. Label `Delete test`.
- **Trigger** (`ds--overlays.html:15`): `display:inline-flex; align-items:center; gap:8px; background:#0E2350; color:#FFFFFF; border:none; font-size:13.5px; font-weight:600; padding:9px 16px; border-radius:9px; cursor:pointer`, hover `background:#16326E`; label `Open as modal`.

### 4.2 `DropdownMenu`
`ds--overlays.html:20–26`.
- **Surface**: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:12px; box-shadow:0 8px 24px rgba(14,35,80,.12)` (`--shadow-lg`); `padding:6px; width:200px`.
- **Item**: `display:flex; align-items:center; gap:10px; width:100%; background:none; border:none; text-align:left; font-size:13.5px; font-weight:500; color:#0E2350; padding:9px 10px; border-radius:8px; cursor:pointer`; hover `background:#F1F5F9`. Leading 14×14 icon with `stroke:#64748B; stroke-width:2`.
- **Destructive item**: same box, `color:#DC2626`, icon `stroke:currentColor` (so it inherits red), hover `background:#FEF2F2`.
- **Separator**: `height:1px; background:#EEF2F7; margin:5px 8px`.
- Items in order: `Edit test` (pencil), `Duplicate` (copy), `Share by email` (envelope), separator, `Delete` (trash). All static labels.
- No open/close animation is declared for the dropdown.

### 4.3 `Tooltip`
`ds--overlays.html:31`.
- **Bubble**: `background:#0E2350; color:#FFFFFF; font-size:12.5px; font-weight:500; padding:6px 11px; border-radius:8px; box-shadow:0 4px 12px rgba(14,35,80,.25)`. Content `Copy share link` (static copy). **No arrow/caret element exists in the markup.**
- Demo stack: `display:flex; flex-direction:column; align-items:flex-start; gap:8px` — bubble sits **above** the trigger with an 8px gap.
- **Trigger (icon button, outline variant)**: `display:inline-grid; place-items:center; width:36px; height:36px; background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; border-radius:10px; cursor:pointer`; hover `background:#F7F9FC`; `aria-label="Copy link"`; 15×15 copy icon.
- No animation declared.

### 4.4 `Popover`
`ds--overlays.html:38–45`.
- **Surface**: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:14px; box-shadow:0 8px 24px rgba(14,35,80,.12)` (`--shadow-lg`); `padding:18px; width:100%; max-width:250px; box-sizing:border-box`. Note radius **14px**, one step tighter than cards (16px) and looser than the dropdown (12px).
- **Title**: `font-size:14.5px; font-weight:700; color:#0E2350` — `Share "Science Quiz"` (label; quoted part = test name).
- **Body**: `margin:5px 0 0; font-size:13px; line-height:1.5; color:#64748B` — `Anyone with the link can take this test.` (static copy).
- **Row**: `display:flex; gap:8px; margin-top:14px`.
  - **Readonly input**: `flex:1; min-width:0; box-sizing:border-box; padding:8px 11px; border-radius:9px; border:1px solid #CBD5E1; font-size:12.5px; color:#64748B; background:#F8FAFD; outline:none`, `readOnly`. Value `schooltest.app/t/8fk2` — data: share URL, format `schooltest.app/t/{shortCode}`.
  - **Copy button**: `background:#2563EB; color:#FFFFFF; border:none; font-size:12.5px; font-weight:600; padding:8px 13px; border-radius:9px; cursor:pointer; flex:none`, hover `background:#1D4ED8`.
- No animation declared.

### 4.5 `Toast` (lives in the Overlays family; markup in `ds--dark-mode.html:47–53`, static variants in `ds--alerts.html:41–51`)
**Live toast** (`ds--dark-mode.html:48`):
```
position:fixed; right:24px; bottom:24px; z-index:95;
display:flex; align-items:center; gap:12px;
background:#0E2350; color:#FFFFFF; padding:14px 16px; border-radius:12px;
box-shadow:0 16px 40px rgba(14,35,80,.35);
animation:st-toast-in .25s ease; max-width:340px
```
- **Leading icon**: 17×17 check-in-circle, `stroke:#2DD4BF; stroke-width:2.2; flex:none`.
- **Text block** (`flex:1`): title `font-size:13.5px; font-weight:600` (inherits `#FFFFFF`) — `Test published`; description `font-size:12.5px; color:#A9BADC; margin-top:1px` — `Science Quiz shared with 28 students.` (`28` = metric, COUNT of recipients).
- **Dismiss button**: `display:inline-grid; place-items:center; width:26px; height:26px; border-radius:7px; border:none; background:transparent; color:#8FA3C7; cursor:pointer; flex:none`; hover `background:#16326E`; `aria-label="Dismiss"`; 13×13 X, `stroke-width:2.4`.
- **Behaviour** (`SchoolTest Design System.dc.html:1721–1726`): `showToast()` sets `toastVisible:true` and starts a **4000 ms** timer that flips it back to false; `hideToast()` clears the timer and hides immediately; the timer is cleared on unmount (`:1553`). Default `toastVisible:false` (`:1550`). **No exit animation** — the node is removed.
- **Documented behaviour string** (`ds--alerts.html:55`): "Toasts slide in bottom-right and auto-dismiss after 4s."
- **Static light variant** (`ds--alerts.html:46–51`) for reference: `position:relative; background:#FFFFFF; border:1px solid #E3E8F0; padding:13px 14px 17px; border-radius:12px; box-shadow:0 12px 32px rgba(14,35,80,.14); max-width:330px`; 32×32 `#EFF5FF` icon tile with `#2563EB` download icon; title `Exporting results…` `#0E2350`; sub `230 responses · 65% complete` `#64748B`; bottom progress rail `position:absolute; left:14px; right:14px; bottom:7px; height:3px; border-radius:999px; background:#EEF2F7` with `width:65%` fill `#2563EB`. Static dark variant at `:41` matches the live toast but with `box-shadow:0 12px 32px rgba(14,35,80,.28)` and `max-width:330px`.

### 4.6 `Avatar` (documented inside the Overlays section, `ds--overlays.html:46–53`)
Group label `Avatars`, `margin:22px 0 14px`. Row: `display:flex; align-items:center; gap:12px; flex-wrap:wrap`.
All avatars: `display:inline-grid; place-items:center; border-radius:50%; font-weight:700`.

| Size | Box | font-size | background | color | Sample |
|---|---|---|---|---|---|
| xs | 24×24 | 9.5px | `#EFF5FF` | `#2563EB` | MK |
| sm | 32×32 | 12px | `#2563EB` | `#fff` | JM |
| md | 40×40 | 14px | `#0E2350` | `#fff` | AK |
| md + presence | 40×40 | 14px | `#14B8A6` | `#fff` | RS |
| lg | 56×56 | 18px | `#DBEAFE` | `#16326E` | ST |

**Presence dot** (on the md variant only): parent gets `position:relative`; dot `position:absolute; right:0; bottom:0; width:11px; height:11px; border-radius:50%; background:#16A34A; border:2px solid #EEF2F7` — the ring colour is the **demo stage** colour, so in production it must be set to the surrounding surface colour.
Also see the 28×28 stacked avatar variant in §1.3 (`font-size:10.5px`, `border:2px solid #fff`, `margin-left:-8px`) and the 34×34 sidebar/topbar avatar in §5 (`font-size:12.5px`).

---

## 5. NAVIGATION

Source: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--navigation.html`. Eyebrow `12 · Components`, H2 `Navigation`.
**Section grid** (`:4`): `display:grid; grid-template-columns:minmax(220px,260px) minmax(0,1fr); gap:20px; align-items:start`. Right column is `display:flex; flex-direction:column; gap:20px; min-width:0`.

### 5.1 `Sidebar`
`ds--navigation.html:5–18`.
**Shell**: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:16px 12px; display:flex; flex-direction:column; gap:2px; box-shadow:0 1px 2px rgba(14,35,80,.05)`.
- **Logo**: `assets/logo.png`, `height:26px; width:auto; align-self:flex-start; margin:8px 10px 18px`.
- **Nav item — active**: `display:flex; align-items:center; gap:11px; font-size:14px; font-weight:600; color:#FFFFFF; background:#2563EB; padding:10px 12px; border-radius:10px; text-decoration:none` (no transition declared on the active item).
- **Nav item — default**: `display:flex; align-items:center; gap:11px; font-size:14px; font-weight:500; color:#475569; padding:10px 12px; border-radius:10px; text-decoration:none; transition:background .12s`; **hover** `background:#F1F5F9; color:#0E2350`.
  Weight steps 500 → 600 between default and active; only `background` is transitioned (120ms), colour snaps.
- **Icon**: 16×16, `fill:none`, `stroke:currentColor`, `stroke-width:2`, round caps/joins.
- **Count badge** (on `Tests`): `margin-left:auto; display:inline-grid; place-items:center; min-width:20px; height:20px; padding:0 6px; border-radius:999px; background:#EFF5FF; color:#2563EB; font-size:11.5px; font-weight:700`. Value `12` — metric, COUNT of tests.
- **Divider**: `height:1px; background:#EEF2F7; margin:10px 8px`.
- **Items in order**: `Dashboard` (active, grid icon: 4 rects 7×9/7×5/7×9/7×5 with `rx=1`), `Tests` (file icon + badge `12`), `Results` (check-in-circle), `Analytics` (bar chart), `Students` (users), divider, `Settings` (gear + `circle r=3`).
- **User block**: `display:flex; align-items:center; gap:10px; margin:14px 8px 6px; padding-top:14px; border-top:1px solid #EEF2F7`.
  - Avatar 34×34, `border-radius:50%; background:#0E2350; color:#fff; font-size:12.5px; font-weight:700` — `MK`.
  - Name `font-size:13.5px; font-weight:600; color:#0E2350; white-space:nowrap; overflow:hidden; text-overflow:ellipsis` inside `min-width:0` wrapper — `Mia Kessler`.
  - Role `font-size:12px; color:#94A3B8` — `Teacher · 7B` (label; user.role + user.primaryClass).

### 5.2 `Topbar`
`ds--navigation.html:20–33`.
**Shell**: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:12px 18px; display:flex; flex-wrap:wrap; align-items:center; gap:14px 22px; box-shadow:0 1px 2px rgba(14,35,80,.05)`.
`flex-wrap:wrap` + the two-value gap (`14px` row, `22px` column) is the **only responsive mechanism** in this component.
- **Logo mark**: `assets/logo-mark.png`, `height:24px; width:auto`.
- **Nav**: `display:flex; flex-wrap:wrap; gap:4px`.
  - **Active link**: `font-size:14px; font-weight:600; color:#0E2350; background:#F1F5F9; padding:8px 14px; border-radius:9px; text-decoration:none` — `Product`.
  - **Default link**: `font-size:14px; font-weight:500; color:#475569; padding:8px 14px; border-radius:9px; text-decoration:none`; hover `background:#F1F5F9; color:#0E2350`. Items: `Pricing`, `For schools`, `Resources`. No transition declared here (unlike the sidebar).
- **Right cluster**: `margin-left:auto; display:flex; flex-wrap:wrap; align-items:center; gap:12px`.
  - **Notification bell**: `position:relative; display:inline-grid; place-items:center; width:36px; height:36px; border-radius:10px; border:none; background:transparent; color:#475569; cursor:pointer`; hover `background:#F1F5F9`; `aria-label="Notifications"`; 17×17 bell. **Unread dot**: `position:absolute; top:7px; right:8px; width:7px; height:7px; border-radius:50%; background:#DC2626; border:1.5px solid #fff` (boolean state: has unread notifications).
  - **CTA button**: `display:inline-flex; align-items:center; gap:8px; background:#2563EB; color:#FFFFFF; border:none; font-size:13.5px; font-weight:600; padding:9px 16px; border-radius:9px; cursor:pointer`; hover `background:#1D4ED8`. Label `Get started`.
  - **Avatar**: 34×34, `border-radius:50%; background:#14B8A6; color:#fff; font-size:12.5px; font-weight:700` — `MK`.

### 5.3 `Breadcrumbs`
`ds--navigation.html:34–43`. Card: base card shell but `padding:18px 22px`.
- Row: `display:flex; align-items:center; gap:8px; font-size:13.5px`.
- **Ancestor link**: `color:#64748B; font-weight:500; text-decoration:none`; hover `color:#2563EB`.
- **Separator**: 13×13 chevron-right SVG, `stroke:#CBD5E1; stroke-width:2.4`, round caps/joins.
- **Current page**: `color:#0E2350; font-weight:600` (a `<span>`, not a link).
- Trail: `Dashboard` › `Tests` › `Midterm Algebra` (last item = current entity name).

### 5.4 `EmptyState` (documented in the Navigation section)
`ds--navigation.html:44–52`. Card: base shell, `padding:18px 22px`; group label `Empty state`.
- Body: `display:flex; flex-direction:column; align-items:center; gap:12px; padding:26px 0 14px; text-align:center`.
- **Icon tile**: `display:inline-grid; place-items:center; width:52px; height:52px; border-radius:16px; background:#EFF5FF`; 22×22 file icon `stroke:#2563EB; stroke-width:2`.
- **Title**: `font-size:15px; font-weight:600; color:#0E2350` — `No tests yet`.
- **Description**: `font-size:13.5px; color:#64748B; max-width:280px` — `Create your first test and share it with your class in under a minute.`
- **CTA**: `display:inline-flex; align-items:center; gap:7px; background:#2563EB; color:#FFFFFF; border:none; font-size:13.5px; font-weight:600; padding:9px 16px; border-radius:9px; cursor:pointer; margin-top:4px`; hover `background:#1D4ED8`; leading 14×14 plus icon (`M5 12h14`, `M12 5v14`, `stroke-width:2.4`); label `Create test`.

### 5.5 `Pagination`
Specified in §2.5 — the export places pagination inside the Table section, not the Navigation section.

---

## 6. DASHBOARD COMPONENTS

Source: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--dashboard-components.html`. Eyebrow `16 · Dashboard`, H2 `Dashboard components`.
**Row grids** (all `gap:20px`, all rows after the first get `margin-top:20px`):
- Row A (`:5`) — full-width filter bar.
- Row B (`:20`) — `grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr); align-items:stretch`.
- Row C (`:49`) — `grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); align-items:start`.
- Row D (`:112`) — `grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); align-items:start`.

### 6.1 `FilterBar` (search + filter chips + range segmented) — `:5–18`
**Shell**: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:14px 18px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; box-shadow:0 1px 2px rgba(14,35,80,.05)`.

**a) SearchInput** (`:6–9`) — wrapper `position:relative; flex:1; min-width:200px`.
- Icon: 15×15 magnifier, `stroke:#94A3B8; stroke-width:2.2; stroke-linecap:round`, `position:absolute; left:12px; top:50%; transform:translateY(-50%)`.
- Input: `width:100%; box-sizing:border-box; padding:9px 13px 9px 36px; border-radius:10px; border:1px solid #CBD5E1; font-size:13.5px; color:#0E2350; background:#FFFFFF; outline:none; transition:border-color .15s, box-shadow .15s`.
- **Focus state**: `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)`. (Note: the ring alpha here is **.16**, whereas `--ring` in tokens.css is `rgba(37,99,235,0.35)` — they differ.)
- Placeholder `Search students, tests…` (`#94A3B8` from the global rule).

**b) FilterChip — active/removable** (`:10`, `:11`)
`display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#FFFFFF; background:#2563EB; padding:6px 6px 6px 13px; border-radius:999px` (asymmetric padding leaves room for the X). Trailing 12×12 X, `stroke:currentColor; stroke-width:2.4`. Labels `Grade 7`, `Live` — dynamic labels sourced from the applied filter set.

**c) AddFilterChip** (`:12`)
`display:inline-flex; align-items:center; gap:6px; background:#FFFFFF; color:#16326E; border:1px dashed #CBD5E1; font-size:12.5px; font-weight:600; padding:6px 13px; border-radius:999px; cursor:pointer`; hover `background:#F7F9FC`; leading 12×12 plus (`stroke-width:2.4`). Label `Add filter` (static copy).

**d) RangeSegmented** (`:13–17`) — a second, smaller segmented control than §3.2.
- Track: `display:inline-flex; gap:4px; background:#F1F5F9; padding:4px; border-radius:10px; margin-left:auto`.
- Selected button: `border:none; cursor:pointer; font-size:12.5px; font-weight:600; padding:6px 13px; border-radius:7px; background:#FFFFFF; color:#0E2350; box-shadow:0 1px 3px rgba(14,35,80,.12)`.
- Unselected: same box with `background:transparent; color:#64748B` and no shadow.
- **No transition declared on this variant** (unlike §3.2 which has `transition:all .15s`).
- Options: `30 days` (selected), `Quarter`, `Year`.

### 6.2 `BarChartCard` — "Average score by week" — `:21–30`
**Shell**: base card (`padding:22px`).
- **Header**: `display:flex; align-items:center; justify-content:space-between`. Title `font-size:15px; font-weight:600; color:#0E2350` = `Average score by week`; right meta `font-size:12px; color:#94A3B8` = `Grade 7` (scope label).
- **Plot area**: `display:flex; align-items:flex-end; gap:14px; height:140px; margin-top:20px`.
- **Column**: `flex:1; display:flex; flex-direction:column; align-items:center; gap:7px; height:100%; justify-content:flex-end`.
- **Bar**: `width:100%; max-width:38px; border-radius:8px 8px 3px 3px` (rounded top, nearly-square bottom); height is a **percentage of the 140px column**.
- **X label**: `font-size:11.5px; color:#94A3B8`; the highlighted column's label is `font-size:11.5px; font-weight:600; color:#2563EB`.
- **Series colour ramp — 3 tiers:**

| Bar | height | fill | label | label style |
|---|---|---|---|---|
| W1 | `52%` (≈72.8px) | `#DBEAFE` (`--blue-100`) | `W1` | `#94A3B8` |
| W2 | `64%` (≈89.6px) | `#DBEAFE` | `W2` | `#94A3B8` |
| W3 | `58%` (≈81.2px) | `#DBEAFE` | `W3` | `#94A3B8` |
| W4 | `78%` (≈109.2px) | `#93C5FD` (`--chart-4`) | `W4` | `#94A3B8` |
| W5 | `88%` (≈123.2px) | `#2563EB` (`--chart-1`) + `box-shadow:0 4px 12px rgba(37,99,235,.3)` | `W5` | `#2563EB`, weight 600 |

The gradient of tints encodes recency: older weeks pale, the previous week mid, the current week full primary with a coloured glow. Bar heights are **the metric** — each is `avgScorePercent` for that week rendered as a share of the 140px plot height (i.e. the y-axis is 0–100% and the heights read directly as the percentages 52/64/58/78/88). No axis, no gridlines, no value labels, no tooltip in the markup. No transition/animation on the bars.

### 6.3 `DonutGaugeCard` — "Completion rate" — `:31–39`
**Shell**: base card + `display:flex; flex-direction:column`.
- **Label**: `font-size:13px; font-weight:500; color:#64748B` = `Completion rate`.
- **Centering wrapper**: `display:grid; place-items:center; flex:1; margin-top:8px`.
- **Gauge box**: `position:relative; width:120px; height:120px`.
- **SVG**: `width=120 height=120 viewBox="0 0 120 120"`.
  - **Track circle**: `cx=60 cy=60 r=52 fill=none stroke=#EEF2F7 stroke-width=11`.
  - **Value circle**: `cx=60 cy=60 r=52 fill=none stroke=#14B8A6` (`--accent`) `stroke-width=11 stroke-linecap=round stroke-dasharray=326.7 stroke-dashoffset=62 transform="rotate(-90 60 60)"`.
  - **Maths**: circumference = 2π·52 = **326.7256**; the dasharray is set to that value; visible arc = 326.7 − 62 = 264.7 → **81.02%**, which is exactly the printed `81%`. To rebuild: `dashoffset = C · (1 − value)`. Rotation −90° puts the start at 12 o'clock, sweeping clockwise.
- **Centre stack**: `position:absolute; inset:0; display:grid; place-items:center`, inner `text-align:center`.
  - Value `font-size:26px; font-weight:700; color:#0E2350; line-height:1` = `81%`.
  - Caption `font-size:11px; color:#94A3B8; margin-top:3px` = `this term` (period label).
- No animation. Metric: completed submissions ÷ assigned submissions over the current term, integer percent.

### 6.4 `SparklineStatCard` — "Active students" — `:40–46`
**Shell**: base card + `display:flex; flex-direction:column`.
- **Header row**: `display:flex; align-items:center; justify-content:space-between`. Label `font-size:13px; font-weight:500; color:#64748B` = `Active students`; delta `display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:#15803D` = `+8%` (no icon present).
- **Value**: `font-size:30px; font-weight:700; letter-spacing:-0.02em; color:#0E2350; margin-top:8px` = `186`. (Note: 30px here vs 34px on the §1.1 stat cards.)
- **Sparkline holder**: `flex:1; display:flex; align-items:flex-end; margin-top:10px`.
- **SVG**: `width="100%" height="52" viewBox="0 0 200 52" preserveAspectRatio="none"` — stretches horizontally, fixed 52px tall.
  - **Area path**: `M0 40 L25 34 L50 38 L75 26 L100 30 L125 18 L150 22 L175 10 L200 14 L200 52 L0 52 Z`, `fill:#EFF5FF` (no stroke).
  - **Line path**: `M0 40 L25 34 L50 38 L75 26 L100 30 L125 18 L150 22 L175 10 L200 14`, `fill:none; stroke:#2563EB; stroke-width:2.5; stroke-linecap:round`. Straight polyline — **not** smoothed.
  - 9 samples at x = 0,25,50,…,200; y values 40,34,38,26,30,18,22,10,14 in a 0–52 space where **lower y = higher value**.
- Metrics: `186` = COUNT of distinct students active in the selected range; `+8%` = period-over-period change in that count; the 9 y-values = the same series bucketed into 9 periods, mapped into the 0–52 viewBox.

### 6.5 `ActivityFeedCard` — "Recent activity" — `:50–58`
**Shell**: base card with `padding:20px 22px`.
- **Title**: `font-size:15px; font-weight:600; color:#0E2350; margin-bottom:14px` = `Recent activity`.
- **List**: `display:flex; flex-direction:column; gap:14px`.
- **Item**: `display:flex; gap:11px; align-items:flex-start`.
  - **Icon bubble**: `display:inline-grid; place-items:center; width:30px; height:30px; border-radius:50%; flex:none` — three semantic variants:

    | Variant | bubble bg | icon stroke | icon | stroke-width |
    |---|---|---|---|---|
    | success / completion | `#DCFCE7` | `#16A34A` | check `M20 6 9 17l-5-5` | 2.4 |
    | info / publish | `#EFF5FF` | `#2563EB` | file | 2 |
    | warning / at-risk | `#FEF3C7` | `#D97706` | alert-triangle | 2.2 |
  - **Text**: `font-size:13px; line-height:1.5; color:#475569`; the actor/subject is wrapped in `font-weight:600; color:#0E2350`.
  - **Timestamp**: `font-size:11.5px; color:#94A3B8; margin-top:2px`.
- **Footer button (ghost, full width)**: `margin-top:14px; width:100%; background:transparent; color:#2563EB; border:none; font-size:12.5px; font-weight:600; padding:7px; border-radius:8px; cursor:pointer`; hover `background:#EFF5FF`. Label `View all activity`.

**Data (3 seeded rows):**
| Bold subject | Rest of sentence | Timestamp | Types |
|---|---|---|---|
| `Amara K.` | ` finished Midterm Algebra — 92%` | `4 min ago` | subject = label (student short name); `92%` = metric (that submission's score); timestamp = relative time |
| `You` | ` published Science Quiz to 7B` | `1 hr ago` | all labels (current user, test name, class code) |
| `3 students` | ` haven't started History Exam` | `2 hrs ago` | `3` = metric (COUNT of assignees with no attempt) |

### 6.6 `UpcomingListCard` + `TopPerformersList` (one card, two blocks) — `:59–79`
**Shell**: base card with `padding:20px 22px`.

**a) Upcoming**
- Title `font-size:15px; font-weight:600; color:#0E2350; margin-bottom:14px` = `Upcoming`.
- List `display:flex; flex-direction:column; gap:10px`.
- **Row**: `display:flex; align-items:center; gap:12px; border:1px solid #EEF2F7; border-radius:12px; padding:11px 13px` (bordered, no shadow, no fill).
  - **Date tile**: `display:flex; flex-direction:column; align-items:center; width:40px; flex:none; border-radius:9px; padding:5px 0`; background `#EFF5FF` (blue variant) or `#F0FDFA` (teal variant). Month `font-size:10px; font-weight:700; text-transform:uppercase`, colour `#2563EB` (blue) / `#0D9488` (teal). Day `font-size:16px; font-weight:700; color:#0E2350; line-height:1.1`.
  - **Body**: `flex:1; min-width:0`. Name `font-size:13.5px; font-weight:600; color:#0E2350`; meta `font-size:12px; color:#94A3B8`.
  - **Status pill**: `display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:600; padding:3px 9px; border-radius:999px; flex:none`. `Scheduled` → `color:#16326E; background:#EFF5FF`. `Draft` → `color:#475569; background:#F1F5F9`. **No leading dot on these pills** (unlike the table/card status pills).
  - Rows: `Apr 19 · History Exam · 9:00 AM · Grade 7B · Scheduled` (blue tile); `Apr 22 · Reading Check · 11:30 AM · Grade 7A · Draft` (teal tile).
  - Data types: month/day = date parts of `scheduledAt`; name = label; meta = `{h:mm A} · {className}`; pill = status enum.

**b) Top performers**
- Title `font-size:15px; font-weight:600; color:#0E2350; margin:18px 0 12px` = `Top performers`.
- List `display:flex; flex-direction:column; gap:10px`.
- **Row**: `display:flex; align-items:center; gap:10px`.
  - **Rank**: `width:20px; font-size:12.5px; font-weight:700; flex:none`; **rank-specific colours**: 1 → `#D97706` (gold/warning), 2 → `#94A3B8` (silver), 3 → `#B45309` (bronze).
  - **Avatar**: 28×28 circle, `font-size:10.5px; font-weight:700; color:#fff; flex:none`; backgrounds `#0E2350`, `#2563EB`, `#14B8A6` for ranks 1/2/3 (same palette rotation as §1.3).
  - **Name**: `font-size:13.5px; font-weight:600; color:#0E2350; flex:1`.
  - **Score**: `font-size:13px; font-weight:700; color:#0E2350`.
  - Rows: `1 · AK · Amara Khan · 96%`; `2 · JM · Jonas Meyer · 93%`; `3 · RS · Rosa Silva · 91%`.
  - Data: rank = ordinal position after sorting; name = label; score = metric, integer percent = student's mean score over the selected range.

### 6.7 `DropzoneCard` — "Import questions" — `:81–85`
```
background:#FFFFFF; border:1.5px dashed #CBD5E1; border-radius:16px;
padding:26px; display:flex; flex-direction:column; align-items:center;
text-align:center; cursor:pointer;
transition:border-color .15s, background .15s
```
**Hover state**: `border-color:#2563EB; background:#FBFCFE` — the only card in the whole export with a hover transition on its own shell.
- **Icon tile**: `display:inline-grid; place-items:center; width:44px; height:44px; border-radius:14px; background:#EFF5FF`; 19×19 upload icon `stroke:#2563EB; stroke-width:2`.
- **Title**: `font-size:14px; font-weight:600; color:#0E2350; margin-top:12px` = `Import questions`.
- **Hint**: `font-size:12.5px; color:#94A3B8; margin-top:3px` = `Drop a CSV or DOCX here, or ` + inline `browse` styled `color:#2563EB; font-weight:600`. All static copy.

### 6.8 `InviteRowCard` — "Invite a co-teacher" — `:86–96`
**Shell**: base card with `padding:18px 20px`.
- **Title**: `font-size:13px; font-weight:600; color:#0E2350; margin-bottom:12px` = `Invite a co-teacher`.
- **Row**: `display:flex; gap:8px`.
  - **Email input**: `flex:1; min-width:0; box-sizing:border-box; padding:9px 12px; border-radius:9px; border:1px solid #CBD5E1; font-size:13px; color:#0E2350; background:#FFFFFF; outline:none`; **focus** `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` (note: this input declares focus styles but **no `transition`**, unlike the search input in 6.1a). Placeholder `colleague@school.edu`.
  - **Select** (custom chevron): wrapper `position:relative; flex:none`. Select `appearance:none; padding:9px 30px 9px 12px; border-radius:9px; border:1px solid #CBD5E1; font-size:13px; font-weight:600; color:#16326E; background:#FFFFFF; outline:none; cursor:pointer`. Options `Editor`, `Viewer`. Chevron 12×12, `stroke:#64748B; stroke-width:2.4`, `position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none`.
  - **Send button**: `background:#2563EB; color:#FFFFFF; border:none; font-size:13px; font-weight:600; padding:9px 15px; border-radius:9px; cursor:pointer; flex:none`; hover `background:#1D4ED8`.

### 6.9 `SkeletonCard` — loading placeholder — `:97–108`
**Shell**: base card with `padding:20px`.
- **Every skeleton element** shares: `background:linear-gradient(90deg,#F1F5F9 25%,#E9EEF5 37%,#F1F5F9 63%); background-size:400px 100%; animation:st-shimmer 1.4s ease infinite`.
- **Avatar skeleton**: `display:inline-block; width:38px; height:38px; border-radius:50%; flex:none`.
- **Line skeleton**: `display:block; height:11px; border-radius:6px`; widths used: `60%`, `85%` (inside the header column, `display:flex; flex-direction:column; gap:8px; flex:1`), then a full-width `100%` line `margin-top:14px`, then a `70%` line `margin-top:8px`.
- Header wrapper: `display:flex; align-items:center; gap:12px`.
- **Caption**: `font-size:11px; color:#94A3B8; margin-top:12px; text-align:center` = `Skeleton loading state` (demo-only label).

### 6.10 `CommandPalette` — ⌘K — `:113–125`
**Shell**: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:6px; box-shadow:0 16px 40px rgba(14,35,80,.12)` (elevated far above cards — same blur/spread as the live toast, different alpha).
- **Search row**: `display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid #F1F5F9`.
  - 15×15 magnifier `stroke:#94A3B8; stroke-width:2.2`.
  - Prompt text `font-size:14px; color:#94A3B8; flex:1` = `Type a command or search…` (rendered as a `<span>`, i.e. a placeholder mock, not a real input).
  - **Kbd chip**: `font-size:11px; font-weight:600; color:#64748B; background:#F1F5F9; padding:3px 7px; border-radius:6px; font-family:ui-monospace,Menlo,monospace` = `⌘K`.
- **Results body**: `padding:8px 6px`.
  - **Group heading**: `font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#94A3B8; padding:6px 10px` = `Quick actions`.
  - **Item — highlighted/selected**: `display:flex; align-items:center; gap:11px; padding:9px 10px; border-radius:9px; background:#EFF5FF; cursor:pointer`; icon 14×14 plus `stroke:#2563EB; stroke-width:2.4`; label `font-size:13.5px; font-weight:600; color:#0E2350; flex:1` = `Create new test`; trailing **kbd chip** `font-size:11px; font-weight:600; color:#64748B; background:#FFFFFF; border:1px solid #E3E8F0; padding:2px 6px; border-radius:5px; font-family:ui-monospace,Menlo,monospace` = `N`.
  - **Item — default**: same box without background; hover `background:#F8FAFD`; icon `stroke:#64748B; stroke-width:2`; label `font-size:13.5px; color:#0E2350; flex:1` (weight 400, i.e. selected items bold to 600).
  - Default items: `Add student to 7B` (users icon), `Export results as CSV` (download icon).
- No open/close animation declared for the palette.

### 6.11 `SettingsList` — toggles + slider — `:126–142`
**Shell**: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:8px 20px; box-shadow:0 1px 2px rgba(14,35,80,.05)` (note the unusual `8px 20px`).
- **Row**: `display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 0; border-bottom:1px solid #F1F5F9`; the **last row has no bottom border**.
- **Row text**: title `font-size:13.5px; font-weight:600; color:#0E2350`; description `font-size:12px; color:#94A3B8; margin-top:2px`.

**a) Toggle / Switch** (`:129` on, `:133` off)
- Track: `position:relative; display:inline-block; width:40px; height:22px; border-radius:999px; flex:none; cursor:pointer`. **On** `background:#2563EB`; **off** `background:#CBD5E1` (`--input`).
- Knob: `position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#FFFFFF; box-shadow:0 1px 3px rgba(14,35,80,.25)`. **On** adds `transform:translateX(18px)`; **off** has no transform.
- **No transition is declared on the knob in this instance** — the equivalent Forms-section switch uses the same `translateX(18px)` geometry (`SchoolTest Design System.dc.html:1695–1696`, `sw1Knob`/`sw2Knob`).

**b) Slider** (`:137–140`)
- Cluster: `display:flex; align-items:center; gap:10px; flex:none`.
- Track: `position:relative; width:120px; height:6px; border-radius:999px; background:#EEF2F7`.
- Fill: `width:60%; height:100%; border-radius:999px; background:#2563EB`.
- Thumb: `position:absolute; left:60%; top:50%; transform:translate(-50%,-50%); width:16px; height:16px; border-radius:50%; background:#FFFFFF; border:2px solid #2563EB; box-shadow:0 1px 4px rgba(14,35,80,.2); cursor:grab`.
- Value readout: `font-size:13px; font-weight:700; color:#0E2350; width:36px` = `60%` (fixed width so the track doesn't shift as digits change).

**Data (3 settings rows):**
| Title | Description | Control | Value | Type |
|---|---|---|---|---|
| `Email results to students` | `Sent as soon as you approve grades` | switch | ON | boolean setting |
| `Lock tests after due date` | `Late submissions need your approval` | switch | OFF | boolean setting |
| `Passing threshold` | `Scores below this show as at-risk` | slider + readout | `60%` | integer percent 0–100; drives the at-risk classification everywhere else |

---

## 7. FOOTERS & PAGE FURNITURE

Source: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--footers.html`. Eyebrow `17 · Page furniture`, H2 `Footers & page furniture`.

### 7.1 `MarketingFooter` (navy, 4-column) — `:5–55`
**Shell**: `background:#0E2350; border-radius:16px; overflow:hidden`.
**Upper**: `padding:44px 40px 36px; display:grid; grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(0,1fr)); gap:36px`.
- **Brand column**:
  - Logo `assets/logo.png`, `height:30px; width:auto; filter:brightness(0) invert(1)`.
  - Blurb `margin:14px 0 0; font-size:13.5px; line-height:1.6; color:#8FA3C7; max-width:240px` = `Smarter tests and better results for teachers, students, and schools.` (static copy).
  - **Social buttons**: row `display:flex; gap:10px; margin-top:18px`; each `display:inline-grid; place-items:center; width:34px; height:34px; border-radius:9px; background:#16326E; color:#A9BADC; text-decoration:none`; hover `background:#1A2A4E; color:#FFFFFF`. `aria-label` values `X`, `YouTube`, `LinkedIn`. X icon is `fill:currentColor` 14×14; YouTube 15×15 and LinkedIn 14×14 are stroked (`stroke-width:2`).
- **Link columns (3)**:
  - Heading `font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#8FA3C7`.
  - List `display:flex; flex-direction:column; gap:11px; margin-top:16px`.
  - Link `font-size:13.5px; color:#C7D6F2; text-decoration:none`; hover `color:#FFFFFF`.
  - `Product` → Test builder, AI feedback, Analytics, Pricing.
  - `For schools` → Districts, Language centers, Universities, Case studies.
  - `Company` → About, Blog, Careers, Contact.
- **Lower bar**: `border-top:1px solid #1A2A4E; padding:18px 40px; display:flex; align-items:center; gap:20px; flex-wrap:wrap`.
  - Copyright `font-size:12.5px; color:#8FA3C7` = `© 2026 SchoolTest, Inc.`
  - Legal links `font-size:12.5px; color:#8FA3C7; text-decoration:none`, hover `color:#FFFFFF`: `Privacy`, `Terms`, `Security`.
  - **Language select** (`margin-left:auto`, `position:relative`): select `appearance:none; padding:7px 30px 7px 32px; border-radius:9px; border:1px solid #223154; font-size:12.5px; font-weight:600; color:#C7D6F2; background:#16326E; outline:none; cursor:pointer`; options `English`, `Español`, `Deutsch`. **Two decorative SVGs**: globe 13×13 `stroke:#8FA3C7; stroke-width:2` at `left:11px; top:50%; translateY(-50%)`, and chevron 12×12 `stroke:#8FA3C7; stroke-width:2.4` at `right:10px`; both `pointer-events:none`.

All content in 7.1 is static copy; the only dynamic value is the year in the copyright.

### 7.2 `AppFooter` (light, single-row) — `:57–66`
`background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:20px 32px; display:flex; align-items:center; gap:20px; flex-wrap:wrap; margin-top:20px` (no shadow).
- Logo mark `height:22px; width:auto`.
- Copyright `font-size:12.5px; color:#94A3B8` = `© 2026 SchoolTest`.
- Link cluster `display:flex; gap:18px; margin-left:auto; flex-wrap:wrap`; links `font-size:13px; font-weight:500; color:#64748B; text-decoration:none`, hover `color:#2563EB`: `Help center`, `Privacy`, `Terms`.
- **Status indicator**: `display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#15803D` with dot `width:7px; height:7px; border-radius:50%; background:#16A34A`; text `All systems operational` — this is a **status label** bound to a system-health feed.

### 7.3 `CookieBanner` — `:70–77`
`background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:18px 22px; box-shadow:0 12px 32px rgba(14,35,80,.14); display:flex; align-items:center; gap:18px; flex-wrap:wrap`.
- Icon tile `display:inline-grid; place-items:center; width:38px; height:38px; border-radius:11px; background:#EFF5FF; flex:none`; 17×17 info icon `stroke:#2563EB; stroke-width:2`.
- Copy `flex:1; min-width:220px; font-size:13px; line-height:1.55; color:#475569` = `We use cookies to keep you signed in and measure what's working.` + inline link `Cookie policy` (`font-weight:600`, colour from the global `a` rule `#2563EB`).
- Buttons `display:flex; gap:9px; flex:none`:
  - `Only essential` — outline: `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:13px; font-weight:600; padding:8px 15px; border-radius:9px`; hover `background:#F7F9FC`.
  - `Accept all` — navy: `background:#0E2350; color:#FFFFFF; border:none; font-size:13px; font-weight:600; padding:9px 16px; border-radius:9px`; hover `background:#16326E`.
- The `min-width:220px` on the copy + `flex-wrap:wrap` makes the buttons drop below the text on narrow viewports.

### 7.4 `NotFound` / 404 block — `:78–86`
`background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:36px; display:flex; flex-direction:column; align-items:center; text-align:center` (no shadow).
- **Numeral**: `font-size:64px; font-weight:700; letter-spacing:-0.04em; color:#0E2350; line-height:1; display:flex; align-items:center; gap:12px` — literal characters `4` … `4` with `assets/logo-mark.png` (`alt="0"`, `height:52px; width:auto`) standing in for the middle zero.
- Title `font-size:16px; font-weight:600; color:#0E2350; margin-top:16px` = `This page hopped away`.
- Body `font-size:13.5px; color:#64748B; margin-top:5px; max-width:300px` = `The link may be broken, or the test may have been deleted.`
- Buttons `display:flex; gap:10px; margin-top:18px`: primary `Back to dashboard` (`#2563EB`, `padding:9px 17px; border-radius:9px; font-size:13.5px; font-weight:600`, hover `#1D4ED8`); outline `Report a problem` (`padding:8px 16px`, `border:1px solid #CBD5E1`, `color:#16326E`, hover `background:#F7F9FC`).

### 7.5 `AuthCard` — sign-in — `:88–101`
`background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:32px; box-shadow:0 8px 24px rgba(14,35,80,.08)`.
- Logo `height:26px; width:auto`.
- Title `font-size:20px; font-weight:700; color:#0E2350; margin-top:20px` = `Welcome back`.
- Subtitle `font-size:13.5px; color:#64748B; margin-top:4px` = `Sign in to your teacher account`.
- **Google OAuth button**: `width:100%; display:inline-flex; align-items:center; justify-content:center; gap:9px; background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:13.5px; font-weight:600; padding:10px; border-radius:10px; cursor:pointer; margin-top:20px`; hover `background:#F7F9FC`. Icon = 15×15 4-path Google G with brand fills `#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`. Label `Continue with Google`.
- **Divider**: `display:flex; align-items:center; gap:12px; margin:18px 0`; rules `flex:1; height:1px; background:#EEF2F7`; word `font-size:12px; color:#94A3B8` = `or`.
- **Inputs** (stack `display:flex; flex-direction:column; gap:12px`): `width:100%; box-sizing:border-box; padding:10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF; outline:none; transition:border-color .15s, box-shadow .15s`; **focus** `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)`. Placeholders `you@school.edu`, `Password`.
- **Forgot link**: row `display:flex; justify-content:flex-end; margin-top:10px`; link `font-size:12.5px; font-weight:600` (colour from global `a`) = `Forgot password?`.
- **Submit**: `width:100%; background:#2563EB; color:#FFFFFF; border:none; font-size:14px; font-weight:600; padding:11px; border-radius:10px; cursor:pointer; margin-top:14px`; hover `background:#1D4ED8`. Label `Sign in`.
- **Footer line**: `font-size:13px; color:#64748B; text-align:center; margin-top:16px` = `New to SchoolTest? ` + link `Create an account` (`font-weight:600`).

### 7.6 Section layout
Row (`:68`): `display:grid; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); gap:20px; align-items:start`; left column is `display:flex; flex-direction:column; gap:20px` holding 7.3 + 7.4, right column holds 7.5.

---

## 8. DARK MODE OVERRIDES

Source: `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--dark-mode.html:1–30`. Eyebrow `18 · Modes`, H2 `Dark mode` (the eyebrow/H2 stay in **light** colours — only the demo panel is dark).

**Dark stage**: `background:#0B1226` (`--background` dark); `border-radius:16px; padding:32px; display:flex; flex-direction:column; gap:26px`.

### 8.1 Buttons on dark (`:6–9`) — row `display:flex; gap:14px; flex-wrap:wrap; align-items:center`
All share `display:inline-flex; align-items:center; gap:8px; font-size:14px; font-weight:600; border-radius:10px; cursor:pointer`.

| Variant | background | color | border | padding | hover |
|---|---|---|---|---|---|
| Primary | `#3B82F6` (dark `--primary`) | `#FFFFFF` | none | `10px 18px` | `background:#2563EB` |
| Secondary | `#1A2A4E` (dark `--secondary`) | `#C7D6F2` (dark `--secondary-foreground`) | none | `10px 18px` | `background:#223154` (dark `--border`) |
| Outline | `transparent` | `#C7D6F2` | `1px solid #2C3D66` (dark `--input`) | `9px 17px` | `background:#17233F` (dark `--muted`) |
| Accent | `#2DD4BF` (dark `--accent`) | `#06251F` (dark `--accent-foreground`) | none | `10px 18px` | `background:#14B8A6` |

**Light→dark button mapping**: primary `#2563EB`→`#3B82F6` (hover `#1D4ED8`→`#2563EB`); accent text flips from white to near-black `#06251F`; outline border `#CBD5E1`→`#2C3D66`.

### 8.2 Badges on dark (`:10–11`)
- **Accent badge**: `font-size:12.5px; font-weight:600; color:#5EEAD4; background:rgba(45,212,191,.14); padding:4px 11px; border-radius:999px`.
- **Live badge**: `display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#86EFAC; background:rgba(34,197,94,.14); padding:4px 11px; border-radius:999px`; dot `width:6px; height:6px; border-radius:50%; background:#22C55E` (dark `--success`).
- **Rule derived**: on dark, chip backgrounds become the semantic colour at **14% alpha** rather than a solid tint, and the text steps to the 300-level tint (`#5EEAD4`, `#86EFAC`) rather than the 700-level used on light (`#15803D`, `#0D9488`).

### 8.3 Dark demo grid (`:13`)
`display:grid; grid-template-columns:280px 1fr 1fr; gap:20px; align-items:start` — note the fixed 280px first column (no `minmax`).

### 8.4 Form field on dark (`:14–18`)
- Field stack `display:flex; flex-direction:column; gap:7px`.
- Label `font-size:13.5px; font-weight:600; color:#E6ECF7` (dark `--foreground`) = `Test name`.
- Input `width:100%; box-sizing:border-box; padding:10px 13px; border-radius:10px; border:1px solid #2C3D66; font-size:14px; color:#E6ECF7; background:#111B33` (dark `--card`) `; outline:none; transition:border-color .15s, box-shadow .15s`; **focus** `border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,.22)`. Placeholder `e.g. Midterm Algebra`.
- Helper `font-size:12.5px; color:#8FA3C7` (dark `--muted-foreground`) = `Helper text on dark surfaces.`
- **Light→dark focus ring mapping**: `rgba(37,99,235,.16)` → `rgba(59,130,246,.22)`.

### 8.5 Stat card on dark (`:19–23`) — direct override of §1.2
```
background:#111B33; border:1px solid #223154; border-radius:14px; padding:20px
```
(**no box-shadow on dark cards**; radius drops 16px→14px, padding 22px→20px vs light.)
- Label `font-size:13px; font-weight:500; color:#8FA3C7` (light was `#64748B`).
- Icon chip `width:32px; height:32px; border-radius:9px; background:#1A2A4E` (light: 34×34, radius 10, `#EFF5FF`); icon 15×15 (light 16×16) `stroke:#60A5FA` (dark `--chart-1`; light `#2563EB`).
- Value `font-size:30px; font-weight:700; letter-spacing:-0.02em; color:#E6ECF7` (light: 34px, `#0E2350`) = `85%`.
- Progress track `margin-top:10px; height:6px; border-radius:999px; background:#17233F` (light `#EEF2F7`); fill `width:85%; background:linear-gradient(90deg,#3B82F6,#2DD4BF)` (light `#2563EB→#14B8A6`).

### 8.6 Alert on dark (`:24–27`)
```
display:flex; gap:12px; align-items:flex-start;
background:rgba(59,130,246,.10); border:1px solid rgba(59,130,246,.35);
border-radius:12px; padding:14px 16px
```
- Icon 17×17 info, `stroke:#60A5FA; stroke-width:2.2; flex:none; margin-top:1px`.
- Title `font-size:14px; font-weight:600; color:#E6ECF7` = `Heads up`.
- Body `font-size:13.5px; color:#A9BADC; margin-top:2px` = `Dark alert on token ` + inline code `--secondary` styled `font-family:ui-monospace,Menlo,monospace; font-size:12px`.
- **Rule**: dark alerts are `rgba(primary, .10)` fill + `rgba(primary, .35)` border, i.e. tinted glass rather than the solid pale fills used on light.

### 8.7 Complete dark token delta (from `tokens.css:74–114`)
| Token | Light | Dark |
|---|---|---|
| `--background` | `#F7F9FC` | `#0B1226` |
| `--foreground` | `#0E2350` | `#E6ECF7` |
| `--card` / `--card-foreground` | `#FFFFFF` / `#0E2350` | `#111B33` / `#E6ECF7` |
| `--popover` / `--popover-foreground` | `#FFFFFF` / `#0E2350` | `#162240` / `#E6ECF7` |
| `--primary` / `-foreground` | `#2563EB` / `#FFFFFF` | `#3B82F6` / `#FFFFFF` |
| `--secondary` / `-foreground` | `#EFF5FF` / `#16326E` | `#1A2A4E` / `#C7D6F2` |
| `--muted` / `-foreground` | `#F1F5F9` / `#64748B` | `#17233F` / `#8FA3C7` |
| `--accent` / `-foreground` | `#14B8A6` / `#FFFFFF` | `#2DD4BF` / `#06251F` |
| `--destructive` / `-foreground` | `#DC2626` / `#FFFFFF` | `#EF4444` / `#FFFFFF` |
| `--success` / `-foreground` | `#16A34A` / `#FFFFFF` | `#22C55E` / `#06250F` |
| `--warning` / `-foreground` | `#D97706` / `#FFFFFF` | `#F59E0B` / `#2A1B02` |
| `--border` | `#E3E8F0` | `#223154` |
| `--input` | `#CBD5E1` | `#2C3D66` |
| `--ring` | `rgba(37,99,235,0.35)` | `rgba(59,130,246,0.45)` |
| `--chart-1..5` | `#2563EB`,`#14B8A6`,`#0E2350`,`#93C5FD`,`#5EEAD4` | `#60A5FA`,`#2DD4BF`,`#93C5FD`,`#1D4ED8`,`#0D9488` |
| `--sidebar` | `#FFFFFF` | `#0E1830` |
| `--sidebar-foreground` | `#475569` | `#A9BADC` |
| `--sidebar-primary` / `-foreground` | `#2563EB` / `#FFFFFF` | `#3B82F6` / `#FFFFFF` |
| `--sidebar-accent` / `-foreground` | `#EFF5FF` / `#16326E` | `#1A2A4E` / `#DBEAFE` |
| `--sidebar-border` | `#E3E8F0` | `#223154` |
| `--sidebar-ring` | `rgba(37,99,235,0.35)` | `rgba(59,130,246,0.45)` |
| `--radius`, `--shadow-*`, brand scales | — | **unchanged in `.dark`** |

**Note (source defect, verbatim):** `tokens.css` declares `--popover` twice inside `.dark` — line 79 `#16224080` then line 80 `#162240`. The second wins; the first (an 8-digit hex with 50% alpha) is dead.

---

## ANIMATIONS

All keyframes are declared once, globally, in `SchoolTest Design System.dc.html:19–24`. There are **no** `<style>` blocks or `@keyframes` inside the individual slices.

| Name | Definition | Used by | Duration | Easing | Iteration | Animates |
|---|---|---|---|---|---|---|
| `st-toast-in` | `from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none }` | Live toast (`ds--dark-mode.html:48`) | `.25s` | `ease` | once | opacity 0→1, translateY 12px→0 (slides up from below-right) |
| `st-fade-in` | `from { opacity:0 } to { opacity:1 }` | Dialog scrim (`ds--dark-mode.html:34`) | `.18s` | `ease` | once | opacity 0→1 |
| `st-pop-in` | `from { opacity:0; transform:scale(.96) } to { opacity:1; transform:none }` | Dialog panel (`ds--dark-mode.html:35`) | `.18s` | `ease` | once | opacity 0→1, scale .96→1 |
| `st-spin` | `to { transform:rotate(360deg) }` | Button spinner element built in JS (`SchoolTest Design System.dc.html:1578–1581`): 14×14 span, `border:2px solid rgba(255,255,255,.35)`, `border-top-color:#fff`, `border-radius:50%` | `.7s` | `linear` | `infinite` | rotate 0→360° |
| `st-shimmer` | `0% { background-position:-400px 0 } 100% { background-position:400px 0 }` | Every skeleton element (`ds--dashboard-components.html:99,101,102,105,106`) | `1.4s` | `ease` | `infinite` | background-position across a `linear-gradient(90deg,#F1F5F9 25%,#E9EEF5 37%,#F1F5F9 63%)` sized `400px 100%` |
| `st-rec-pulse` | `0% { box-shadow:0 0 0 0 rgba(220,38,38,.35) } 70% { box-shadow:0 0 0 16px rgba(220,38,38,0) } 100% { box-shadow:0 0 0 0 rgba(220,38,38,0) }` | Record button, applied conditionally via `recPulse` (`SchoolTest Design System.dc.html:1658`) — **not present in the 8 slices covered here** | `1.5s` | `ease-out` | `infinite` | expanding red halo 0→16px |

### Transitions (property-level, in the 8 slices)

| Component | Element | Declaration | Trigger / target values | Source |
|---|---|---|---|---|
| Table | body row | `transition:background .12s` (default `ease`) | hover → `background:#F8FAFD` | `ds--table.html:13` |
| Tabs | tab button | `transition:color .15s` | active → `#2563EB`, inactive → `#64748B` (border colour is NOT transitioned) | `ds--tabs.html:8–10` |
| Segmented control | segment button | `transition:all .15s` | bg `transparent↔#FFFFFF`, colour `#64748B↔#0E2350`, shadow `none↔0 1px 3px rgba(14,35,80,.12)` | `ds--tabs.html:17–19` |
| Sidebar | nav link (inactive) | `transition:background .12s` | hover → `background:#F1F5F9; color:#0E2350` | `ds--navigation.html:8–11,13` |
| Dashboard | search input | `transition:border-color .15s, box-shadow .15s` | focus → `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` | `ds--dashboard-components.html:8` |
| Dashboard | dropzone card | `transition:border-color .15s, background .15s` | hover → `border-color:#2563EB; background:#FBFCFE` | `ds--dashboard-components.html:81` |
| Footers | auth inputs | `transition:border-color .15s, box-shadow .15s` | focus → `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` | `ds--footers.html:95–96` |
| Dark mode | dark input | `transition:border-color .15s, box-shadow .15s` | focus → `border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,.22)` | `ds--dark-mode.html:16` |

**Timing vocabulary summary:** `.12s` (list/row hover), `.15s` (control state change, focus ring), `.18s` (modal in), `.25s` (toast in), `.7s linear infinite` (spinner), `1.4s ease infinite` (shimmer), `1.5s ease-out infinite` (record pulse). Every non-linear timing uses the CSS default `ease` except the spinner (`linear`) and the record pulse (`ease-out`). **No exit/leave animations exist anywhere** — `sc-if` unmounts nodes instantly.

**Elements that hover but do NOT transition** (would look abrupt if rebuilt literally): every button with `style-hover` in Cards, Table toolbar/pagination, Overlays (dialog buttons, dropdown items, tooltip trigger, popover copy), Topbar links and bell, Footer links and social buttons, Cookie banner buttons, 404 buttons, Auth buttons, Command-palette rows, Activity "View all" button, Add-filter chip.

---

## RESPONSIVE HINTS PRESENT IN THE MARKUP

There are **no `@media` queries anywhere** in these slices or in `tokens.css`. All adaptivity is intrinsic:

| Mechanism | Where | Source |
|---|---|---|
| `max-width:1240px; margin:0 auto` on every section | all 8 slices | e.g. `ds--cards.html:1` |
| `padding:64px 48px 0` fixed gutters (does not shrink) | all 8 slices | `ds--dark-mode.html:1` uses `64px 48px 96px` |
| `minmax(0,Nfr)` grid tracks (prevents blowout from long content) | Overlays `:4`, Navigation `:4`, Dashboard `:20,:49,:112`, Footers `:6,:68` | — |
| `minmax(220px,260px)` sidebar track | Navigation `:4` | — |
| `flex-wrap:wrap` | Topbar shell + its nav + its right cluster (`ds--navigation.html:20,22,28`), Dashboard filter bar (`:5`), Overlays avatar row (`:47`), Footer lower bar (`:44`), AppFooter + its link cluster (`:57,:60`), Cookie banner (`:70`), Dark-mode button row (`ds--dark-mode.html:5`) | — |
| `min-width:0` on flex/grid children (allows shrink + ellipsis) | Navigation right column `:19`, sidebar user text `:16`, Dashboard upcoming body `:64,:69`, popover input `ds--overlays.html:42`, invite input `:89` | — |
| `min-width:200px` search, `min-width:220px` cookie copy | Dashboard `:6`, Footers `:72` | wrap thresholds |
| `max-width` caps on overlay surfaces | dialog `360px` (static) / `380px` + `calc(100vw - 48px)` (live), popover `250px`, toast `340px` | `ds--overlays.html:7,38`, `ds--dark-mode.html:35,48` |
| `max-width` caps on copy | footer blurb `240px`, empty-state body `280px`, 404 body `300px` | — |
| `width:100%` + `preserveAspectRatio="none"` sparkline | Dashboard `:44` | stretches horizontally at fixed 52px height |
| `text-overflow:ellipsis` + `white-space:nowrap` | sidebar user name | `ds--navigation.html:16` |
| `max-width:38px` on chart bars | Dashboard `:24–28` | caps bar width as columns grow |
| `flex-wrap` absent on the fixed 3-col card/table grids | Cards `:4,:21`, Dark mode `:13` (`280px 1fr 1fr`) | **these will overflow on narrow viewports as authored** |

---

## DATA INVENTORY — every metric in these 8 slices

| # | Screen/component | Visible label | Example value | Kind | Unit / format | Must be computed from |
|---|---|---|---|---|---|---|
| 1 | Cards §1.1 | Tests created | `12` | metric | integer | COUNT(tests) in scope |
| 2 | Cards §1.1 | (delta) | `+3 this week` | metric | signed int + period | COUNT(tests created in last 7d) |
| 3 | Cards §1.1 | Students | `230` | metric | integer | COUNT(students) in scope |
| 4 | Cards §1.1 | (delta) | `+12 enrolled` | metric | signed int | COUNT(enrolments in period) |
| 5 | Cards §1.2 | Average score | `85%` | metric | int percent | MEAN(result.scorePercent) |
| 6 | Cards §1.2 | (bar) | `85%` width | metric | percent of track | same as #5 |
| 7 | Cards §1.3 | (meta) | `24 questions` | metric | integer | COUNT(items) |
| 8 | Cards §1.3 | (avatar overflow) | `+19` | metric | `+`int | participants − 3 |
| 9 | Cards §1.3 | submitted | `22 of 28 submitted` | metric | `{a} of {b}` | COUNT(submissions), COUNT(assignees) |
| 10 | Cards §1.3 | (bar) | `78%` | metric | percent | 22/28 |
| 11 | Table §2.4 | Questions | `24`,`30`,`26`,`12` | metric | integer | COUNT(items) per test |
| 12 | Table §2.4 | Avg | `88%`,`76%`,`—`,`—` | metric | int percent, `—` when no data | MEAN(score) per test |
| 13 | Table §2.4 | Date | `Apr 15, 2026` | label | `MMM d, yyyy` | test date |
| 14 | Table §2.5 | (range) | `Showing 1–4 of 12` | metric | `{from}–{to} of {total}` | page offset/size/total |
| 15 | Overlays §4.1 | (dialog body) | `26 responses` | metric | integer | COUNT(responses on target test) |
| 16 | Overlays §4.5 | (toast body) | `28 students` | metric | integer | COUNT(recipients) |
| 17 | Overlays §4.5 (alerts) | (toast body) | `230 responses · 65% complete` | metric | int + int percent | export job progress |
| 18 | Navigation §5.1 | Tests badge | `12` | metric | integer | COUNT(tests) |
| 19 | Dashboard §6.2 | Average score by week | bars `52/64/58/78/88` | metric | percent-of-plot = score percent | MEAN(score) grouped by ISO week, last 5 weeks |
| 20 | Dashboard §6.3 | Completion rate | `81%` + `dashoffset 62` | metric | int percent; offset = 326.7·(1−v) | completed ÷ assigned, current term |
| 21 | Dashboard §6.4 | Active students | `186` | metric | integer | COUNT(DISTINCT active students in range) |
| 22 | Dashboard §6.4 | (delta) | `+8%` | metric | signed int percent | period-over-period change of #21 |
| 23 | Dashboard §6.4 | (sparkline) | y = 40,34,38,26,30,18,22,10,14 | metric | 9 samples in a 0–52 inverted viewBox | same series as #21 bucketed into 9 periods |
| 24 | Dashboard §6.5 | (activity) | `92%` | metric | int percent | that submission's score |
| 25 | Dashboard §6.5 | (activity) | `3 students` | metric | integer | COUNT(assignees with no attempt) |
| 26 | Dashboard §6.5 | (timestamps) | `4 min ago`,`1 hr ago`,`2 hrs ago` | metric | relative duration | now − event.createdAt |
| 27 | Dashboard §6.6 | (date tiles) | `Apr 19`, `Apr 22` | label | `MMM` + `d` | test.scheduledAt |
| 28 | Dashboard §6.6 | (times) | `9:00 AM`, `11:30 AM` | label | `h:mm A` | test.scheduledAt |
| 29 | Dashboard §6.6 | Top performers | `96%`,`93%`,`91%` + ranks `1,2,3` | metric | int percent + ordinal | MEAN(score) per student, sorted desc, top 3 |
| 30 | Dashboard §6.11 | Passing threshold | `60%` (slider at 60%) | metric | int percent 0–100 | user setting; drives at-risk classification |
| 31 | Dashboard §6.11 | two switches | ON / OFF | metric (boolean) | boolean | user settings |
| 32 | Footers §7.2 | status | `All systems operational` | label | enum | system-health feed |
| 33 | Footers §7.1/7.2 | copyright | `© 2026 SchoolTest, Inc.` / `© 2026 SchoolTest` | label | `© {year} {legalName}` | current year |
| 34 | Dark mode §8.5 | Average score | `85%` + 85% bar | metric | int percent | same as #5 |

Everything not listed above (section eyebrows/H2s, group labels, button labels, nav labels, footer link lists, dialog/popover/tooltip/empty-state/dropzone/404/auth copy, `Featured card` headline, `Skeleton loading state` caption, tab panel sentences, command-palette action names) is **static copy**.

---

## UNKNOWNS

- The **exit/close animation for the dialog and toast** is not specified anywhere in the export. `sc-if` removes the node; the only animations declared are enter animations (`st-fade-in`, `st-pop-in`, `st-toast-in`). Whether an exit animation was intended is undeterminable from these files.
- **Focus-visible / keyboard focus rings for buttons and links** are not declared in any of the 8 slices; only `<input>`/`<select>`-adjacent elements carry `style-focus`. Button focus styling is undeterminable from these files.
- **Disabled states** for buttons, inputs, switches, tabs, segmented controls and pagination are not present in any of the 8 slices.
- **Active/pressed states** are not declared anywhere (only hover and, for inputs, focus).
- **Sort affordances / sort state** for the table header are absent from the markup — the header cells are plain `<span>`s.
- **Tooltip and popover positioning/arrow**: the export shows them as static blocks inside demo panels; there is no anchor, offset, placement or caret element, so the real anchored geometry is undeterminable.
- **Command-palette empty/no-results state and keyboard navigation styling** are not present.
- **Dark-mode versions of the table, tabs, overlays, navigation, dashboard charts and footers** are not present — `ds--dark-mode.html` only demonstrates buttons, badges, one input, one stat card and one alert. The remaining dark surfaces must be derived from the `tokens.css` `.dark` block (§8.7).
- **Breakpoints**: no `@media` query exists in any source file read, so the intended mobile/tablet layouts for the fixed `repeat(3,1fr)` and `280px 1fr 1fr` grids are undeterminable.
- The **`Grade 7` meta on the bar chart** and the `this term` / `30 days` range labels are not wired to the segmented controls in the export; the coupling between the range selector and the charts is undeterminable from these files.
- **Bar-chart y-axis scale**: heights are given as CSS percentages of a 140px box with no axis or max-value label. Whether the axis is fixed 0–100 or auto-scaled to the series max is undeterminable; the sample values (52/64/58/78/88) are consistent with a fixed 0–100 axis but do not prove it.
