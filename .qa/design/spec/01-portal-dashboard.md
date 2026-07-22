# 01 — Parent Portal Dashboard + School Search Shell

**Status:** read-only intake spec. Every value below was read from the files cited. Nothing is inferred
unless the line explicitly says `IMPLICATION`.

## Sources read (in full)

| Path | What it gave |
|---|---|
| `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--main.html` (261 lines) | `<main>` column: dashboard view + "Find a school" view |
| `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--detached-sidebar.html` (32 lines) | detached sidebar `<aside>` |
| `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--parent-overview.html` (102 lines) | alternative composition of the same surface (attached sidebar + header) |
| `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/tokens.css` (129 lines) | token names/hex |
| `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/Parent Portal.dc.html` (1054 lines) | the parent export the two `portal--*` slices were cut from — **required**, because the slices contain `{{ … }}` placeholders whose real values live in the `<script type="text/x-dc">` block at lines 731–1054 |

> The slices are inline-styled HTML with mustache placeholders. Every `{{ x }}` in the slice is resolved
> below from `Parent Portal.dc.html` and the source line is cited.

---

## 0. Palette used on this screen, mapped to `tokens.css`

`tokens.css` is a **shadcn token file the portal export does not import**. The portal hardcodes its own
hex values. Mapping below: "=" means an exact hex match to a token, "—" means the hex appears nowhere in
`tokens.css`.

| Hex | Where used on this screen | `tokens.css` token |
|---|---|---|
| `#0E2350` | hero panel bg, all primary text, active nav pill, active chip, primary buttons, avatar bg, current-stage dot | = `--navy-900` (line 12) / `--foreground` (26) / `--card-foreground` (28) |
| `#16326E` | hover bg of every navy button (`style-hover`) | = `--navy-800` (line 13) / `--secondary-foreground` (34) |
| `#2563EB` | link/action text ("Reply", "Assign", "View →", "Due Friday"), notification dot, "Focus:" chip text, map cluster bubble, tick icon, `noteColor` for some schools | = `--blue-600` (line 15) / `--primary` (31) / `--chart-1` (51) |
| `#2DD4BF` | 2px underline under "on track for B2" in the hero | = `.dark --accent` (line 88); **not** a light-mode token |
| `#8FA3C7` | hero eyebrow "THIS WEEK" + hero stat sub-labels | = `.dark --muted-foreground` (line 87) |
| `#7C8698` | secondary body text everywhere (dates, meta, "See details →") | — (not in tokens.css) |
| `#9AA6B8` | tertiary text (weekday letters, "JUL", section eyebrows, unreached CEFR labels) | — |
| `#3D4A5C` | bell icon stroke, "Clear all" button text, unselected chip text | — |
| `#EEF1F6` | page `body` background, all hairline dividers, avatar circle bg, unreached CEFR dot bg | — |
| `#EEF3FE` | "Focus: …" pill background | — |
| `#F4F6FA` | sidebar user-card bg, filter-modal close-button bg, map placeholder bg | — |
| `#E4E9F2` | inactive practice-minutes bars | — |
| `#D8DFEA` | recommendation index-circle border, unselected filter chip border, filter-row divider | — |
| `#FFFFFF` | all cards, sidebar, search pill | = `--card` (27) / `--sidebar` (58) |
| `rgba(14,35,80,.04)` / `.05` / `.06` / `.12` / `.14` / `.42` | shadows + modal scrim | close to `--shadow-sm/md/lg` (lines 68–70) but **not identical**: tokens use `.06/.08/.12`, portal uses `.04/.05/.06` |

**Font:** `'Google Sans'` variable, `-apple-system, 'Segoe UI', system-ui, sans-serif` fallback
(`Parent Portal.dc.html:12–14`). Same family as `--font-sans` (`tokens.css:8`). Body colour `#3D4A5C`,
`-webkit-font-smoothing: antialiased` (`Parent Portal.dc.html:14`).

---

## 1. Page shell

### 1.1 Outer frame — `Parent Portal.dc.html:25`

```
display:flex; gap:24px; padding:24px; height:100vh; box-sizing:border-box;
max-width:1600px; margin:0 auto
```
Page background: `body { margin:0; background:#EEF1F6 }` (`Parent Portal.dc.html:14`).
Two children: the detached `<aside>` (fixed 248px) and `<main>` (`flex:1`).

Global CSS from `Parent Portal.dc.html:11–19`:
```css
a { color:#0E2350; text-decoration:none; }
a:hover { color:#2563EB; }
input::placeholder { color:#9AA6B8; }
input, button, select { font-family: inherit; }
.leaflet-container { font-family: inherit; }
```

### 1.2 Detached sidebar — `portal--detached-sidebar.html:2–31`

Container `<aside>`:
```
width:248px; flex:none; background:#FFFFFF; border-radius:24px;
box-shadow: 0 1px 2px rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06);
display:flex; flex-direction:column; padding:28px 16px 16px; box-sizing:border-box
```
Because the outer frame is `height:100vh` with `padding:24px`, the sidebar is a full-height floating
card of height `100vh - 48px`.

**Logo** (line 3): `<img src="assets/logo.png" alt="SchoolTest">`, `height:26px; width:auto;
align-self:flex-start; margin:0 12px 36px`.

**Group label "Manage"** (line 4): `font-size:11px; font-weight:600; letter-spacing:.08em;
text-transform:uppercase; color:#9AA6B8; padding:0 14px 8px`.

**`<nav>`** (line 5): `display:flex; flex-direction:column; gap:2px`.

**Nav item (shared spec, lines 6/9/12/18/21):**
```
display:flex; align-items:center; gap:12px; padding:11px 14px;
border-radius:12px; font-size:14.5px; cursor:pointer
font-weight / background / color are state-driven
```
Icon: inline SVG `18×18`, `viewBox="0 0 24 24"`, `fill:none`, `stroke:currentColor`,
`stroke-width:1.8`, `stroke-linecap:round`, `stroke-linejoin:round`. Icon inherits the item's `color`.

**Nav states** — from `nav(active)` at `Parent Portal.dc.html:797–801`:

| State | font-weight | background | color |
|---|---|---|---|
| active | `600` | `#0E2350` | `#FFFFFF` |
| inactive | `500` | `transparent` | `#7C8698` |

There is **no hover style and no focus style declared on sidebar nav items** in this file (see UNKNOWNS).

**Nav items in order** (top group, `portal--detached-sidebar.html:6–14`):

1. **Overview** — icon: 4-rect dashboard grid, `<rect x=3 y=3 w=7 h=9 rx=2>`, `<rect x=14 y=3 w=7 h=5 rx=2>`, `<rect x=14 y=12 w=7 h=9 rx=2>`, `<rect x=3 y=16 w=7 h=5 rx=2>`. Handler `goDash` → `view:'dashboard'`. Active when `view === 'dashboard'` (`Parent Portal.dc.html:1020`).
2. **My children** — icon: two-person (users) glyph. Handler `goKids` → `view:'children'`. Active when `view` is `'children' | 'detail' | 'add'` (`Parent Portal.dc.html:1021`).
3. **Search** — icon: magnifier `<circle cx=11 cy=11 r=8>` + `<path d="m21 21-4.3-4.3">`. Handler `goSearch` → `view:'search'` (`:1022`).

**Spacer** (line 16): `<div style="flex:1"></div>` pushes the account block to the bottom.

**Group label "Account"** (line 17): identical style to "Manage".

Bottom group (lines 18–23), same nav-item spec:

4. **Billing** — icon: credit card `<rect x=2 y=5 w=20 h=14 rx=3>` + `<path d="M2 10h20">`. Handler `goBilling` (`:1024`).
5. **Settings** — icon: gear, `<circle cx=12 cy=12 r=3>` + 8 spokes. Handler `goSettings` (`:1023`).

