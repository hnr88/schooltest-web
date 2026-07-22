# 02 — CHILDREN SURFACES (Parent Portal + App)

Sources read in full:

| # | Surface | Slice file | Origin export |
|---|---|---|---|
| A | My children — list | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--my-children-list.html` | `dashbaord-design/Parent Portal.dc.html` L320–364 |
| B | Child detail | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--child-detail.html` | `dashbaord-design/Parent Portal.dc.html` L365–439 |
| C | Child profile (app chrome) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--child-profile.html` | `dashbaord-design/SchoolTest App Screens.dc.html` |
| D | Result detail (app chrome) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--result-detail.html` | `dashbaord-design/SchoolTest App Screens.dc.html` |
| — | Tokens | `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/tokens.css` | — |
| — | Empty state (adjacent, read for §A.6) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--empty-state.html` | `dashbaord-design/SchoolTest App Screens.dc.html` |

> **Two distinct chromes.** A and B are the *Parent Portal* (detached rounded sidebar, 24px radii,
> pill buttons, navy `#0E2350` primary, portal-only greys). C and D are the *App Screens* shell
> (flush 248px sidebar with 1px border, 10–18px radii, rectangular buttons, blue `#2563EB` primary,
> Tailwind/slate greys). They do **not** share a grey ramp. Do not merge them.

---

## 0. COLOR → TOKEN MAP

Every literal hex appearing in the four slices, mapped against
`/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/tokens.css`.

### 0.1 Hexes that map to a token

| Hex | Token(s) in `tokens.css` | Line in tokens.css | Used on |
|---|---|---|---|
| `#0E2350` | `--navy-900`, `--foreground`, `--card-foreground`, `--popover-foreground`, `--chart-3` | 12, 26, 28, 30, 53 | All 4 screens: headings, values, detail avatar, portal primary button, result hero bg |
| `#16326E` | `--navy-800`, `--secondary-foreground`, `--sidebar-accent-foreground` | 13, 34, 63 | Portal button hover; app "Edit"/"Download PDF" label; badge text; teacher-tip text |
| `#2563EB` | `--blue-600`, `--primary`, `--chart-1`, `--sidebar-primary` | 15, 31, 51, 60 | Links, "Details →", active nav, focus skill bar, chart line, app primary button |
| `#1D4ED8` | `--blue-700` | 14 | Avatar glyph fg, app primary hover, `a:hover` in App Screens, subject-pill fg |
| `#3B82F6` | `--blue-500` | 16 | *not used in these 4 slices* |
| `#DBEAFE` | `--blue-100` | 17 | App avatar bg (38/72/28px), MATH pill bg |
| `#EFF5FF` | `--blue-50`, `--secondary`, `--sidebar-accent` | 18, 33, 62 | App active nav bg, "14 TESTS TAKEN" badge bg, teacher-tip callout bg |
| `#14B8A6` | `--teal-500`, `--accent`, `--chart-2` | 20, 37, 52 | Danish subject-bar fill (C L40) |
| `#2DD4BF` | `.dark --accent`, `.dark --chart-2` | 88, 101 | Result donut arc; "Top 12%" value |
| `#F7F9FC` | `--background` | 25 | App frame bg; app ghost-button hover; "Recommended next" row bg |
| `#FFFFFF` | `--card`, `--popover`, `--primary-foreground`, `--sidebar` | 27, 29, 32, 58 | All cards, sidebars, headers |
| `#F1F5F9` | `--muted` | 35 | App nav hover, progress-track bg, table row divider |
| `#64748B` | `--muted-foreground` | 36 | App secondary/meta text |
| `#E3E8F0` | `--border`, `--sidebar-border` | 45, 64 | App card borders, sidebar border, header border |
| `#CBD5E1` | `--input` | 46 | App outline-button border, chip border, breadcrumb "/" |
| `#16A34A` | `--success` | 41 | Positive scores, COMPLETED pill fg, "Trend" value |
| `#D97706` | `--warning` | 43 | At-risk scores, SCHEDULED pill fg |
| `#475569` | `--sidebar-foreground` | 59 | App inactive nav label, inactive chip label |
| `#8FA3C7` | `.dark --muted-foreground` | 87 | Result hero eyebrow + stat-tile labels |
| `#C7D6F2` | `.dark --secondary-foreground` | 85 | Result hero student line |
| `#2C3D66` | `.dark --input` | 97 | Result donut unfilled track |

### 0.2 Hexes with NO token (must be added or hardcoded)

| Hex | Where used | Role |
|---|---|---|
| `#EEF1F6` | Portal A/B: avatar bg, all hairline dividers, card borders-top, skill track | Portal hairline / portal muted surface |
| `#7C8698` | Portal A/B: all secondary text, back link, card labels | Portal muted-foreground |
| `#9AA6B8` | Portal B: KPI labels, future-level labels, `deltaColor` for "first attempt" | Portal muted-foreground-2 (lighter) |
| `#D8DFEA` | Portal A/B: level-pill border, outline-button border, future journey dot border | Portal input/border |
| `#C4CEDC` | Portal A: dashed add-child tile border | Portal dashed-border |
| `#3D4A5C` | Portal body default text color (`Parent Portal.dc.html` L14) | Portal body fg |
| `#94A3B8` | App C/D: table column heads, subject captions, chart x-axis labels | slate-400 (not tokenised) |
| `#F0FDF4` | App C: "LINKED · CONFIRMED BY SCHOOL" and COMPLETED pill bg | success-subtle (≠ `--teal-50` `#F0FDFA`) |
| `#FEF3C7` | App C: SCHEDULED pill bg | warning-subtle |
| `#E9EEF6` | App Screens page bg (`SchoolTest App Screens.dc.html` L16) | canvas bg |

Shadows used are literal, not the `--shadow-*` tokens (tokens.css L68–71):
- Portal card rest: `0 1px 2px rgba(14,35,80,.04)` (≠ `--shadow-sm` which is `.06`)
- Portal card hover: `0 10px 32px rgba(14,35,80,.10)`
- App card: `0 1px 2px rgba(14,35,80,.06)` = `--shadow-sm`
- App frame: `0 8px 24px rgba(14,35,80,.12)` = `--shadow-lg`

### 0.3 Typography base

Both chromes: `font-family: 'Google Sans', -apple-system, 'Segoe UI', system-ui, sans-serif`
(`Parent Portal.dc.html` L14 / `SchoolTest App Screens.dc.html` L16; `--font-sans` tokens.css L8).
Variable weight axis 400–800 (tokens.css L119). `-webkit-font-smoothing: antialiased`.
Link defaults differ: Portal `a{color:#0E2350}` / `a:hover{color:#2563EB}` (Parent Portal L15–16);
App `a{color:#2563EB}` / `a:hover{color:#1D4ED8}` (App Screens L16–17).

---

## A. MY CHILDREN — LIST
`/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--my-children-list.html`

Rendered when `view === 'children'` (binding `isKids`, `Parent Portal.dc.html` L1012).

### A.1 Portal shell (context — from `Parent Portal.dc.html` L25–86)
- Page body background `#EEF1F6`; default text `#3D4A5C`.
- Outer: `display:flex; gap:24px; padding:24px; height:100vh; box-sizing:border-box; max-width:1600px; margin:0 auto` (L25).
- Sidebar: `width:248px; flex:none; background:#FFFFFF; border-radius:24px; box-shadow:0 1px 2px rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06); display:flex; flex-direction:column; padding:28px 16px 16px; box-sizing:border-box` (L28). Logo `height:26px; margin:0 12px 36px`.
- Sidebar section labels: `font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#9AA6B8; padding:0 14px 8px` — "Manage" (L30) and "Account" (L46).
- Nav item: `display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:12px; font-size:14.5px; cursor:pointer` + 18×18 stroke icon (stroke-width 1.8).
  - **active**: `font-weight:600; background:#0E2350; color:#FFFFFF`
  - **inactive**: `font-weight:500; background:transparent; color:#7C8698`
  (helper `nav()` at `Parent Portal.dc.html` L797–801.)
  `navKids` is active for `view` ∈ {`children`, `detail`, `add`} (L1021) — the list, the detail and the add-child wizard all keep "My children" lit.