**User / footer card** (lines 24–30):
```
margin-top:14px; background:#F4F6FA; border-radius:16px; padding:12px 14px;
display:flex; align-items:center; gap:11px
```
- Avatar: `36×36`, `border-radius:999px`, `background:#0E2350`, `color:#fff`, `display:grid;
  place-items:center`, `font-weight:600`, `font-size:13px`, `flex:none`, glyph **`M`**.
- Text stack: `display:flex; flex-direction:column; gap:1px; min-width:0`
  - Name **"Maria Rodriguez"** — `13.5px / 600 / #0E2350`
  - Role **"Parent account"** — `12px / 400 / #7C8698`
- No chevron, no menu, no logout affordance in the markup.

### 1.3 Main scroll column — `portal--main.html:2`

```
flex:1; min-width:0; display:flex; flex-direction:column; overflow-y:auto
```
Holds two mutually exclusive views:
- `<sc-if value="{{ isDash }}">` (line 4, placeholder default `true`) — the dashboard
- `<sc-if value="{{ isSearch }}">` (line 148, placeholder default `false`) — "Find a school"

Dashboard inner wrapper (line 5): `display:flex; flex-direction:column; gap:28px; padding:8px 4px 8px 8px`.
Search inner wrapper (line 149): `display:flex; flex-direction:column; gap:20px; padding:8px 4px 8px 8px;
height:100%; min-height:0; box-sizing:border-box`.

### 1.4 Alternative composition — `app--parent-overview.html`

Same product surface, different shell. Record it as a variant, **not** the target.
- Frame (line 1): fixed `width:1440px; height:900px; background:#F7F9FC` (= `--background`),
  `border-radius:14px; overflow:hidden; box-shadow:0 8px 24px rgba(14,35,80,.12)` (= `--shadow-lg`),
  `display:grid; grid-template-columns:248px 1fr`.
- Sidebar (lines 2–15) is **attached**: `background:#FFFFFF; border-right:1px solid #E3E8F0`
  (= `--border`), `padding:24px 16px; gap:6px`; logo `height:30px; margin:0 8px 22px`.
  - Nav items: `font-size:14px; gap:11px; border-radius:10px; padding:10px 12px`, icons `17×17`
    `stroke-width:2`.
  - Active state here is **different**: `font-weight:600; color:#2563EB; background:#EFF5FF`
    (= `--primary` on `--secondary` / `--sidebar-accent`).
  - Inactive: `font-weight:500; color:#475569` (= `--sidebar-foreground`), `style-hover="background:#F1F5F9"` (= `--muted`).
  - Nav order here: **Overview, My children, Buy tests, Results, Billing, Settings** — 6 items, different from the detached sidebar's 5.
  - Footer card (lines 10–14): `margin-top:auto; background:#0E2350; border-radius:14px; padding:18px;
    gap:10px` containing eyebrow "Test credits" (`12px/700/.06em/uppercase/#8FA3C7`), value **`12`**
    (`30px/700/#FFFFFF/line-height:1`), CTA "Buy more credits" (`background:#14B8A6` = `--teal-500`,
    `#fff`, `13px/600`, `padding:9px`, `border-radius:9px`, hover `background:#0D9488` = `--teal-600`).
- Top header bar (lines 17–23), height `64px`, `background:#FFFFFF`, `border-bottom:1px solid #E3E8F0`,
  `padding:0 32px`, `gap:16px`: search field (`max-width:380px`, `background:#F1F5F9`, `radius:10px`,
  `padding:9px 14px`, placeholder "Search tests, children, results…" `14px/#94A3B8`), credits pill
  ("12 credits", `13px/700/#16326E` on `#EFF5FF`, `padding:7px 13px`, `radius:999px`), bell button
  (`38×38`, `1px solid #E3E8F0`, `radius:10px`, red dot `8×8` `#DC2626` = `--destructive` with `2px solid #fff`),
  user chip (`38×38` avatar `#DBEAFE`/`#1D4ED8` `14px/700` "SH", name "Sara Hansen" `14px/600/#0E2350`, chevron).

---

## 2. Dashboard — top bar (greeting row)

`portal--main.html:7–22`. Row: `display:flex; align-items:flex-end; justify-content:space-between;
gap:20px; flex-wrap:wrap`.

**Left stack:**
- Date line (line 9): **"Tuesday, July 22"** — `font-size:13px; color:#7C8698; margin-bottom:6px`.
  *(Static in the export; would be `today` formatted `dddd, MMMM D`.)*
- `<h1>` (line 10): **"Good morning, Maria"** — `margin:0; font-size:32px; font-weight:500;
  letter-spacing:-0.02em; color:#0E2350`.

**Right cluster** (line 12): `display:flex; align-items:center; gap:10px`.

- **Search pill** (line 13): `display:flex; align-items:center; gap:10px; background:#FFFFFF;
  border-radius:999px; height:44px; padding:0 18px; width:240px;
  box-shadow:0 1px 2px rgba(14,35,80,.05)`.
  - Magnifier SVG `16×16`, `stroke:#7C8698`, `stroke-width:2`, `stroke-linecap:round`.
  - `<input placeholder="Search">` — `border:none; outline:none; background:none; font-size:14px;
    flex:1; color:#0E2350`; placeholder colour `#9AA6B8` from global CSS.
- **Notification button** (lines 17–20): `width:44px; height:44px; border-radius:999px;
  background:#FFFFFF; border:none; display:grid; place-items:center; cursor:pointer;
  position:relative; box-shadow:0 1px 2px rgba(14,35,80,.05)`. Handler `goNotifs`.
  - Bell SVG `18×18`, `stroke:#3D4A5C`, `stroke-width:1.8`.
  - **Unread dot** (line 19): `position:absolute; top:10px; right:11px; width:7px; height:7px;
    border-radius:999px; background:#2563EB; border:1.5px solid #fff`. Always rendered — no
    conditional in the markup.

---

## 3. The navy hero summary panel

`portal--main.html:26–38`. It is the **left cell of a 2-up auto-fit grid** (line 25):
```
display:grid; grid-template-columns:repeat(auto-fit,minmax(380px,1fr)); gap:20px
```

**Panel container** (line 26):
```
background:#0E2350; border-radius:24px; padding:32px 34px; color:#fff;
display:flex; flex-direction:column; position:relative; overflow:hidden
```

**Two decorative blur-free circles** (lines 27–28), purely visual, no content:
1. `position:absolute; right:-70px; top:-90px; width:280px; height:280px; border-radius:999px;
   background:rgba(255,255,255,.045)`
2. `position:absolute; right:60px; bottom:-110px; width:200px; height:200px; border-radius:999px;
   background:rgba(255,255,255,.035)`

**Eyebrow** (line 29): **"This week"** — `font-size:12.5px; font-weight:600; letter-spacing:.06em;
text-transform:uppercase; color:#8FA3C7`.

**Headline sentence** (line 30): `font-size:24px; font-weight:500; line-height:1.35;
letter-spacing:-0.01em; margin-top:14px; max-width:420px; position:relative`.
Literal copy:
> Emma is **on track for B2** and Lucas improved reading by 9% since May.

The emphasised span is `font-weight:700; border-bottom:2px solid #2DD4BF` and wraps exactly
`on track for B2`.

**Hero stat row** (line 31): `display:flex; flex-wrap:wrap; gap:16px 24px; margin-top:auto;
padding-top:28px; position:relative`.
Each stat cell is `flex:none` and contains:
- value — `font-size:24px; font-weight:700; letter-spacing:-0.02em`, colour inherited `#fff`
- sub-label — `font-size:12px; color:#8FA3C7; margin-top:3px`

Separators between cells (lines 33, 35): `<div style="width:1px;background:rgba(255,255,255,.12)">`
(full-height of the flex row, no explicit height).

Hero stats, left to right:

| # | Value | Sub-label |
|---|---|---|
| 1 | `7` | `tests completed` |
| 2 | `2` | `coming up` |
| 3 | `4h 20m` | `practice this week` |

---

## 4. THE STATS STRIP / METRIC CARDS

The design has **no separate "stat card row"**. Metrics live in three places on the dashboard:
(a) the three hero stats inside the navy panel (§3), (b) the "Practice minutes" chart card (right cell
of the same grid), (c) inline metrics inside the "My children" rows. All are enumerated here.

### 4.1 Metric 1 — Tests completed
- Location: `portal--main.html:32`, hero panel.
- Visible label: **`tests completed`** (lowercase, exact wording).
- Example value: **`7`**
- Format: integer, no unit, no thousands separator shown.
- Sub-label: none beyond the label itself.
- Trend/delta indicator: **none**.
- Icon: **none**.
- Card size: `flex:none` cell in the hero stat row; value `24px/700/-0.02em/#FFFFFF`,
  label `12px/400/#8FA3C7`, `margin-top:3px`.

### 4.2 Metric 2 — Coming up
- Location: `portal--main.html:34`, hero panel.
- Visible label: **`coming up`**
- Example value: **`2`**
- Format: integer.
- Sub-label / delta / icon: none.
- Card size: identical to 4.1.
- Cross-check: the "Coming up" list (§7) renders **3** rows (25 Jul, 29 Jul, 04 Aug), so the design's
  own example data is internally inconsistent with the value `2`. Recorded, not resolved.

### 4.3 Metric 3 — Practice this week
- Location: `portal--main.html:36`, hero panel.
- Visible label: **`practice this week`**
- Example value: **`4h 20m`**
- Format: duration, rendered `{H}h {MM}m` — hour has no leading zero, minutes zero-padded to 2.
- Sub-label / delta / icon: none.
- Card size: identical to 4.1.

### 4.4 Metric 4 — Practice minutes, last 7 days (bar chart card)

Card container (`portal--main.html:40`):
```
background:#FFFFFF; border-radius:24px; padding:28px 30px;
box-shadow:0 1px 2px rgba(14,35,80,.04); display:flex; flex-direction:column
```

Header row (line 41): `display:flex; align-items:baseline; justify-content:space-between`
- `<h2>` **"Practice minutes"** — `margin:0; font-size:16px; font-weight:600; color:#0E2350`
- Range label **"last 7 days"** — `font-size:12.5px; color:#7C8698`

Plot area (line 45): `flex:1; display:flex; align-items:flex-end; gap:14px; margin-top:20px;
min-height:120px`.

Each bar column (lines 46–52): `flex:1; display:flex; flex-direction:column; align-items:center; gap:8px`
containing
- bar: `width:100%; max-width:30px; height:{N}px; background:{colour}; border-radius:8px`
- weekday letter: `font-size:11px; color:{colour}`

| Day | Bar height | Bar colour | Label | Label style |
|---|---|---|---|---|
| M | `34px` | `#E4E9F2` | `M` | `11px / 400 / #9AA6B8` |
| T | `52px` | `#E4E9F2` | `T` | `11px / 400 / #9AA6B8` |
| W | `42px` | `#E4E9F2` | `W` | `11px / 400 / #9AA6B8` |
| **T (Thu)** | **`88px`** | **`#0E2350`** | `T` | `11px / **600** / **#0E2350**` |
| F | `60px` | `#E4E9F2` | `F` | `11px / 400 / #9AA6B8` |
| S | `26px` | `#E4E9F2` | `S` | `11px / 400 / #9AA6B8` |
| S | `14px` | `#E4E9F2` | `S` | `11px / 400 / #9AA6B8` |

Highlight rule: the max-value day is filled navy `#0E2350` and its label goes weight `600` colour
`#0E2350`; all other days `#E4E9F2` bar + `#9AA6B8` label.

Caption (line 54): `margin-top:16px; font-size:13px; color:#7C8698`
> Thursday was the strongest day — **88 min**, mostly Emma's speaking drills.

`88 min` is `color:#0E2350; font-weight:600`. The rest is `#7C8698`.

**IMPLICATION:** bar `height` in px equals the minutes value 1:1 for Thursday (`88px` ↔ `88 min`).
If that holds for all bars the week totals `34+52+42+88+60+26+14 = 316 min = 5h 16m`, which contradicts
the hero's `4h 20m` (`260 min`). The two numbers in the design are not derived from one dataset.
A real implementation must normalise bar height to `min-height:120px` from the max value rather than
copy px = minutes.

### 4.5 Metric 5 — Per-child CEFR journey stage ("dots")

Inside each "My children" row (`portal--main.html:72–79`).
- Visible label: none for the metric itself; the six ticks are labelled `A1 A2 B1 B2 C1 C2`
  (`Parent Portal.dc.html:968`, `const cefrShort = ['A1','A2','B1','B2','C1','C2']`).
- Example values: **Emma `journeyStage: 3`** (current = B1), **Lucas `journeyStage: 2`** (current = A2)
  (`Parent Portal.dc.html:864`, `:882`).
- Format: 1-based ordinal into a 6-item CEFR scale.
- Rendering rule (`Parent Portal.dc.html:976–978`):
  - tick bar `bg = j < journeyStage ? '#0E2350' : '#EEF1F6'`
  - label `fg = j === journeyStage-1 ? '#0E2350' : '#9AA6B8'`
  - label `font-weight = j === journeyStage-1 ? 700 : 500`

### 4.6 Metric 6 — Per-child "Focus" skill

- Location: `portal--main.html:80`.
- Visible label: literal prefix **`Focus: `** then the skill name.
- Example values: Emma → **`Focus: Speaking`**, Lucas → **`Focus: Writing`**.
- Derivation is explicit in the export (`Parent Portal.dc.html:973`):
  `focus: k.skills.reduce((a,b) => parseInt(a.pct) < parseInt(b.pct) ? a : b).name`
  — i.e. the skill with the **lowest** percentage.
  Emma skills: Reading 78%, Listening 70%, Speaking 52%, Writing 64% → Speaking (`:867–872`).
  Lucas skills: Reading 48%, Listening 56%, Speaking 40%, Writing 34% → Writing (`:885–890`).
- Styling: `font-size:12px; font-weight:600; color:#2563EB; background:#EEF3FE;
  padding:6px 13px; border-radius:999px; flex:none`.

---

## 5. "My children" section

`portal--main.html:59–85`.

**Section header** (line 60): `display:flex; align-items:baseline; justify-content:space-between;
margin-bottom:14px`
- `<h2>` **"My children"** — `margin:0; font-size:19px; font-weight:600; letter-spacing:-0.01em;
  color:#0E2350`
- Action **"See details →"** — `font-size:13.5px; font-weight:500; color:#7C8698; cursor:pointer`,
  `style-hover="color:#2563EB"`, handler `goKids`.

**List card** (line 64): `background:#FFFFFF; border-radius:24px; padding:6px 28px;
box-shadow:0 1px 2px rgba(14,35,80,.04)`.
Note the small vertical padding (`6px`) — rows supply their own `20px` top/bottom padding.

**Row** — `<sc-for list="{{ dashKids }}" as="dk">`, placeholder count 2 (line 65). Row style (line 66):
```
display:flex; align-items:center; gap:20px; padding:20px 0;
border-bottom:1px solid {{ dk.divider }}; cursor:pointer
```
`dk.divider = i === last ? 'transparent' : '#EEF1F6'` (`Parent Portal.dc.html:972`).
Whole row is clickable → `view:'detail', kidIdx:i` (`:971`).