- Main: `flex:1; min-width:0; display:flex; flex-direction:column; overflow-y:auto` (L86).

### A.2 Page container
Slice L3: `display:flex; flex-direction:column; gap:24px; padding:8px 4px 8px 8px` (asymmetric — 8px left, 4px right).

### A.3 Component: **PageHeader**
Slice L4–10. `display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap`.

| Element | Spec |
|---|---|
| `h1` "My children" (L6) | `margin:0; font-size:30px; font-weight:500; letter-spacing:-0.02em; color:#0E2350` |
| Subline (L7) | `margin:6px 0 0; font-size:14px; color:#7C8698`. Literal copy: `2 children · Family plan covers up to 4` |
| Button "Add a child" (L9) | `display:inline-flex; align-items:center; gap:8px; background:#0E2350; color:#fff; font-size:14px; font-weight:600; padding:12px 22px; border-radius:999px; border:none; cursor:pointer`. **Hover** `background:#16326E`. Icon before label: `<svg width=15 height=15 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=2.2 stroke-linecap=round><path d="M12 5v14M5 12h14"/>`. Action `goAdd` → `{ view:'add', addStep:1 }` (`Parent Portal.dc.html` L1019). |

Computed height of the button: 14px text (line-box ≈ 18px) + 12px×2 = ~42px.

### A.4 Layout: **ChildCardGrid**
Slice L11: `display:grid; grid-template-columns:repeat(auto-fit,minmax(360px,1fr)); gap:20px`.
This is the only responsive mechanism on the screen — no media query. Column count is implicit:
1 col below ~740px of content box, 2 cols ~740–1120px, 3 cols above. The add-child tile is the
last grid child and participates in the same track sizing.

### A.5 Component: **ChildCard** (`sc-for list={{kids}} as=k`, placeholder count 2 — slice L12–34)

Card shell (L13): `background:#FFFFFF; border-radius:24px; padding:28px; box-shadow:0 1px 2px rgba(14,35,80,.04); cursor:pointer; display:flex; flex-direction:column; gap:22px`.
**States** — rest as above; **hover** `box-shadow:0 10px 32px rgba(14,35,80,.10)` (elevation only; no transform, no border change). Whole card is the click target → `k.open` sets `{ view:'detail', kidIdx:i }` (`Parent Portal.dc.html` L898).

**Row 1 — IdentityRow** (L14): `display:flex; align-items:center; gap:15px`
- **Avatar** (L15): `width:52px; height:52px; border-radius:999px; background:#EEF1F6; color:#0E2350; display:grid; place-items:center; font-weight:600; font-size:18px; flex:none`. Content = `k.initial`, a **single uppercase letter** (`'E'`, `'L'`) — not two-letter initials. No image variant exists in this slice.
- **Name stack** (L16): `flex:1; min-width:0`
  - name (L17): `font-size:18px; font-weight:600; color:#0E2350`
  - meta (L18): `font-size:13px; color:#7C8698; margin-top:2px`
- **Level pill** (L20): `font-size:12px; font-weight:600; color:#0E2350; border:1px solid #D8DFEA; padding:5px 12px; border-radius:999px; flex:none`. Copy template: `Level {{k.level}}` → renders `Level B1`. Transparent background (inherits card white).

**Row 2 — MetricStrip** (L22–28): `display:flex; gap:0; border-top:1px solid #EEF1F6; padding-top:20px`
- 3 cells, each `flex:1`; 2 dividers `width:1px; background:#EEF1F6; margin:0 18px` (so effective inter-cell gutter = 37px).
- Value (all 3): `font-size:20px; font-weight:700; color:#0E2350; letter-spacing:-0.01em`
- Label (all 3): `font-size:12px; color:#7C8698; margin-top:2px`

| Cell | Value template | Label template |
|---|---|---|
| 1 (L23) | `{{k.progress}}%` | `to {{k.nextLevel}}` |
| 2 (L25) | `{{k.streak}}` | `day streak` |
| 3 (L27) | `{{k.lastScore}}` | `last result` |