Row children, left → right:

1. **Avatar** (line 67): `44×44; border-radius:999px; background:#EEF1F6; color:#0E2350;
   display:grid; place-items:center; font-weight:600; font-size:15px; flex:none`.
   Content = `dk.initial` — **`E`** for Emma, **`L`** for Lucas.
2. **Name block** (line 68): fixed `width:190px; flex:none; min-width:0`
   - name — `font-size:15px; font-weight:600; color:#0E2350` → **`Emma`**, **`Lucas`**
   - school/meta — `font-size:12.5px; color:#7C8698; margin-top:2px` →
     **`Year 7 · Riverside College, Parramatta`** / **`Year 3 · Oakwood Public School, Strathfield`**
     (`Parent Portal.dc.html:862`, `:880`)
3. **CEFR dot strip** (line 72): `flex:1; display:flex; align-items:center; gap:6px; min-width:120px`.
   Six ticks (line 74): `display:flex; flex-direction:column; align-items:center; gap:5px; flex:1;
   max-width:52px`
   - bar: `width:100%; height:5px; border-radius:99px; background:{{ d.bg }}`
   - label: `font-size:10px; font-weight:{{ d.w }}; color:{{ d.fg }}`
   Values per §4.5.
4. **Focus pill** (line 80) — spec in §4.6.
5. **Chevron** (line 81): SVG `16×16`, `stroke:#9AA6B8`, `stroke-width:2`, path `m9 18 6-6-6-6`,
   `flex:none`.

**No hover, focus, selected or disabled state is declared on the row.**

### 5.1 The `app--parent-overview.html` variant of "My children"

Different component entirely — one card per child, `grid-template-columns:repeat(2,1fr); gap:18px`
(line 35). Each card (line 36): `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px;
padding:22px; gap:16px; box-shadow:0 1px 2px rgba(14,35,80,.06)`.
- Avatar `52×52` `radius:999px`, Emma `#DBEAFE`/`#1D4ED8`, Lucas `#CCFBF1`/`#0D9488`, `18px/700`,
  initials **`EH`** / **`LH`**.
- Name `17px/700/#0E2350`; meta `13.5px/#64748B` → "Grade 4B · Nørrebro Heights School",
  "Grade 7A · Nørrebro Heights School". Link "View profile →" `13.5px/600`.
- **Three stat tiles per child** — `grid-template-columns:repeat(3,1fr); gap:12px`; tile
  `background:#F7F9FC; border-radius:12px; padding:14px; gap:3px`; value `22px/700`;
  label `12.5px/#64748B`:

  | Tile | Emma | Lucas | Label | Value colour |
  |---|---|---|---|---|
  | Avg. score | `86%` | `71%` | `Avg. score` | `#0E2350` |
  | Tests taken | `14` | `9` | `Tests taken` | `#0E2350` |
  | Delta | `+4%` | `−2%` | `vs last month` | `#16A34A` (= `--success`) / `#DC2626` (= `--destructive`) |

  The delta uses a **U+2212 MINUS SIGN** (`−`), not a hyphen, and colour carries the sign meaning —
  there is no arrow glyph.
- Status strip per child: Emma (line 50) `background:#EFF5FF; radius:12px; padding:12px 14px;
  font 13.5px; color:#16326E`, clock icon `#2563EB`, copy `**Math · Fractions** — tomorrow 09:00`,
  badge **`UPCOMING`** `12px/700/#D97706` on `#FEF3C7`, `padding:3px 9px; radius:999px`.
  Lucas (line 66) `background:#FEF2F2; color:#991B1B`, warning triangle `#DC2626`,
  copy `**English · Reading** — score below class average`, action `Review →` `13px/700/#DC2626`.
- Also present in this variant: a **Recent results table** (lines 71–78) with columns
  `Test / Child / Date / Score` at `grid-template-columns:2.2fr 1fr 1fr 1fr .8fr; gap:12px`, header
  `11.5px/700/.06em/uppercase/#94A3B8`, rows `14px`, score colour-coded
  `92%`→`#16A34A`, `88%`→`#16A34A`, `54%`→`#DC2626`, `73%`→`#D97706`; and a **Credit activity** card
  (lines 81–87) with `−1 / +10 / −1` chips (`32×32`, `radius:9px`, `#FEF2F2`/`#DC2626` and
  `#F0FDF4`/`#16A34A`) plus an upsell panel `background:linear-gradient(135deg,#0E2350,#16326E)`.

---

## 6. "Note from school" (teacher note) + "Recommended this week"

Both sit in a second auto-fit 2-up grid (`portal--main.html:88`):
`display:grid; grid-template-columns:repeat(auto-fit,minmax(380px,1fr)); gap:20px`.

### 6.1 Teacher note card — lines 89–97

Container: `background:#FFFFFF; border-radius:24px; padding:28px 30px;
box-shadow:0 1px 2px rgba(14,35,80,.04); display:flex; flex-direction:column`.

- **Eyebrow** (line 90): **"Note from school"** — `font-size:12.5px; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase; color:#9AA6B8`.
- **Body quote** (line 91): `font-size:16.5px; font-weight:450; line-height:1.6; color:#0E2350;
  margin-top:14px; flex:1`. Note `font-weight:450` — requires the variable font.
  Exact copy (curly double quotes are part of the string):
  > "Emma volunteered to present in front of the class this week — a big step. Ten minutes of speaking practice at home before Friday would set her up beautifully."
- **Author footer** (line 92): `display:flex; align-items:center; gap:12px; margin-top:20px;
  padding-top:18px; border-top:1px solid #EEF1F6`
  - avatar `38×38; radius:999px; background:#EEF1F6; color:#0E2350; grid/place-items:center;
    font-weight:600; font-size:13px; flex:none`, glyph **`A`**
  - name **"Ms. Alvarez"** — `13.5px / 600 / #0E2350`
  - role **"EAL/D coordinator · Riverside College"** — `12px / 400 / #7C8698`
  - action **"Reply"** — `13px / 600 / #2563EB; cursor:pointer`, no handler bound

### 6.2 "Recommended this week" card — lines 98–117

Container: same card spec as 6.1 minus `display:flex` (`background:#FFFFFF; border-radius:24px;
padding:28px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04)`).

- `<h2>` **"Recommended this week"** — `margin:0; font-size:16px; font-weight:600; color:#0E2350`.
- List (line 100): `display:flex; flex-direction:column; gap:6px; margin-top:14px`.
- Item row: `display:flex; align-items:center; gap:14px; padding:11px 0`
  - index circle: `26×26; border-radius:999px; border:1.5px solid #D8DFEA; display:grid;
    place-items:center; font-size:11px; font-weight:700; color:#7C8698; flex:none`
  - title: `font-size:14px; font-weight:600; color:#0E2350`
  - meta: `font-size:12.5px; color:#7C8698; margin-top:1px`
  - action: `font-size:13px; font-weight:600; color:#2563EB; cursor:pointer; flex:none`

| # | Title | Meta | Action |
|---|---|---|---|
| 1 | `Speaking drill — describe your day` | `Emma · 10 min · builds toward Friday's presentation` | `Assign` |
| 2 | `Picture words — around the house` | `Lucas · 8 min · writing foundations` | `Assign` |
| 3 | `Read together — 15 minutes, any book` | `Both · reading aloud in English or Vietnamese counts` | `Done ✓` |

The third item's action is the **completed** variant — same `#2563EB` styling, only the text differs
(`Done ✓`, U+2713). No struck-through / dimmed treatment exists in the markup.

---

## 7. "Coming up"

`portal--main.html:121–144`. Container:
```
background:#FFFFFF; border-radius:24px; padding:8px 30px;
box-shadow:0 1px 2px rgba(14,35,80,.04)
```

**Header** (line 122): `display:flex; align-items:baseline; justify-content:space-between;
padding:22px 0 6px`
- `<h2>` **"Coming up"** — `margin:0; font-size:19px; font-weight:600; letter-spacing:-0.01em;
  color:#0E2350`
- Action **"Full calendar →"** — `13.5px / 500 / #7C8698; cursor:pointer`,
  `style-hover="color:#2563EB"`. No handler bound.

**Event row** (lines 126, 132): `display:flex; align-items:center; gap:20px; padding:18px 0;
border-bottom:1px solid #EEF1F6`. Last row (line 138): `padding:18px 0 24px`, **no bottom border**.

Row children:
1. **Date block**: `width:56px; flex:none; text-align:center`
   - day — `font-size:21px; font-weight:700; color:#0E2350; line-height:1`
   - month — `font-size:11px; font-weight:600; letter-spacing:.08em; color:#9AA6B8; margin-top:3px`,
     uppercase 3-letter (`JUL`, `AUG`) — literal uppercase in the markup, no `text-transform`
2. **Vertical rule**: `width:1px; height:34px; background:#EEF1F6`
3. **Text stack** (`flex:1; min-width:0`)
   - title — `font-size:14.5px; font-weight:600; color:#0E2350`
   - detail — `font-size:13px; color:#7C8698; margin-top:2px`
4. **Status label** (`flex:none`) — two variants:
   - emphasis: `font-size:12px; font-weight:600; color:#2563EB`
   - quiet: `font-size:12px; font-weight:500; color:#7C8698`

| Date | Title | Detail | Status | Status variant |
|---|---|---|---|---|
| `25` `JUL` | `English placement — all four skills` | `Emma · one sitting, about 55 minutes · headset needed` | `Due Friday` | emphasis `#2563EB/600` |
| `29` `JUL` | `Reading & listening check-in` | `Lucas · about 25 minutes · can pause and resume` | `Window open` | quiet `#7C8698/500` |
| `04` `AUG` | `Parent–teacher review call` | `Both children · 20 minutes · with Ms. Alvarez` | `Scheduled` | quiet `#7C8698/500` |

Day numbers are zero-padded to 2 (`04`). En-dashes in "Parent–teacher" and "English placement —" are
literal U+2013 / U+2014.

---

## 8. "Find a school" surface

`portal--main.html:148–260`, gated by `<sc-if value="{{ isSearch }}">`.
Wrapper (line 149): `display:flex; flex-direction:column; gap:20px; padding:8px 4px 8px 8px;
height:100%; min-height:0; box-sizing:border-box`.

### 8.1 Search header — lines 150–160

Row: `display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap`.

- `<h1>` **"Find a school"** — `margin:0; font-size:30px; font-weight:500; letter-spacing:-0.02em;
  color:#0E2350`. *(Note: 30px here vs 32px on the dashboard `<h1>`.)*
- Sub-line (line 153): `margin:6px 0 0; font-size:14px; color:#7C8698`
  > `{{ filteredCount }} schools across Australia accept SchoolTest placement`

  `filteredCount = visibleIdx.length` (`Parent Portal.dc.html:1030`). With the default state
  (`fCity:'All', fTypes:{}, fPrograms:{}, fRating:'Any'`, `:737`) it is **8** — the length of
  `schoolDefs` (`:808–815`).
- **Search pill** (line 155): `display:flex; align-items:center; gap:10px; background:#FFFFFF;
  border-radius:999px; height:48px; padding:0 8px 0 20px; width:360px;
  box-shadow:0 1px 2px rgba(14,35,80,.05)`
  - magnifier `16×16` `#7C8698`
  - `<input placeholder="Search schools or suburbs">` — `14px`, `color:#0E2350`, borderless
  - **Search button**: `height:36px; padding:0 18px; border-radius:999px; background:#0E2350;
    color:#fff; font-size:13px; font-weight:600; border:none; cursor:pointer`,
    `style-hover="background:#16326E"`. No handler bound.

### 8.2 Filter bar — lines 162–169

Row: `display:flex; align-items:center; gap:8px; flex-wrap:wrap`.

- **"All filters" button** (line 163): `display:inline-flex; align-items:center; gap:7px;
  background:#0E2350; color:#fff; font-size:13px; font-weight:600; padding:9px 16px;
  border-radius:999px; border:none; cursor:pointer`, `style-hover="background:#16326E"`.
  Icon: SVG `13×13`, `stroke:currentColor`, `stroke-width:2`, path `M4 6h16M7 12h10M10 18h4`.
  Handler `openFilters` → `filtersOpen:true`.
- **Divider** (line 164): `width:1px; height:22px; background:#D8DFEA; margin:0 4px`.
- **Applied-filter chips** (line 166), `<sc-for list="{{ filterChips }}">`:
  `background:#FFFFFF; color:#0E2350; font-size:13px; font-weight:500; padding:9px 16px;
  border-radius:999px; border:1px solid #0E2350; cursor:pointer`. Label text is
  `{{ fc.label }} ✕` (U+2715 appended with a space). Click removes that filter.
  Chip labels are built at `Parent Portal.dc.html:955–959`: the city name, each selected school type,
  each selected program, and `Rating {value}+`.
- **Empty state** (line 168): `font-size:13px; color:#9AA6B8;
  display:{{ noChipsDisplay }}` where `noChipsDisplay = filterChips.length ? 'none' : 'inline'`
  (`:1031`). Copy: **"No filters applied — showing all schools"**.

### 8.3 Two-column body — line 171

```
display:grid; grid-template-columns:340px 1fr; gap:20px; flex:1; min-height:0
```
Fixed 340px list rail, fluid map. **Not** responsive — no `auto-fit`, no media query.

### 8.4 School list — lines 173–190

Scroll container: `display:flex; flex-direction:column; gap:14px; overflow-y:auto; min-height:0;
padding:2px 4px 8px 2px`.

**School card** (line 175): `background:#FFFFFF; border-radius:20px; padding:20px 22px;
cursor:pointer; box-shadow:{{ s.shadow }}; border:1.5px solid {{ s.borderColor }}`.

States (`Parent Portal.dc.html:851–852`):

| State | border | box-shadow |
|---|---|---|
| default | `1.5px solid transparent` | `0 1px 2px rgba(14,35,80,.04)` |
| selected | `1.5px solid #0E2350` | `0 8px 24px rgba(14,35,80,.12)` |

No hover state declared. Click → `selectSchool(i)`; if the map zoom `< 9` it `setView(coords, 11,
{animate:true})`, otherwise `panTo(coords, {animate:true})` (`Parent Portal.dc.html:842–844`).

Card top row (line 176): `display:flex; align-items:flex-start; justify-content:space-between; gap:12px`
- name — `font-size:15.5px; font-weight:600; color:#0E2350`
- meta — `font-size:13px; color:#7C8698; margin-top:3px`
- rating (line 181) — `display:inline-flex; align-items:center; gap:5px; font-size:13px;
  font-weight:600; color:#0E2350; flex:none; margin-top:1px`, preceded by a filled star SVG
  `12×12`, `fill:#0E2350`, `stroke:none`, path
  `M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z`

Card footer (line 183): `display:flex; align-items:center; gap:6px 14px; flex-wrap:wrap;
margin-top:14px; padding-top:14px; border-top:1px solid #EEF1F6; font-size:12.5px; color:#7C8698`
- check icon `13×13`, `stroke:#2563EB`, `stroke-width:2`, path `M20 6 9 17l-5-5`, then literal copy
  **"Accepts SchoolTest placement"** — this string is hardcoded on every card
- a `·` separator, then `{{ s.tag }}`
- `{{ s.note }}` at `margin-left:auto; font-weight:600; color:{{ s.noteColor }}`