**Row 3 — CardFooter** (L29–32): `display:flex; align-items:center; justify-content:space-between; font-size:13px; color:#7C8698`
- left: `{{k.note}}` (inherits 13px/#7C8698)
- right: `font-weight:600; color:#2563EB` — literal `Details →`. Not an `<a>`; it is decorative, the card carries the click.

**Seed data** (`Parent Portal.dc.html` L860–897):

| field | Emma | Lucas |
|---|---|---|
| `initial` | `E` | `L` |
| `meta` | `Year 7 · Riverside College, Parramatta` | `Year 3 · Oakwood Public School, Strathfield` |
| `level` | `B1` | `A2` |
| `nextLevel` | `B2` | `B1` |
| `progress` | `68` | `34` |
| `streak` | `12` | `5` |
| `lastScore` | `74%` | `61%` |
| `note` | `Speaking is the current growth area` | `Reading improved 9% since May` |
| `homeLang` | `Vietnamese` | `Vietnamese` |
| `growth` | `+2 levels` | `+1 level` |
| `journeyStage` | `3` | `2` |

### A.6 Component: **AddChildTile** (empty/affordance slot — slice L35–41)

Tile (L35): `border:1.5px dashed #C4CEDC; border-radius:24px; min-height:220px; display:grid; place-items:center; cursor:pointer; color:#7C8698`.
**States** — **hover** `border-color:#2563EB; color:#2563EB`. Because the inner SVG uses `stroke="currentColor"` and both text lines inherit `color`, hover recolors border + icon + both labels in one step.
No background fill (shows the `#EEF1F6` page through).

Inner (L36–40), `text-align:center`:
- Icon puck (L37): `width:44px; height:44px; border-radius:999px; background:#FFFFFF; box-shadow:0 1px 2px rgba(14,35,80,.06); display:grid; place-items:center; margin:0 auto 12px`. SVG `18×18`, `stroke-width:2`, `stroke-linecap:round`, path `M12 5v14M5 12h14`. The puck stays white on hover — only the glyph recolors.
- Title (L38): `font-size:14px; font-weight:600` — `Add a child`
- Sub (L39): `font-size:12.5px; margin-top:3px` — `Takes about 3 minutes`

**This tile is always rendered**, appended after the `sc-for`. It is the *affordance*, not a zero-state.

### A.7 True empty state
The portal list slice contains **no** zero-children branch — with `kids = []` the grid would render
the AddChildTile alone. The designed zero-state lives in the App chrome:
`/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--empty-state.html`:
- `main`: `flex:1; display:grid; place-items:center; padding:40px` (L16); inner column `width:560px; display:flex; flex-direction:column; align-items:center; gap:22px; text-align:center` (L17)
- Icon medallion (L18): `96×96; border-radius:999px; background:#EFF5FF; display:grid; place-items:center`; svg `42×42`, `stroke:#2563EB`, `stroke-width:1.8` (user-plus glyph)
- `h1` (L20): `margin:0; font-size:27px; font-weight:700; letter-spacing:-0.015em; color:#0E2350` — `No children linked yet`
- `p` (L21): `margin:0; font-size:15px; line-height:1.6; color:#64748B` — `Link your first child to start buying tests and following their results. If their school uses SchoolTest, you received a student code by email.`
- Code-entry card (L23): `width:100%; background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:22px; display:flex; gap:10px; box-sizing:border-box; box-shadow:0 1px 2px rgba(14,35,80,.06)`
  - `input` (L24): `flex:1; border:1px solid #CBD5E1; border-radius:10px; padding:12px 14px; font-size:14.5px; color:#0E2350; outline:none`; placeholder `Enter student code, e.g. NH-4823-EM` (placeholder color `#94A3B8`, App Screens L18)
  - `button` (L25): `background:#2563EB; color:#fff; border:none; font-size:14px; font-weight:600; padding:12px 20px; border-radius:10px; cursor:pointer`; **hover** `background:#1D4ED8` — `Link child`
- Divider (L27): `display:flex; align-items:center; gap:14px; width:100%`; rules `flex:1; height:1px; background:#E3E8F0`; word `font-size:12.5px; color:#94A3B8` — `or`
- Link (L28): `font-size:14px; font-weight:600` — `Add a child manually →` (color from `a{color:#2563EB}`)

---

## B. CHILD DETAIL (Parent Portal)
`/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--child-detail.html`

Rendered when `view === 'detail'` (binding `isDetail`, `Parent Portal.dc.html` L1013).
Page container (L3) identical to A.2: `display:flex; flex-direction:column; gap:24px; padding:8px 4px 8px 8px`.

**There are NO tabs on this screen.** The content is a single vertical stack of five blocks.

### B.1 Component: **DetailHeader** (L4–15)
- Back link (L5): `font-size:13.5px; font-weight:500; color:#7C8698; cursor:pointer`; **hover** `color:#2563EB`. Copy `← My children` (literal left-arrow char). Action `goKids` → `view:'children'`.
- Identity row (L6): `display:flex; align-items:center; gap:18px; margin-top:14px; flex-wrap:wrap`
  - Avatar (L7): `60×60; border-radius:999px; background:#0E2350; color:#fff; display:grid; place-items:center; font-weight:600; font-size:21px; flex:none` → `{{kid.initial}}`. **Inverted vs the list card** (navy fill / white glyph, 60px not 52px).
  - Text stack (L8): `flex:1; min-width:200px`
    - `h1` (L9): `margin:0; font-size:28px; font-weight:500; letter-spacing:-0.02em; color:#0E2350` → `{{kid.name}}`
    - meta (L10): `font-size:14px; color:#7C8698; margin-top:3px` → `{{kid.meta}} · Home language {{kid.homeLang}}`
  - Button **secondary** "Share with teacher" (L12): `background:#FFFFFF; color:#0E2350; font-size:13.5px; font-weight:600; padding:11px 20px; border-radius:999px; border:1px solid #D8DFEA; cursor:pointer`; **hover** `border-color:#0E2350`. No handler bound.
  - Button **primary** "Assign practice" (L13): `background:#0E2350; color:#fff; font-size:13.5px; font-weight:600; padding:11px 22px; border-radius:999px; border:none; cursor:pointer`; **hover** `background:#16326E`. No handler bound.

Because the row is `flex-wrap:wrap` with `min-width:200px` on the text stack, the two buttons drop
to a second line when the main column narrows.

### B.2 Component: **KpiStrip** (L17–27)
Card: `background:#FFFFFF; border-radius:24px; padding:24px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04); display:flex; flex-wrap:wrap; gap:20px 0` (20px row-gap, 0 column-gap — dividers supply the gutter).
- 5 cells: `flex:1; min-width:140px`
- 4 dividers: `width:1px; background:#EEF1F6; margin:0 26px` (53px effective gutter)
- Label: `font-size:12px; color:#9AA6B8; margin-bottom:6px`
- Value: `font-size:24px; font-weight:700; letter-spacing:-0.01em`, color `#0E2350` for cells 1–4, **`#2563EB` for cell 5**

| # | Line | Label (literal / template) | Value template | Emma render |
|---|---|---|---|---|
| 1 | L18 | `Overall level` | `{{kid.level}}` | `B1` |
| 2 | L20 | `Progress to {{kid.nextLevel}}` | `{{kid.progress}}%` | `Progress to B2` / `68%` |
| 3 | L22 | `Practice streak` | `{{kid.streak}} days` | `12 days` |
| 4 | L24 | `Last result` | `{{kid.lastScore}}` | `74%` |
| 5 | L26 | `Since joining` | `{{kid.growth}}` | `+2 levels` (blue) |

Wrapping: with `min-width:140px` + 5 cells + 4×53px gutters the strip needs ≥ ~912px; below that
cells wrap to a second row and the dividers wrap with them (a known fragility of this markup —
dividers are siblings, not pseudo-elements).

### B.3 Layout: **TwoUpCardGrid** (L29)
`display:grid; grid-template-columns:repeat(auto-fit,minmax(380px,1fr)); gap:20px` — "Level journey"
and "Skills" sit side-by-side above ~780px and stack below.

### B.4 Component: **LevelJourney** (L30–42)
Card: `background:#FFFFFF; border-radius:24px; padding:28px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04)`.
- `h2` (L31): `margin:0; font-size:16px; font-weight:600; color:#0E2350` — `Level journey`
- Track (L32): `display:flex; align-items:center; gap:0; margin-top:26px`
- 6 steps, CEFR ladder `['A1','A2','B1','B2','C1','C2']` (`Parent Portal.dc.html` L900). Each step (L34): `flex:1; display:flex; flex-direction:column; align-items:center; gap:8px; position:relative`
  - **Connector** (L35): `position:absolute; top:9px; left:{{j.lineLeft}}; right:{{j.lineRight}}; height:2px; background:{{j.lineBg}}`
    - `lineLeft = '50%'` for the first step else `'0'`; `lineRight = '50%'` for the last step else `'0'` (L913–914) — half-lines at the ends so the rail starts/ends at the dot centre
    - `lineBg = '#0E2350'` when `i <= journeyStage-1`, else `#EEF1F6` (L915)
    - `top:9px` centres the 2px rail on the 20px dot (10px − 1px)
  - **Dot** (L36): `width:20px; height:20px; border-radius:999px; background:{{j.dotBg}}; border:2px solid {{j.dotBorder}}; box-sizing:border-box; position:relative; display:grid; place-items:center`
    - **done or current**: `dotBg #0E2350`, `dotBorder #0E2350` (L908–909)
    - **future**: `dotBg #FFFFFF`, `dotBorder #D8DFEA`
    - **current only**: inner pip `width:6px; height:6px; border-radius:99px; background:#fff` (L910). Done and future dots have no pip.
  - **Label** (L37): `font-size:12px; font-weight:{{j.w}}; color:{{j.fg}}`
    - **current**: weight `700`, color `#0E2350` (L911–912)
    - **done**: weight `500`, color `#0E2350`
    - **future**: weight `500`, color `#9AA6B8`
- Journey note (L41): `margin-top:24px; padding-top:18px; border-top:1px solid #EEF1F6; font-size:13px; color:#7C8698; line-height:1.55` → `{{kid.journeyNote}}`

Emma (`journeyStage:3`): A1 done, A2 done, **B1 current (pip)**, B2/C1/C2 future; rail navy through B1.
Emma `journeyNote`: `Emma started at A1 in 2024 and reached B1 this May — roughly one level every 8 months. At this pace, B2 is likely by early 2027.`
Lucas (`journeyStage:2`) `journeyNote`: `Lucas moved from A1 to A2 in about 10 months. Steady practice in reading is carrying his momentum.`

### B.5 Component: **SkillsCard** (L43–55)
Card chrome identical to B.4.
- `h2` (L44): `margin:0 0 20px; font-size:16px; font-weight:600; color:#0E2350` — `Skills`
- Rows wrapper (L45): `display:flex; flex-direction:column; gap:13px`
- **SkillRow** (L47): `display:grid; grid-template-columns:76px 1fr 38px; align-items:center; gap:14px`
  - name (L48): `font-size:13px; color:#7C8698`
  - track (L49): `height:6px; background:#EEF1F6; border-radius:99px`; fill: `width:{{sk.pct}}; height:100%; background:{{sk.color}}; border-radius:99px`
  - grade (L50): `font-size:12px; font-weight:600; color:{{sk.color}}; text-align:right`
- Skill note (L54): `margin-top:22px; padding-top:18px; border-top:1px solid #EEF1F6; font-size:13px; color:#7C8698; line-height:1.55` → `{{kid.skillNote}}`

`sk.color` encodes emphasis, not value: `#0E2350` for normal skills, **`#2563EB` for the focus/weakest
skill**. It tints both the bar fill and the grade text.

| Skill | Emma pct / color / grade | Lucas pct / color / grade |
|---|---|---|
| Reading | `78%` / `#0E2350` / `B1+` | `48%` / `#0E2350` / `A2` |
| Listening | `70%` / `#0E2350` / `B1` | `56%` / `#0E2350` / `A2+` |
| Speaking | `52%` / **`#2563EB`** / `A2+` | `40%` / `#0E2350` / `A2` |
| Writing | `64%` / `#0E2350` / `B1` | `34%` / **`#2563EB`** / `A1+` |

(`Parent Portal.dc.html` L867–872, L885–890.)
Emma `skillNote`: `Speaking lags about half a level behind — short daily drills close this gap fastest.`
Lucas `skillNote`: `Writing is the youngest skill — normal at this age; picture-prompt practice helps.`

### B.6 Component: **RecentResults** (L58–72)
Card: `background:#FFFFFF; border-radius:24px; padding:8px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04)` — note the **8px** vertical padding; the header block and a trailing spacer supply the rest.
- Header (L59): `display:flex; align-items:baseline; justify-content:space-between; padding:22px 0 6px`
  - `h2` (L60): `margin:0; font-size:19px; font-weight:600; letter-spacing:-0.01em; color:#0E2350` — `Recent results`
  - Link (L61): `font-size:13.5px; font-weight:500; color:#7C8698; cursor:pointer`; **hover** `color:#2563EB` — `All reports →`. No handler bound.
- **ResultRow** (L64), `sc-for kid.results`, placeholder count 3: `display:flex; align-items:center; gap:20px; padding:17px 0; border-bottom:1px solid #EEF1F6` (border is on **every** row including the last; the trailing spacer div at L71 `padding:8px 0 14px` sits below it)
  - Left stack (L65): `flex:1; min-width:0`
    - name: `font-size:14.5px; font-weight:600; color:#0E2350`
    - date: `font-size:13px; color:#7C8698; margin-top:2px`
  - Score (L66): `font-size:14px; font-weight:700; color:#0E2350; flex:none`
  - Delta (L67): `font-size:12px; font-weight:600; color:{{r.deltaColor}}; flex:none; width:90px; text-align:right`
  - Action (L68): `font-size:13px; font-weight:600; color:#2563EB; cursor:pointer; flex:none` — `Report`. No handler bound.

Emma rows (`Parent Portal.dc.html` L873–877):

| name | date | score | delta | deltaColor |
|---|---|---|---|---|
| `Listening check-in` | `Jul 14, 2026` | `B1 · 74%` | `+6% vs May` | `#2563EB` |
| `Speaking practice set` | `Jul 8, 2026` | `A2+ · 58%` | `+3% vs Jun` | `#2563EB` |
| `Reading check-in` | `Jun 20, 2026` | `B1+ · 79%` | `+4% vs May` | `#2563EB` |

Lucas rows (L891–895):

| name | date | score | delta | deltaColor |
|---|---|---|---|---|
| `Reading check-in` | `Jul 10, 2026` | `A2 · 61%` | `+9% vs May` | `#2563EB` |
| `Listening practice set` | `Jun 28, 2026` | `A2+ · 64%` | `+2% vs May` | `#2563EB` |
| `Writing check-in` | `Jun 12, 2026` | `A1+ · 52%` | `first attempt` | `#9AA6B8` |

`deltaColor` is a **neutral-grey (`#9AA6B8`) when there is no prior attempt**, blue otherwise. No
negative-delta example exists in the design — see UNKNOWNS.

---

## C. CHILD PROFILE (App chrome)
`/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--child-profile.html`

Fixed artboard, `data-screen-label="Child profile"`.

### C.1 Frame + shell
- Frame (L1): `width:1440px; height:900px; background:#F7F9FC; border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(14,35,80,.12); display:grid; grid-template-columns:248px 1fr`
- Sidebar (L2): `background:#FFFFFF; border-right:1px solid #E3E8F0; display:flex; flex-direction:column; padding:24px 16px; gap:6px; box-sizing:border-box`. Logo `height:30px; align-self:flex-start; margin:0 8px 22px`.
- Nav item base (L4): `display:flex; align-items:center; gap:11px; font-size:14px; border-radius:10px; padding:10px 12px`
  - **inactive**: `font-weight:500; color:#475569; cursor:pointer`; **hover** `background:#F1F5F9`
  - **active** ("My children", L5): `font-weight:600; color:#2563EB; background:#EFF5FF`
  - Order: Overview, My children, Buy tests, Results, Billing, Settings. Nav labels are text only in this slice — no icons.
- Header (L12): `background:#FFFFFF; border-bottom:1px solid #E3E8F0; padding:0 32px; height:64px; display:flex; align-items:center; gap:12px; flex:none`
  - breadcrumb parent `<a href="#2a">`: `font-size:13.5px; color:#64748B` — `My children`
  - separator `<span>`: `color:#CBD5E1` — `/`
  - current: `font-size:13.5px; font-weight:600; color:#0E2350` — `Emma Hansen`
  - spacer `<span style="flex:1">`
  - user avatar (L15): `38×38; border-radius:999px; background:#DBEAFE; color:#1D4ED8; display:grid; place-items:center; font-size:14px; font-weight:700` — `SH`
- Main (L17): `padding:28px 32px; display:flex; flex-direction:column; gap:20px; overflow:hidden`

### C.2 Component: **ProfileHero** (L18–37)
Card: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:18px; padding:24px 28px; display:flex; align-items:center; gap:22px; box-shadow:0 1px 2px rgba(14,35,80,.06)`

- **Avatar** (L19): `72×72; border-radius:999px; background:#DBEAFE; color:#1D4ED8; display:grid; place-items:center; font-size:24px; font-weight:700; flex:none` — `EH` (**two-letter** initials here, unlike the portal's single letter)
- **Identity** (L20): `flex:1; display:flex; flex-direction:column; gap:4px`
  - `h1` (L21): `margin:0; font-size:24px; font-weight:700; color:#0E2350` — `Emma Hansen`
  - meta (L22): `font-size:14px; color:#64748B` — `Grade 4B · Nørrebro Heights School · Born 03.06.2016`
  - Badge row (L23): `display:flex; gap:8px; margin-top:4px`
    - **StatusBadge / linked** (L24): `font-size:12px; font-weight:700; color:#16A34A; background:#F0FDF4; padding:4px 11px; border-radius:999px` — `LINKED · CONFIRMED BY SCHOOL` (uppercase in source text, no `text-transform`)
    - **CountBadge** (L25): `font-size:12px; font-weight:700; color:#16326E; background:#EFF5FF; padding:4px 11px; border-radius:999px` — `14 TESTS TAKEN`
- **StatCluster** (L28): `display:flex; gap:26px; padding-right:8px`. Each cell `display:flex; flex-direction:column; gap:2px; text-align:center`; value `font-size:26px; font-weight:700`; label `font-size:12.5px; color:#64748B`
  - `86%` (#0E2350) / `Avg. score`
  - `+4%` (**#16A34A**) / `Trend`
  - `Top 15%` (#0E2350) / `Of grade`
- **Actions** (L33): `display:flex; gap:10px`
  - `Edit` button (L34): `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:13.5px; font-weight:600; padding:9px 16px; border-radius:10px; cursor:pointer`; **hover** `background:#F7F9FC`
  - `Assign test` `<a href="#2f">` (L35): `background:#2563EB; color:#fff; font-size:13.5px; font-weight:600; padding:10px 17px; border-radius:10px`; **hover** `background:#1D4ED8; color:#fff` (the explicit `color` is needed to defeat `a:hover{color:#1D4ED8}`)

### C.3 Component: **SubjectCard** ×3 (L38–42)
Grid (L38): `display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px` — **fixed 3 columns, no auto-fit**.
Card: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:14px; padding:18px 20px; display:flex; flex-direction:column; gap:10px` (no shadow).
- Top row: `display:flex; justify-content:space-between; font-size:13.5px`; subject `font-weight:700; color:#0E2350`; pct `font-weight:700` colored
- Bar: track `height:7px; border-radius:99px; background:#F1F5F9`; fill `width:<pct>; height:100%; border-radius:99px; background:<fill>`
- Caption: `font-size:12.5px; color:#94A3B8`

| Subject | pct text | pct color | bar fill | bar width | caption |
|---|---|---|---|---|---|
| `Math` (L39) | `91%` | `#16A34A` | `#2563EB` | `91%` | `6 tests · strongest subject` |
| `Danish` (L40) | `85%` | `#16A34A` | `#14B8A6` | `85%` | `5 tests · steady` |
| `English` (L41) | `74%` | `#D97706` | `#D97706` | `74%` | `3 tests · needs practice` |

Note the deliberate inconsistency: for Math/Danish the **bar** uses chart colors (`--chart-1`/`--chart-2`)
while the **number** uses `--success`; for English both use `--warning`. Rule to implement:
`pct ≥ 80 → text #16A34A`, `pct < 80 → text #D97706`; bar fill cycles chart-1/chart-2 for healthy
subjects and switches to `#D97706` when the subject is flagged "needs practice".

### C.4 Component: **TestHistory** (L43–50)
Card: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:22px 24px; display:flex; flex-direction:column; gap:8px; box-shadow:0 1px 2px rgba(14,35,80,.06)`

**Header** (L44): `display:flex; justify-content:space-between; align-items:center; padding-bottom:8px`
- `h3`: `margin:0; font-size:17px; font-weight:600; color:#0E2350` — `Test history`
- **FilterChips** (the only tab-like control on either child surface): `display:flex; gap:8px`
  - **active** (`All`): `font-size:12.5px; font-weight:600; color:#fff; background:#2563EB; padding:5px 13px; border-radius:999px; cursor:pointer` — no border
  - **inactive** (`Math`, `Danish`, `English`): `font-size:12.5px; font-weight:500; color:#475569; border:1px solid #CBD5E1; padding:5px 13px; border-radius:999px; cursor:pointer` — no background declared (transparent over white). No hover declared.

**Table** — CSS grid, not `<table>`. Shared track definition on head and every row:
`display:grid; grid-template-columns:2.4fr 1fr 1fr 1fr .7fr; gap:12px`

- Head (L45): `padding:8px 12px; font-size:11.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#94A3B8; border-bottom:1px solid #E3E8F0`. Cells: `Test`, `Date`, `Score`, `Status`, `` (empty 5th).
- Row (L46–49): `align-items:center; padding:12px; font-size:14px; border-bottom:1px solid #F1F5F9`. **The last row (L49) omits `border-bottom`.**
  - Test cell: `font-weight:600; color:#0E2350`
  - Date cell: `color:#64748B`
  - Score cell: `font-weight:700` + `#16A34A` (≥80) or `#D97706` (<80); when there is no score, `color:#94A3B8` with **no** font-weight and the literal em-dash `—`
  - Status pill: `font-size:12px; font-weight:700; padding:3px 10px; border-radius:999px`
    - `SCHEDULED` → `color:#D97706; background:#FEF3C7`
    - `COMPLETED` → `color:#16A34A; background:#F0FDF4`
  - Action cell: `<a href="#2g" style="font-size:13px; font-weight:600; justify-self:end">View` (color `#2563EB` from the global `a` rule, hover `#1D4ED8`). **Absent** on the SCHEDULED row (empty `<span>`).

| Test | Date | Score | Status | Action |
|---|---|---|---|---|
| `Math · Fractions & decimals` | `May 14` | `—` (#94A3B8) | `SCHEDULED` | — |
| `Math · Multiplication tables` | `May 12` | `92%` (#16A34A) | `COMPLETED` | `View` |
| `Danish · Spelling level 4` | `May 9` | `88%` (#16A34A) | `COMPLETED` | `View` |
| `English · Vocabulary builder` | `Apr 28` | `74%` (#D97706) | `COMPLETED` | `View` |

`View` targets `#2g` = the Result detail screen (§D). `Assign test` targets `#2f`.

---

## D. RESULT DETAIL (App chrome)
`/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--result-detail.html`

Frame (L1) and sidebar (L2–10) identical to §C.1 — **except the active nav item is `Results`** (L7,
`font-weight:600; color:#2563EB; background:#EFF5FF`); "My children" renders inactive here.

### D.1 Header (L12–17)
Same chrome as C.1. Contents:
- breadcrumb: `<a href="#2a">` `Results` (13.5px, `#64748B`) / `/` (`#CBD5E1`) / `Math · Multiplication tables` (13.5px, 600, `#0E2350`)
- spacer `flex:1`
- **DownloadPdfButton** (L15): `display:inline-flex; align-items:center; gap:8px; background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:13.5px; font-weight:600; padding:8px 15px; border-radius:10px; cursor:pointer`; **hover** `background:#F7F9FC`. Icon `14×14`, `viewBox 0 0 24 24`, `stroke=currentColor`, `stroke-width:2.2`, `stroke-linecap/linejoin:round`, paths `M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`, `M7 10l5 5 5-5`, `M12 15V3`. Label `Download PDF`.
- user avatar `SH` (L16) same as C.1.

### D.2 Component: **ResultHero** (L19–33)
Card: `background:#0E2350; border-radius:18px; padding:26px 30px; display:flex; align-items:center; gap:28px` — the only dark-on-navy card in the children surfaces.

- **ScoreDonut** (L20–22)
  - Outer: `width:110px; height:110px; border-radius:999px; background:conic-gradient(#2DD4BF 0 92%, #2C3D66 92% 100%); display:grid; place-items:center; flex:none`
  - Inner hole: `width:88px; height:88px; border-radius:999px; background:#0E2350; display:grid; place-items:center; flex-direction:column`
  - Ring thickness = (110 − 88) / 2 = **11px**
  - Value: `font-size:27px; font-weight:700; color:#fff; line-height:1` — `92%`
  - The conic stop **is** the score: the arc sweep percentage equals the score percentage. Start angle is the default (12 o'clock), sweep clockwise.
- **HeroText** (L23): `flex:1; display:flex; flex-direction:column; gap:6px`
  - Eyebrow (L24): `font-size:12.5px; font-weight:700; letter-spacing:.06em; color:#8FA3C7` — `MATH · GRADE 4 · MAY 12, 2026` (uppercased in the source string, no `text-transform`)
  - `h1` (L25): `margin:0; font-size:26px; font-weight:700; color:#fff` — `Multiplication tables`
  - Student line (L26): `display:flex; align-items:center; gap:10px`
    - mini avatar: `28×28; border-radius:999px; background:#DBEAFE; color:#1D4ED8; display:grid; place-items:center; font-size:11.5px; font-weight:700` — `EH`
    - text: `font-size:14px; color:#C7D6F2` — `Emma Hansen · completed in 22 min`
- **HeroStatTiles** (L28): `display:flex; gap:14px`. Tile: `background:rgba(255,255,255,.07); border-radius:14px; padding:16px 22px; display:flex; flex-direction:column; gap:3px; text-align:center`; value `font-size:24px; font-weight:700`; label `font-size:12px; color:#8FA3C7`
  - `22/24` (`#fff`) / `Correct`
  - `Top 12%` (**`#2DD4BF`**) / `Of grade 4`
  - `A` (`#fff`) / `Grade`

### D.3 Layout: **ResultBodyGrid** (L34)
`display:grid; grid-template-columns:1.5fr 1fr; gap:20px; align-items:flex-start` — asymmetric 60/40
split, top-aligned so the shorter right column does not stretch. **No auto-fit, no media query.**

### D.4 Component: **PerformanceByTopic** (L35–47)
Card: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:16px; box-shadow:0 1px 2px rgba(14,35,80,.06)`
- `h3` (L36): `margin:0; font-size:17px; font-weight:600; color:#0E2350` — `Performance by topic`
- Rows wrapper (L37): `display:flex; flex-direction:column; gap:14px`
- **TopicRow**: `display:flex; flex-direction:column; gap:7px`
  - label row: `display:flex; justify-content:space-between; font-size:13.5px`; name `font-weight:600; color:#0E2350`; pct `font-weight:700` colored
  - bar: track `height:8px; border-radius:99px; background:#F1F5F9`; fill `width:<pct>; height:100%; border-radius:99px; background:<same color as pct text>`
  - (8px track here vs 7px on the subject cards in §C.3 and 6px on the portal skill rows in §B.5 — three distinct bar heights, keep them distinct.)

| Topic | pct | color (text + fill) | line |
|---|---|---|---|
| `Tables 1–5` | `100%` | `#16A34A` | L38 |
| `Tables 6–9` | `90%` | `#16A34A` | L39 |
| `Word problems` | `75%` | `#D97706` | L40 |
| `Mixed operations` | `95%` | `#16A34A` | L41 |

- **TeacherTipCallout** (L43–46): `background:#EFF5FF; border-radius:12px; padding:14px 16px; display:flex; gap:12px; align-items:flex-start`
  - icon: `<svg width=17 height=17 viewBox="0 0 24 24" fill=none stroke="#2563EB" stroke-width=2 stroke-linecap=round stroke-linejoin=round style="flex:none;margin-top:1px">` (lightbulb: `M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5`, `M9 18h6`, `M10 22h4`) — note stroke is **hardcoded `#2563EB`**, not `currentColor`
  - text: `font-size:13.5px; line-height:1.55; color:#16326E`, opens with `<strong>Teacher's tip:</strong>` then: `Emma is strong on pure tables. Practice word problems where the multiplication is hidden in a story — 10 minutes twice a week is enough.`

### D.5 Component: **ScoreHistoryChart** (L49–59)
Card chrome as D.4 but `gap:14px`.
- `h3` (L50): `17px; 600; #0E2350` — `Score history — Math`
- SVG (L51): `width:100%; height:120; viewBox:"0 0 300 120"; preserveAspectRatio:none` (non-uniform stretch — the line thins/thickens horizontally when the card is wide; a real implementation should reproduce this or accept the difference)
  - **Line** (L52): `<polyline points="0,70 50,62 100,66 150,48 200,40 250,30 300,18" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">` — 7 points at x = 0/50/100/150/200/250/300 (one per month label)
  - **Area** (L53): same 7 points + `300,120 0,120`, `fill:rgba(37,99,235,.08); stroke:none`
  - **End marker** (L54): `<circle cx="300" cy="18" r="5" fill="#2563EB" stroke="#fff" stroke-width="2.5">`
  - y is inverted (lower y = higher score). No y-axis, no gridlines, no y-labels, no tooltip in the markup.
- X-axis (L56): `display:flex; justify-content:space-between; font-size:11.5px; color:#94A3B8` — `Nov` `Dec` `Jan` `Feb` `Mar` `Apr` `May`
- Comparison row 1 (L57): `display:flex; justify-content:space-between; font-size:13.5px; padding-top:12px; border-top:1px solid #F1F5F9` — label `Class average` (`#64748B`) / value `78%` (`font-weight:700; color:#0E2350`)
- Comparison row 2 (L58): `display:flex; justify-content:space-between; font-size:13.5px` (no border) — label `Emma's average` (`#64748B`) / value `86% · +8 pts` (`font-weight:700; color:#16A34A`)

### D.6 Component: **RecommendedNext** (L60–64)
Card: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:12px; box-shadow:0 1px 2px rgba(14,35,80,.06)`
- `h3` (L61): `17px; 600; #0E2350` — `Recommended next`
- **RecommendationRow** ×2 (L62–63): `display:flex; align-items:center; gap:12px; background:#F7F9FC; border-radius:12px; padding:12px 14px`
  - subject pill: `font-size:12px; font-weight:700; color:#1D4ED8; background:#DBEAFE; padding:4px 10px; border-radius:999px; flex:none` — `MATH`
  - title: `flex:1; font-size:13.5px; font-weight:600; color:#0E2350` — `Word problems level 2` / `Division starter`
  - `<a href="#2f" style="font-size:13px; font-weight:700">` — `Assign →` (color `#2563EB`, hover `#1D4ED8` from the global rule)

---

## METRIC INVENTORY

Columns: **Screen** · **Visible label** · **Example value (design)** · **Kind** · **Unit / format** · **Computed from** · **Source**

| Screen | Visible label | Example value | Kind | Unit / format | Computed from | Source |
|---|---|---|---|---|---|---|
| A list | *(header subline)* `2 children · Family plan covers up to 4` | `2` / `4` | metric + label | integer count · integer cap | `count(children of parent account)`; plan seat cap from the subscription product | `portal--my-children-list.html` L7 |
| A card | `Level {n}` (pill) | `Level B1` | metric (ordinal) | CEFR band string ∈ {A1,A2,B1,B2,C1,C2} | Current placement/latest assessed CEFR band | L20; data `Parent Portal.dc.html` L863 |
| A card | `to {nextLevel}` | `68%` → `to B2` | metric | integer percent, `%` suffix, 0 dp | % of the way from current CEFR band to the next; needs band-entry score thresholds + latest composite score | L23; data L863 |
| A card | `day streak` | `12` | metric | bare integer (unit in label) | Consecutive calendar days with ≥1 completed practice session | L25; data L863 |
| A card | `last result` | `74%` | metric | percent string as stored (`'74%'`) | Score of the most recent completed test/check-in | L27; data L863 |
| A card | *(note line, no label)* | `Speaking is the current growth area` | static copy (derived) | free sentence | Narrative generated from the weakest skill | L30; data L864 |
| A card | *(meta line, no label)* | `Year 7 · Riverside College, Parramatta` | label | `Year {n} · {school}, {suburb}` | Child year level + linked school record | L18; data L862 |
| A tile | `Takes about 3 minutes` | — | static copy | — | Hardcoded | L39 |
| B KPI | `Overall level` | `B1` | metric (ordinal) | CEFR band | Same source as A `level` | `portal--child-detail.html` L18 |
| B KPI | `Progress to {nextLevel}` | `68%` | metric | integer percent | Same as A `progress` | L20 |
| B KPI | `Practice streak` | `12 days` | metric | `{int} days` (unit in value) | Same as A `streak` | L22 |
| B KPI | `Last result` | `74%` | metric | percent string | Same as A `lastScore` | L24 |
| B KPI | `Since joining` | `+2 levels` | metric (delta) | signed integer + `level`/`levels` | `currentBandIndex − bandIndexAtSignup` | L26; data L863 |
| B journey | `A1` … `C2` (6 step labels) | `B1` = current | label + state | CEFR ladder, fixed order | `journeyStage` = 1-based count of bands reached | L37; data L864, ladder L900 |
| B journey | *(journey note)* | `Emma started at A1 in 2024 and reached B1 this May — roughly one level every 8 months. At this pace, B2 is likely by early 2027.` | static copy (derived) | sentence | Band-transition history + linear pace extrapolation | L41; data L865 |
| B skills | `Reading` / `Listening` / `Speaking` / `Writing` | bar `78%`, grade `B1+` | metric ×2 | bar = percent string; grade = CEFR band ± `+` | Per-skill mastery % and per-skill CEFR sub-band from graded items | L48–50; data L867–872 |
| B skills | *(skill note)* | `Speaking lags about half a level behind — short daily drills close this gap fastest.` | static copy (derived) | sentence | Gap between weakest skill and overall band | L54; data L866 |
| B results | *(row name)* | `Listening check-in` | label | test title | Test/assessment record | L65; data L874 |
| B results | *(row date)* | `Jul 14, 2026` | label | `MMM D, YYYY` | Completion timestamp | L65; data L874 |
| B results | *(row score)* | `B1 · 74%` | metric | `{CEFR band} · {int}%` | Result band + raw percent | L66; data L874 |
| B results | *(row delta)* | `+6% vs May` / `first attempt` | metric (delta) | signed int `%` + ` vs {MMM}`; literal `first attempt` when no baseline | Current % minus the same test's previous % + month of that prior attempt | L67; data L874, L894 |
| C hero | `14 TESTS TAKEN` (badge) | `14` | metric | integer, uppercase copy | `count(completed tests for child)` | `app--child-profile.html` L25 |
| C hero | `LINKED · CONFIRMED BY SCHOOL` (badge) | — | label (status) | enum badge | Child↔school link verification state | L24 |
| C hero | `Avg. score` | `86%` | metric | integer percent | Mean of all completed test scores | L29 |
| C hero | `Trend` | `+4%` | metric (delta) | signed integer percent | Recent-window avg minus prior-window avg | L30 |
| C hero | `Of grade` | `Top 15%` | metric (percentile) | `Top {int}%` | Child's percentile rank within the grade cohort | L31 |
| C hero | *(meta line)* | `Grade 4B · Nørrebro Heights School · Born 03.06.2016` | label | `Grade {n}{class} · {school} · Born DD.MM.YYYY` | Child record | L22 |
| C subject | `Math` | `91%` | metric | integer percent (also bar width) | Mean score across that subject's completed tests | L39 |
| C subject | `Danish` | `85%` | metric | integer percent | same | L40 |
| C subject | `English` | `74%` | metric | integer percent | same | L41 |
| C subject | *(caption)* | `6 tests · strongest subject` | metric + static copy | `{int} tests · {qualifier}` | Test count per subject + rank-derived qualifier (`strongest subject` / `steady` / `needs practice`) | L39–41 |
| C table | `Score` column | `92%`, `—` | metric | integer percent; em-dash when not yet taken | Test result | L46–49 |
| C table | `Status` column | `SCHEDULED` / `COMPLETED` | label (enum) | uppercase pill | Assignment lifecycle state | L46–49 |
| C table | `Date` column | `May 12` | label | `MMM D` (no year) | Scheduled or completion date | L46–49 |
| D hero | *(donut, no label)* | `92%` | metric | integer percent; also drives conic sweep | `correct / total` for this attempt | `app--result-detail.html` L20–21 |
| D hero | `Correct` | `22/24` | metric | `{int}/{int}` | Correct item count / total item count | L29 |
| D hero | `Of grade 4` | `Top 12%` | metric (percentile) | `Top {int}%` | Percentile of this attempt within the grade cohort for this test | L30 |
| D hero | `Grade` | `A` | metric (ordinal) | single letter grade | Score mapped through the grade band table | L31 |
| D hero | *(eyebrow)* | `MATH · GRADE 4 · MAY 12, 2026` | label | `{SUBJECT} · GRADE {n} · {MMM D, YYYY}` uppercase | Test metadata | L24 |
| D hero | *(student line)* | `Emma Hansen · completed in 22 min` | metric + label | `{name} · completed in {int} min` | `submittedAt − startedAt` rounded to minutes | L26 |
| D topic | `Tables 1–5` | `100%` | metric | integer percent (also bar width) | Correct/total for items tagged with that topic | L38 |
| D topic | `Tables 6–9` | `90%` | metric | integer percent | same | L39 |
| D topic | `Word problems` | `75%` | metric | integer percent | same | L40 |
| D topic | `Mixed operations` | `95%` | metric | integer percent | same | L41 |
| D chart | `Score history — Math` (7 points) | y = 70,62,66,48,40,30,18 over `Nov…May` | metric series | 7 monthly values in an unlabelled 0–120 SVG y-space | Monthly mean subject score for the last 7 months | L52, L56 |
| D chart | `Class average` | `78%` | metric | integer percent | Mean subject score across the child's class | L57 |
| D chart | `Emma's average` | `86% · +8 pts` | metric + delta | `{int}% · {signed int} pts` | Child's subject mean, and its difference from the class average (86 − 78 = 8) | L58 |
| D rec | `Recommended next` rows | `MATH` / `Word problems level 2` | label | subject enum + test title | Recommendation engine keyed off the weakest topic (`Word problems`, 75%) | L62–63 |
| D tip | `Teacher's tip:` | `Emma is strong on pure tables. Practice word problems where the multiplication is hidden in a story — 10 minutes twice a week is enough.` | static copy (derived) | rich text with bold lead-in | Strongest + weakest topic | L45 |

---

## ANIMATIONS

**Nothing on these four screens declares a `transition`, `animation`, `@keyframes`, or `transform`.**
All motion is instantaneous state swap on `:hover`. Verified by grepping both origin exports:
`Parent Portal.dc.html` contains exactly two `transition` declarations and both are in the **settings**
screen toggle (L658 `transition:background .2s`, L659 `transition:left .2s`), not in the children
surfaces. `SchoolTest App Screens.dc.html` declares exactly one keyframe, `st-shimmer` (L20), used
only by `app--loading-skeleton.html`.

### AN-1 — `st-shimmer` (available, not used on C/D)
Source `SchoolTest App Screens.dc.html` L20:
```css
@keyframes st-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
```
Applied as `animation: st-shimmer 1.4s linear infinite` on elements with
`background:linear-gradient(90deg,#F1F5F9 25%,#E9EEF6 50%,#F1F5F9 75%); background-size:800px 100%`
(darker pair for large blocks: `#E9EEF6 / #E3E8F0 / #E9EEF6`). Duration `1.4s`, easing `linear`,
iteration `infinite`, animates `background-position` only.
Reuse this for the children-list and child-detail loading states: 52px circle for the card avatar,
`60%×16px` + `40%×13px` bars for name/meta, three `66px` tiles for the metric strip.

### AN-2 — Toggle transition (portal convention, from the same export)
`Parent Portal.dc.html` L658–659: track `transition:background .2s`, knob `transition:left .2s`
(knob `left` `3px` ↔ `22px`, track `#D8DFEA` ↔ `#0E2350`). This is the only motion timing the portal
commits to: **200ms, default easing**. Use it as the house duration when adding transitions to the
hover states below.

### Hover-state inventory (currently un-transitioned — add `transition` here)

| # | Screen · element | Property that changes | From → To | Source |
|---|---|---|---|---|
| H-1 | A · ChildCard | `box-shadow` | `0 1px 2px rgba(14,35,80,.04)` → `0 10px 32px rgba(14,35,80,.10)` | list L13 |
| H-2 | A · "Add a child" button | `background` | `#0E2350` → `#16326E` | list L9 |
| H-3 | A · AddChildTile | `border-color` + `color` (cascades to SVG stroke and both labels) | `#C4CEDC` / `#7C8698` → `#2563EB` / `#2563EB` | list L35 |
| H-4 | B · back link | `color` | `#7C8698` → `#2563EB` | detail L5 |
| H-5 | B · "Share with teacher" | `border-color` | `#D8DFEA` → `#0E2350` | detail L12 |
| H-6 | B · "Assign practice" | `background` | `#0E2350` → `#16326E` | detail L13 |
| H-7 | B · "All reports →" | `color` | `#7C8698` → `#2563EB` | detail L61 |
| H-8 | C/D · sidebar inactive nav (5 items each) | `background` | `transparent` → `#F1F5F9` | profile L4,6–9 / result L4–6,8–9 |
| H-9 | C · "Edit" button | `background` | `#FFFFFF` → `#F7F9FC` | profile L34 |
| H-10 | C · "Assign test" | `background` (+ `color` pinned `#fff`) | `#2563EB` → `#1D4ED8` | profile L35 |
| H-11 | D · "Download PDF" | `background` | `#FFFFFF` → `#F7F9FC` | result L15 |
| H-12 | A/B · any `<a>` (portal) | `color` | `#0E2350` → `#2563EB` | `Parent Portal.dc.html` L15–16 |
| H-13 | C/D · any `<a>` (app) | `color` | `#2563EB` → `#1D4ED8` | `SchoolTest App Screens.dc.html` L16–17 |

**Un-designed states that must still be built:** no `:focus` / `:focus-visible`, `:active`,
`:disabled`, `aria-busy`, or `prefers-reduced-motion` rule exists in any of the four slices or either
origin export. `--ring: rgba(37,99,235,.35)` (tokens.css L47) and `.dark --ring: rgba(59,130,246,.45)`
(L98) are the tokens to use for focus rings.

Motion opportunities the markup makes obvious (numbers, not vibes):
- Skill bars (B L49, 6px), subject bars (C L39–41, 7px) and topic bars (D L38–41, 8px) all animate
  `width: 0 → {pct}` cleanly — the fill is a separate child of the track.
- The result donut (D L20) is a `conic-gradient` stop; animate the stop `0% → 92%` (needs
  `@property --p { syntax:'<percentage>' }` since conic stops are not natively interpolable).
- The score-history line (D L52) is a `polyline` — `stroke-dasharray`/`stroke-dashoffset` draw-on.
- The level-journey connectors (B L35) animate `width`/`right` left-to-right; the current-step pip
  (6px, B L36 / `Parent Portal.dc.html` L910) is the natural place for a scale-in or pulse.

---

## RESPONSIVE SUMMARY

| Screen | Mechanism present | Value | Source |
|---|---|---|---|
| Portal shell | `max-width` on the page frame | `1600px`, `margin:0 auto`, `height:100vh` | `Parent Portal.dc.html` L25 |
| A | auto-fit grid | `repeat(auto-fit,minmax(360px,1fr))`, `gap:20px` | list L11 |
| A | `flex-wrap:wrap` on the page header | title block + button wrap | list L4 |
| B | `flex-wrap:wrap` on the identity row, `min-width:200px` on the text stack | buttons drop to a new line | detail L6 |
| B | `flex-wrap:wrap` + `gap:20px 0` on the KPI strip, `min-width:140px` per cell | cells wrap (dividers wrap with them) | detail L17–26 |
| B | auto-fit grid for Journey/Skills | `repeat(auto-fit,minmax(380px,1fr))`, `gap:20px` | detail L29 |
| C | fixed frame | `width:1440px; height:900px`, `grid-template-columns:248px 1fr` | profile L1 |
| C | fixed 3-col subject grid | `1fr 1fr 1fr`, `gap:16px` — **no** auto-fit | profile L38 |
| C | fixed table tracks | `2.4fr 1fr 1fr 1fr .7fr`, `gap:12px` | profile L45–49 |
| D | fixed frame | `width:1440px; height:900px`, `grid-template-columns:248px 1fr` | result L1 |
| D | fixed 2-col body | `1.5fr 1fr`, `gap:20px`, `align-items:flex-start` — **no** auto-fit | result L34 |
| D | fluid chart | `svg width:100%; height:120; viewBox="0 0 300 120"; preserveAspectRatio:none` | result L51 |

**No `@media` query exists in any of the four slices, in `Parent Portal.dc.html`, or in
`SchoolTest App Screens.dc.html`.** The portal (A/B) is genuinely fluid via auto-fit grids and
flex-wrap; the app screens (C/D) are fixed 1440×900 artboards and their breakpoints are undesigned.

---

## UNKNOWNS

- **Dark mode.** `tokens.css` defines a full `.dark` block (L74–114), but not one of the four slices
  carries a `.dark` class, a `prefers-color-scheme` rule, or a dark variant. The dark rendering of
  every component above is undetermined. (Note: the result-detail hero already uses three dark-mode
  token values — `#2DD4BF`, `#8FA3C7`, `#C7D6F2`, `#2C3D66` — as *light-mode* literals on a navy card.)
- **Negative deltas.** Every `delta` in `Parent Portal.dc.html` L874–876 and L892–894 is positive or
  `first attempt`. The color and copy for a regression (e.g. `-4% vs May`) are not in the design. The
  only neutral value observed is `#9AA6B8` for `first attempt`.
- **Portal zero-children state.** `portal--my-children-list.html` has no branch for `kids.length === 0`;
  §A.7 documents the App-chrome empty state (`app--empty-state.html`), which uses a different shell and
  a student-code input. Whether the portal is meant to reuse it is undetermined.
- **Focus / active / disabled / loading states** for every interactive element on all four screens —
  not declared anywhere (see ANIMATIONS).
- **Avatar images.** Both chromes render initials only (`E`/`L` in the portal, `EH`/`SH` in the app).
  No photo-avatar variant, fallback rule, or image slot exists in these slices, even though the
  add-child wizard has a "Media — Photo & voice intro" step (`Parent Portal.dc.html` L926).
- **Handlers.** In `portal--child-detail.html`, "Share with teacher" (L12), "Assign practice" (L13),
  "All reports →" (L61) and "Report" (L68) have `cursor:pointer` but **no** `onClick` binding — their
  destinations are undetermined. In the portal list, only `k.open` (card) and `goAdd` (button + tile)
  are wired.
- **Y-axis scale of the score-history chart** (`app--result-detail.html` L52). The polyline lives in an
  unlabelled `0 0 300 120` space with no axis, no gridline and no min/max annotation, so the mapping
  from percent to y is not recoverable from the markup.
- **Which single letter vs. two letters** an avatar should show: the portal uses `k.initial` = one char
  (`Parent Portal.dc.html` L862, L880) and the app uses two (`EH`, `SH`). No rule reconciles them.
- **`app--child-profile.html` sidebar icons.** The portal sidebar has 18px lucide-style icons per nav
  item (`Parent Portal.dc.html` L32–52); the app sidebar nav items (profile L4–9, result L4–9) declare
  `gap:11px` — implying a leading icon — but contain text only. The intended icon set is undetermined.