**Full example dataset** (`Parent Portal.dc.html:808–815`) — 8 schools:

| # | Name | Meta | Rating | Tag | Note | Note colour | City | Type | Programs | Coords |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Westbrook Grammar | `Independent · Years 7–12 · Chatswood NSW` | `4.9` | `Scholarships` | `Applications open` | `#2563EB` | Sydney | Independent | Scholarships, Selective entry | `-33.796, 151.183` |
| 1 | Riverside College | `Public · Years 7–12 · Parramatta NSW` | `4.8` | `EAL/D support` | `Emma's school` | `#7C8698` | Sydney | Public | EAL/D support | `-33.815, 151.001` |
| 2 | Northgate Preparatory | `Independent · Years K–12 · North Sydney NSW` | `4.7` | `Boarding` | `Waitlist` | `#7C8698` | Sydney | Independent | Boarding, Scholarships | `-33.839, 151.207` |
| 3 | Oakwood Public School | `Public · Years K–6 · Strathfield NSW` | `4.6` | `EAL/D support` | `Lucas's school` | `#7C8698` | Sydney | Public | EAL/D support | `-33.872, 151.094` |
| 4 | Southbank Secondary College | `Public · Years 7–12 · Southbank VIC` | `4.7` | `Selective entry` | `Transfers open` | `#2563EB` | Melbourne | Public | EAL/D support, Selective entry | `-37.823, 144.965` |
| 5 | Glen Waverley Grammar | `Independent · Years 7–12 · Glen Waverley VIC` | `4.8` | `Scholarships` | `Applications open` | `#2563EB` | Melbourne | Independent | Scholarships | `-37.878, 145.164` |
| 6 | St Malachy's College | `Catholic · Years 7–12 · Kelvin Grove QLD` | `4.6` | `Scholarships` | `Open day 9 Aug` | `#7C8698` | Brisbane | Catholic | Scholarships | `-27.448, 153.014` |
| 7 | Sunnybank State High | `Public · Years 7–12 · Sunnybank QLD` | `4.5` | `EAL/D support` | `Transfers open` | `#7C8698` | Brisbane | Public | EAL/D support | `-27.578, 153.062` |

Default `selected: 1` → Riverside College (`Parent Portal.dc.html:735`).

### 8.5 Map panel (Leaflet) — lines 193–207

Panel: `background:#FFFFFF; border-radius:24px; box-shadow:0 1px 2px rgba(14,35,80,.04);
position:relative; overflow:hidden; min-height:420px`.
Map mount (line 194): `position:absolute; inset:0; background:#F4F6FA` — `#F4F6FA` is the placeholder
colour visible before tiles load.

**Leaflet config** (`Parent Portal.dc.html:787–796`):
- library: Leaflet **1.9.4** from `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` + matching CSS
  (`Parent Portal.dc.html:21–22`)
- `L.map(el, { zoomControl:false, attributionControl:false, scrollWheelZoom:true })`
- initial view `setView([-28.6, 134.3], 4)` — whole-Australia framing
- tiles: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`, `maxZoom:19`,
  `subdomains:'abcd'` (CARTO Light)
- `map.on('zoomend', refreshMarkers)`; `invalidateSize()` fired 100 ms after mount and 60 ms after
  each update (`:795`, `:746`)

**Marker rendering** (`Parent Portal.dc.html:765–786`) — two modes keyed on zoom:

*Zoom ≥ 9 — individual pins* (`pinIcon`, `:749–756`), `L.divIcon` with `iconSize:[0,0]`,
`iconAnchor:[0,0]`, inner wrapper `display:flex; flex-direction:column; align-items:center;
transform:translate(-50%,-100%); width:max-content`:
- label pill: `font-size:12.5px; font-weight:700; padding:7px 13px; border-radius:999px;
  box-shadow:0 2px 10px rgba(14,35,80,.25); white-space:nowrap`
  - unselected: `background:#FFFFFF; color:#0E2350; border:1.5px solid #D8DFEA`, text = rating only
    (e.g. `4.9`)
  - selected: `background:#0E2350; color:#FFFFFF; border:1.5px solid #0E2350`, text =
    `{rating} · {name}` (e.g. `4.8 · Riverside College`)
- stem: `width:2px; height:7px`, `background:#0E2350` when selected else `#9AA6B8`
- selected marker gets `zIndexOffset: 500`
- click → select that school and `panTo(coords, {animate:true})`

*Zoom < 9 — city clusters* (`clusterIcon`, `:757–764`), one per city in `cityDefs`
(`Parent Portal.dc.html:818–820`: Sydney `-33.84,151.12`; Melbourne `-37.85,145.05`;
Brisbane `-27.51,153.04`), suppressed when the filtered count for that city is 0:
- bubble: `38×38; border-radius:999px; background:#2563EB; border:3px solid #fff;
  box-shadow:0 2px 10px rgba(14,35,80,.3); display:grid; place-items:center; color:#fff;
  font-size:14px; font-weight:700`, `iconSize:[38,38]`, `iconAnchor:[19,19]`
- content: the count when `> 1`; when exactly `1`, a graduation-cap SVG `15×15`, `stroke:#fff`,
  `stroke-width:2`
- click → `setView(cityCoords, 11, {animate:true})`

**Selected-school floating card** (lines 195–202): `position:absolute; left:20px; bottom:20px;
background:#FFFFFF; border-radius:16px; box-shadow:0 8px 24px rgba(14,35,80,.14);
padding:14px 18px; display:flex; align-items:center; gap:14px; max-width:340px; z-index:900`
- rating tile: `40×40; border-radius:12px; background:#0E2350; color:#fff; display:grid;
  place-items:center; flex:none; font-weight:700; font-size:13px` → `{{ selectedRating }}` = `4.8`
- name `14px / 600 / #0E2350` → `{{ selectedName }}` = `Riverside College`
- meta `12.5px / #7C8698; margin-top:1px` → `{{ selectedMeta }}` = `Public · Years 7–12 · Parramatta NSW`
- action **"View →"** `13px / 600 / #2563EB; cursor:pointer; flex:none` — no handler bound

**Zoom controls** (lines 203–206): `position:absolute; right:20px; top:20px; display:flex;
flex-direction:column; gap:8px; z-index:900`. Each button:
`40×40; border-radius:12px; background:#FFFFFF; border:none;
box-shadow:0 2px 10px rgba(14,35,80,.12); font-size:18px; font-weight:500; color:#0E2350;
cursor:pointer`. Glyphs `+` and `−` (U+2212). Handlers `zoomIn`/`zoomOut` → `map.zoomIn()` /
`map.zoomOut()` (`Parent Portal.dc.html:1026–1027`).

### 8.6 Filters overlay — lines 211–258

Gated by `<sc-if value="{{ filtersOpen }}">`, default `false` (`Parent Portal.dc.html:737`).

**Scrim** (line 212): `position:fixed; inset:0; background:rgba(14,35,80,.42); z-index:2000;
display:grid; place-items:center; padding:24px`. Click → `closeFilters`.

**Dialog** (line 213): `background:#FFFFFF; border-radius:24px; width:560px; max-width:100%;
max-height:88vh; overflow-y:auto; box-shadow:0 28px 56px rgba(0,0,0,.22);
display:flex; flex-direction:column`. Click → `stopProp`.

**Header** (line 214): sticky. `display:flex; align-items:center; justify-content:space-between;
padding:22px 28px; border-bottom:1px solid #EEF1F6; position:sticky; top:0; background:#fff;
border-radius:24px 24px 0 0`
- `<h2>` **"Filters"** — `margin:0; font-size:17px; font-weight:600; color:#0E2350`
- close button: `34×34; border-radius:999px; background:#F4F6FA; border:none; display:grid;
  place-items:center; cursor:pointer; color:#0E2350; font-size:15px`, glyph `✕` (U+2715)

**Body** (line 218): `padding:24px 28px; display:flex; flex-direction:column; gap:24px`.
Each group: label `font-size:13px; font-weight:600; color:#0E2350; margin-bottom:9px`, then
`display:flex; gap:8px; flex-wrap:wrap`.

**Filter chip button** (identical in all four groups, lines 223/231/239/247):
```
height:42px; padding:0 17px; border-radius:999px; font-size:13.5px;
font-weight:500; cursor:pointer;
background:{{ bg }}; color:{{ fg }}; border:1.5px solid {{ border }}
```
States from `chip(on)` (`Parent Portal.dc.html:802–806`):

| State | background | color | border |
|---|---|---|---|
| on | `#0E2350` | `#FFFFFF` | `#0E2350` |
| off | `#FFFFFF` | `#3D4A5C` | `#D8DFEA` |

**Groups, in order** (`Parent Portal.dc.html:951–954`):

1. **City** — single-select (`pickKey('fCity', …)`), options `All`, `Sydney`, `Melbourne`, `Brisbane`.
   Default `All`.
2. **School type** — multi-select (`toggleKey('fTypes', …)`), options `Public`, `Catholic`,
   `Independent`. Default none selected.
3. **Programs** — multi-select (`toggleKey('fPrograms', …)`), options `EAL/D support`,
   `Selective entry`, `Scholarships`, `Boarding`. Default none.
4. **Minimum rating** — single-select (`pickKey('fRating', …)`), values `Any`, `4.6`, `4.8` rendered as
   labels **`Any rating`**, **`4.6+`**, **`4.8+`**. Default `Any`.

**Filter predicate** (`Parent Portal.dc.html:822–834`):
```
(fCity === 'All' || s.city === fCity)
&& (!types.length || types.includes(s.type))
&& (!progs.length || progs.some(p => s.programs.includes(p)))
&& parseFloat(s.rating) >= (fRating === 'Any' ? 0 : parseFloat(fRating))
```
City = equality; type = OR within the group; program = OR within the group; rating = `>=` threshold.
Groups AND together.

**Footer** (line 252): sticky. `display:flex; align-items:center; justify-content:space-between;
padding:18px 28px; border-top:1px solid #EEF1F6; position:sticky; bottom:0; background:#fff;
border-radius:0 0 24px 24px`
- **"Clear all"** — `background:transparent; color:#3D4A5C; font-size:14px; font-weight:600;
  border:none; cursor:pointer; text-decoration:underline; padding:8px 4px`. Resets
  `fCity:'All', fTypes:{}, fPrograms:{}, fRating:'Any'` (`:1035`).
- **"Show {{ filteredCount }} schools"** — `background:#0E2350; color:#fff; font-size:14px;
  font-weight:600; padding:13px 26px; border-radius:999px; border:none; cursor:pointer`,
  `style-hover="background:#16326E"`. Closes the modal. Wording is not pluralised — it reads
  "Show 1 schools" at count 1.

---

## 9. Responsive hints present in the markup

There are **zero `@media` queries** in `Parent Portal.dc.html`, `portal--main.html`,
`portal--detached-sidebar.html`, or `app--parent-overview.html` (verified by grep). All adaptivity is
intrinsic:

| Hint | Location |
|---|---|
| `max-width:1600px; margin:0 auto` on the outer frame | `Parent Portal.dc.html:25` |
| `height:100vh; box-sizing:border-box` frame; `<main>` scrolls, sidebar does not | `:25`, `portal--main.html:2` |
| `grid-template-columns:repeat(auto-fit,minmax(380px,1fr))` — hero grid and note/recommendations grid collapse to 1 column below ~780px of main width | `portal--main.html:25`, `:88` |
| `flex-wrap:wrap` — greeting row, hero stat row, filter-chip row, search header row, school-card footer (9 occurrences total) | `portal--main.html:7,31,150,162,183`, + filter groups `221,229,237,245` |
| `min-width:0` on `<main>` and every flex text stack — prevents overflow | `:2,68,72,103,177,197` |
| Fixed, non-responsive: sidebar `248px`, search list rail `340px`, kid name column `190px`, dashboard search pill `240px`, search-view pill `360px`, date block `56px`, filter dialog `560px` | as cited |
| Dialog `max-width:100%; max-height:88vh; overflow-y:auto` | `portal--main.html:213` |
| Map `min-height:420px` | `portal--main.html:193` |
| Bars `width:100%; max-width:30px` | `portal--main.html:46–52` |

---

## 10. METRIC INVENTORY

`Derived from` column: everything marked **(IMPLICATION)** is my read of what the number would have to be
computed from — it is **not** stated in the design files. Everything else is literally in the export.

| # | Metric | Visible label | Example value | Format | Derived from |
|---|---|---|---|---|---|
| 1 | Tests completed this week | `tests completed` | `7` | integer | (IMPLICATION) count of completed test sessions across all children of the parent, within the current ISO week |
| 2 | Upcoming items | `coming up` | `2` | integer | (IMPLICATION) count of scheduled/assigned items with a future due date across all children. Design's own "Coming up" list shows 3 rows — inconsistent |
| 3 | Practice time this week | `practice this week` | `4h 20m` | duration `{H}h {MM}m` | (IMPLICATION) sum of practice-session durations across all children for the current week |
| 4 | Practice minutes per day | `Practice minutes` / range `last 7 days` | 7 bars: `34, 52, 42, 88, 60, 26, 14` (px; Thu = 88 min per caption) | integer minutes per weekday | (IMPLICATION) practice minutes grouped by day for the trailing 7 days; the max day is highlighted navy |
| 5 | Strongest practice day | caption `Thursday was the strongest day — 88 min, mostly Emma's speaking drills.` | `Thursday`, `88 min` | weekday name + integer minutes | (IMPLICATION) argmax over metric 4, plus the dominant child+skill of that day's sessions |
| 6 | Child CEFR journey stage | six ticks `A1 A2 B1 B2 C1 C2` | Emma stage `3` (B1), Lucas stage `2` (A2) | 1-based ordinal over a 6-item CEFR scale | explicit in export: `journeyStage` per child (`Parent Portal.dc.html:864`, `:882`) |
| 7 | Child focus skill | `Focus: {skill}` | `Focus: Speaking` (Emma), `Focus: Writing` (Lucas) | enum: Reading / Listening / Speaking / Writing | explicit in export: lowest-`pct` skill, `k.skills.reduce(...)` (`Parent Portal.dc.html:973`) |
| 8 | Hero headline claims | prose in the navy panel | `on track for B2`, `improved reading by 9% since May` | CEFR level string + signed percent + month name | (IMPLICATION) projected next CEFR level + per-skill percent delta vs a prior baseline month. Emma's `nextLevel:'B2'` and Lucas's `note:'Reading improved 9% since May'` exist verbatim in the data (`Parent Portal.dc.html:863`, `:882`) |
| 9 | Filtered school count | `{n} schools across Australia accept SchoolTest placement` and `Show {n} schools` | `8` | integer | explicit: `visibleIdx.length` after the filter predicate (`Parent Portal.dc.html:1030`, `:822–834`) |
| 10 | School rating | star + number on each card; `40×40` tile on the map card | `4.9`, `4.8`, `4.7`, `4.6`, `4.5` | decimal, 1 dp, 0–5 | explicit static field `rating` (`Parent Portal.dc.html:808–815`) |
| 11 | City cluster count | number inside the blue map bubble | Sydney `4`, Melbourne `2`, Brisbane `2` at default filters | integer | explicit: count of filtered schools whose `city` matches, shown only at zoom `< 9` (`:777–784`) |
| 12 | Unread notifications | blue dot on the bell (no number) | boolean-only (dot always rendered) | boolean | (IMPLICATION) `unreadCount > 0`. The notifications data set has 2 unread items (`Parent Portal.dc.html:987–990`) but no count is surfaced on the dashboard |

### 10.1 Metrics that exist only in the `app--parent-overview.html` variant

Not part of the detached-sidebar dashboard, recorded so they are not confused with the above.

| Metric | Label | Example | Format | Source |
|---|---|---|---|---|
| Test credits | `Test credits` | `12` | integer | `app--parent-overview.html:11–12`, also `12 credits` pill at `:20` |
| Average score per child | `Avg. score` | `86%` / `71%` | percent, 0 dp | `:46`, `:62` |
| Tests taken per child | `Tests taken` | `14` / `9` | integer | `:47`, `:63` |
| Month-over-month delta | `vs last month` | `+4%` (`#16A34A`) / `−2%` (`#DC2626`) | signed percent, 0 dp, U+2212 for negative, colour = sign | `:48`, `:64` |
| Recent result score | table column `Score` | `92%`, `88%`, `54%`, `73%` | percent, colour-banded `#16A34A` / `#DC2626` / `#D97706` | `:74–77` |
| Credit ledger delta | Credit activity rows | `−1`, `+10`, `−1` | signed integer, colour + tinted tile | `:83–85` |

---

## 11. ANIMATIONS

Read directly from the files. This screen is **almost entirely static** — that is a finding, not an
omission on my part.

### 11.1 CSS transitions present on this screen
**None.** `grep "transition:"` returns zero hits in `portal--main.html`, `portal--detached-sidebar.html`
and `app--parent-overview.html`.

The only two CSS transitions in the whole Parent Portal export belong to the **Settings** screen's
toggle switch and are out of scope here (`Parent Portal.dc.html:658–659`):
- track: `transition: background .2s` (animates `background` between `#D8DFEA` and `#0E2350`)
- knob: `transition: left .2s` (animates `left` between `3px` and `22px`, `21×21` white circle,
  `box-shadow:0 1px 3px rgba(14,35,80,.25)`)

### 11.2 CSS keyframes present on this screen
**None.** `grep "@keyframes"` returns zero hits in `Parent Portal.dc.html`.

For reference, the design system defines six keyframes elsewhere
(`dashbaord-design/SchoolTest Design System.dc.html:19–24`) — **none are referenced by this screen**:
- `st-toast-in`: `from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none }`
- `st-fade-in`: `from { opacity:0 } to { opacity:1 }`
- `st-pop-in`: `from { opacity:0; transform:scale(.96) } to { opacity:1; transform:none }`
- `st-spin`: `to { transform:rotate(360deg) }`
- `st-shimmer`: `0% { background-position:-400px 0 } 100% { background-position:400px 0 }`
- `st-rec-pulse`: `0% { box-shadow:0 0 0 0 rgba(220,38,38,.35) } 70% { box-shadow:0 0 0 16px rgba(220,38,38,0) } 100% { box-shadow:0 0 0 0 rgba(220,38,38,0) }`

### 11.3 Declared hover states (`style-hover` attribute)

`style-hover` is an authoring attribute of the design-export format. `dashbaord-design/support.js`
contains **no handler for it** (grep for `style-hover` / `hover` → 0 hits), so it is declarative intent
with **no duration and no easing specified**.

`portal--main.html` — 5 declarations:

| Element | Line | Hover |
|---|---|---|
| "See details →" (My children) | 62 | `color:#2563EB` |
| "Full calendar →" (Coming up) | 124 | `color:#2563EB` |
| "Search" button (search header) | 158 | `background:#16326E` |
| "All filters" button | 163 | `background:#16326E` |
| "Show N schools" button (filters footer) | 254 | `background:#16326E` |

`portal--detached-sidebar.html` — **0 declarations**. The sidebar nav has no hover style at all.

`app--parent-overview.html` — 9 declarations: 5× nav item `background:#F1F5F9`;
2× teal CTA `background:#0D9488; color:#fff`; 1× secondary button `background:#F7F9FC; color:#16326E`;
1× primary button `background:#1D4ED8; color:#fff`.

Global: `a:hover { color:#2563EB }` (`Parent Portal.dc.html:16`).

### 11.4 Map (Leaflet) motion — the only real motion in the design

All from `Parent Portal.dc.html`:

| Trigger | Behaviour | Line |
|---|---|---|
| Click a school card, map zoom `< 9` | `map.setView(coords, 11, { animate: true })` — animated fly + zoom | 843 |
| Click a school card, map zoom `>= 9` | `map.panTo(coords, { animate: true })` — animated pan only | 844 |
| Click a map pin | select school, then `map.panTo(coords, { animate: true })` | 775 |
| Click a city cluster bubble | `map.setView(cityCoords, 11, { animate: true })` | 783 |
| `zoomend` | `refreshMarkers()` — swaps cluster bubbles ↔ individual pins at the zoom-9 threshold (an instant swap, not a tween) | 793 |
| Mount / update | `setTimeout(() => map.invalidateSize(), 100)` on mount, `60` ms on update | 795, 746 |
| Zoom `+` / `−` buttons | `map.zoomIn()` / `map.zoomOut()` — Leaflet's own default zoom animation | 1026–1027 |

Durations/easings are Leaflet 1.9.4 defaults; the export does not override them.

### 11.5 Motion the design does **not** have (build-relevant gaps)

Nothing in these files specifies: view-change transitions between `dashboard` / `search` / `children`
(state flips instantly via `setState`), filter-modal enter/exit animation, card hover lift, bar-chart
grow-in, number count-up, skeleton/loading state, focus rings, or `prefers-reduced-motion` handling.

---

## UNKNOWNS

- **Sidebar collapsed behaviour.** The task asks for it. There is no collapsed/expanded state, no
  toggle button, no width variable, no `data-collapsed` attribute, and no icon-only variant anywhere in
  `portal--detached-sidebar.html` or `Parent Portal.dc.html`. The sidebar is a fixed `248px` in every
  state present in the export.
- **Focus states.** No `:focus`, `:focus-visible`, or `outline` declaration exists in any of the four
  files read. `input { outline:none }` is set inline on both search inputs
  (`portal--main.html:15`, `:157`), which removes the default ring with nothing replacing it.
- **Hover state for sidebar nav items, "My children" rows, school cards, recommendation rows, and
  "Coming up" rows.** None declared.
- **Active/pressed and disabled states.** None declared for any button on this screen.
- **Dark mode for this screen.** `tokens.css` defines a `.dark` block (lines 74–114) but the portal
  export never applies a `.dark` class and hardcodes light hexes. There is no dark rendering of this
  screen to spec from.
- **Which of the two compositions is canonical.** `portal--main.html` + `portal--detached-sidebar.html`
  (navy hero, 24px radii, `#EEF1F6` page) and `app--parent-overview.html` (attached sidebar, 16px radii,
  `#F7F9FC` page, blue active nav, credits panel) are two different visual systems for the same
  surface. The files carry no priority marker, date, or "current" flag.
- **Real vs example data boundary for the hero copy.** The sentence "Emma is on track for B2 and Lucas
  improved reading by 9% since May" is authored prose in the markup, not a template. Whether production
  should generate this sentence, or render a fixed template with slots, is not determinable from the
  files.
- **Notification badge count.** The bell shows a dot with no number and no conditional; whether it
  should hide at zero unread is not expressed.
- **Empty states.** No zero-children, zero-results, zero-schools, or error state exists in these files.
- **`{{ filteredCount }}` pluralisation.** The strings are `"{n} schools across Australia…"` and
  `"Show {n} schools"` with no singular form authored.
