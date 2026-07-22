# 03 — Portal Forms: Add-Child Wizard, Settings, Notifications, Billing

Spec derived **only** from the static design export. Every number, hex and string below was read
from the files cited. Nothing is inferred unless explicitly flagged under `## UNKNOWNS`.

## Sources read

| Surface | Slice | Underlying export |
|---|---|---|
| Add-child wizard (portal, 5 steps) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--add-child-multi-step.html` (L1–149) | `Parent Portal.dc.html` |
| Settings (portal) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--settings.html` (L1–43) | `Parent Portal.dc.html` |
| Notifications feed (portal) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--notifications.html` (L1–40) | `Parent Portal.dc.html` |
| Billing (portal) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/portal--billing.html` (L1–59) | `Parent Portal.dc.html` |
| Add-child modal (app) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--add-child.html` (L1–52) | `SchoolTest App Screens.dc.html` |
| Onboarding add-child (app) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--onboarding-add-child.html` (L1–43) | `SchoolTest App Screens.dc.html` |
| Parent settings (app) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--parent-settings.html` (L1–52) | `SchoolTest App Screens.dc.html` |
| Notifications panel (app) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--notifications.html` (L1–48) | `SchoolTest App Screens.dc.html` |
| Tokens | `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/tokens.css` (L1–129) | — |

The portal slices are templated with `{{ }}` bindings. Every binding used below was resolved by
reading the component script in
`/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/Parent Portal.dc.html` **L732–1052**
(state L734–739, helpers L797–806, wizard data L920–948, invoices L961–966, notifications
L982–995, settings prefs L997–1007, derived nav flags L1009–1049).

---

# 1. Foundations

## 1.1 Two distinct visual systems

The export contains **two different design languages**. They must not be mixed.

| | **Portal** (`Parent Portal.dc.html`) | **App** (`SchoolTest App Screens.dc.html`) |
|---|---|---|
| Page background | `#EEF1F6` (body, L14) | `#E9EEF6` body / `#F7F9FC` frame (L15 / slice L1) |
| Card radius | `24px` | `16px` (cards) / `18px` (modal) |
| Card border | none — shadow only | `1px solid #E3E8F0` |
| Card shadow | `0 1px 2px rgba(14,35,80,.04)` | `0 1px 2px rgba(14,35,80,.06)` |
| Input height | `48px`, radius `12px`, border `1.5px #D8DFEA` | padding `11px 14px`, radius `10px`, border `1px #CBD5E1` |
| Label | `12.5px / 600 / #0E2350` | `13.5px / 600 / #16326E` |
| Body/muted text | `#7C8698` / `#9AA6B8` / `#3D4A5C` | `#64748B` / `#94A3B8` / `#475569` |
| Primary button | `#0E2350` pill, radius `999px` | `#2563EB` rect, radius `10px` |
| Base body color | `#3D4A5C` | `#475569` |
| H1 | `30px / 500 / -0.02em` | `26px / 700 / -0.015em` |

The portal is the **canonical parent-facing surface** (it is the one with the multi-step wizard,
the billing screen and the notification feed). The app screens are earlier/alternate framings of
the same features. Where both exist, build the portal version and treat the app version as a
reference for content only.

## 1.2 Token mapping

Hexes that match `tokens.css`:

| Hex | Token(s) | Where used in these screens |
|---|---|---|
| `#0E2350` | `--navy-900`, `--foreground`, `--card-foreground`, `--secondary`→no | All portal headings, chips-on, primary button, plan card bg, toggle-on track |
| `#16326E` | `--navy-800`, `--secondary-foreground` | App labels, app secondary button text; portal primary button hover |
| `#0A1A3C` | `--navy-950` | App modal scrim `rgba(10,26,60,.45)` |
| `#2563EB` | `--blue-600`, `--primary`, `--chart-1` | Required `*`, input focus ring border, "Mark all as read", "Update", unread dot, app primary button, app active nav |
| `#1D4ED8` | `--blue-700` | App primary button hover, app avatar text, `a:hover` |
| `#3B82F6` | `--blue-500` | — (not used in these screens) |
| `#DBEAFE` | `--blue-100` | App avatar bg, Verify hover, notif icon tile bg |
| `#EFF5FF` | `--blue-50`, `--secondary`, `--sidebar-accent` | App active nav bg, selected relationship pill bg, Verify button bg, unread notification row tint |
| `#14B8A6` | `--teal-500`, `--accent` | Onboarding match avatar |
| `#0D9488` | `--teal-600` | Onboarding match subtitle + check icon; notif "payment received" icon |
| `#CCFBF1` | `--teal-100` | Onboarding match panel border |
| `#F0FDFA` | `--teal-50` | Onboarding match panel bg; notif icon tile bg |
| `#F7F9FC` | `--background` | App frame bg, app modal footer bg, app secondary button hover |
| `#FFFFFF` | `--card`, `--popover`, `--primary-foreground`, `--sidebar` | All cards, chips-off, toggle knob |
| `#F1F5F9` | `--muted` | App segmented-tab track, app hairline, app close-button hover |
| `#64748B` | `--muted-foreground` | App muted text |
| `#475569` | `--sidebar-foreground` | App body text, app inactive nav, read-notification text |
| `#E3E8F0` | `--border`, `--sidebar-border` | All app borders/dividers |
| `#CBD5E1` | `--input` | App input border, toggle-off track |
| `#DC2626` | `--destructive` | "4 NEW" badge, delete-account text/border, warning notif icon |
| `#16A34A` | `--success` | Onboarding step-1 complete, 2FA "Enabled", `92%` in notif |
| `#D97706` | `--warning` | Reminder notif icon stroke |
| `#8FA3C7` | `--muted-foreground` (dark) | Billing plan-card muted text on navy |
| `0 20px 48px rgba(14,35,80,.18)` | `--shadow-xl` | App modal + app notification panel |
| `0 8px 24px rgba(14,35,80,.12)` | `--shadow-lg` | App screen frames |

Hexes used in these screens that have **no** token in `tokens.css` (portal-local palette — these
must be added as new tokens if the portal is built):

| Hex | Role | Suggested token name |
|---|---|---|
| `#3D4A5C` | portal body text / done-step label / info-panel copy | `--portal-fg` |
| `#7C8698` | portal muted text (subtitles, meta) | `--portal-muted` |
| `#9AA6B8` | portal faint text (help text, timestamps, step counter) | `--portal-faint` |
| `#D8DFEA` | portal input & chip border, toggle-off track, ghost-button border | `--portal-input` |
| `#EEF1F6` | portal hairline divider, page body bg, dropzone icon bg, "Paid" pill bg | `--portal-line` |
| `#E4E9F2` | step-rail incomplete connector line | `--portal-line-2` |
| `#F4F6FA` | portal info/notice panel bg, VISA tile bg | `--portal-surface-2` |
| `#C4CEDC` | dropzone dashed border | `--portal-dash` |
| `#94A3B8` | app hint text (slate-400) | `--app-hint` |
| `#E9EEF6` | app canvas body bg | `--app-canvas` |
| `#FEF3C7` / `#FEF2F2` / `#F0FDF4` / `#FECACA` | notif icon tints + destructive button border/hover | warning/destructive/success tints |

## 1.3 Portal shell (context for all four portal screens)

`Parent Portal.dc.html` L25 + L60:

```
page      : display:flex; gap:24px; padding:24px; height:100vh;
            box-sizing:border-box; max-width:1600px; margin:0 auto
sidebar   : width:248px; flex:none; background:#FFFFFF; border-radius:24px;
            box-shadow:0 1px 2px rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06);
            display:flex; flex-direction:column; padding:28px 16px 16px
main      : flex:1; min-width:0; display:flex; flex-direction:column; overflow-y:auto
```

Sidebar nav item states (`nav(active)`, L797–801):

| State | font-weight | background | color |
|---|---|---|---|
| active | `600` | `#0E2350` | `#FFFFFF` |
| default | `500` | `transparent` | `#7C8698` |

Nav item box: `padding:11px 14px; border-radius:12px; font-size:14.5px; gap:12px;` icons `18×18`,
`stroke-width:1.8`. Nav gap `2px`. Section eyebrow "Manage": `11px / 600 / letter-spacing .08em /
uppercase / #9AA6B8 / padding:0 14px 8px`.

Global portal typography (L14–17): font-family
`'Google Sans', -apple-system, 'Segoe UI', system-ui, sans-serif`; body color `#3D4A5C`;
`input::placeholder { color:#9AA6B8 }`; `a { color:#0E2350 }`, `a:hover { color:#2563EB }`;
`-webkit-font-smoothing: antialiased`.

## 1.4 Shared portal primitives

### `PortalCard`
```
background:#FFFFFF; border-radius:24px; box-shadow:0 1px 2px rgba(14,35,80,.04);
```
Padding varies by card and is specified per-instance below. Cards whose first child is a repeated
list use `padding: 8px 30px` (settings) / `8px 28px` (billing invoices) / `6px 28px`
(notifications) so the row hairlines run edge-to-edge inside the horizontal padding.

### `PortalInput` (text)
```
width:100%; box-sizing:border-box; height:48px;
border:1.5px solid #D8DFEA; border-radius:12px; padding:0 15px;
font-size:14px; color:#0E2350; outline:none;
:focus -> border-color:#2563EB
::placeholder -> color:#9AA6B8
```
No error state, no disabled state, no success state and no inline error message component exists
anywhere in the export. See `## UNKNOWNS`.

### `PortalSelect`
Identical to `PortalInput` except `padding:0 12px` and `background:#fff`. **No `:focus` style is
declared on any `<select>`** (portal add-child L41, L52, L64) — the focus border treatment is
declared only on `<input>`. Native chevron; no custom chevron in the portal.

### `PortalLabel`
```
display:block; font-size:12.5px; font-weight:600; color:#0E2350; margin-bottom:7px;
```
Required marker: `<span style="color:#2563EB">*</span>` appended inside the label with no space.

### `PortalHelpText`
```
font-size:12px; color:#9AA6B8; margin-top:6px;
```
(Step-2 test-year help uses `margin-top:8px` — L61.)

### `PortalChip` (single-select toggle button)
States from `chip(on)` (L802–806):

| State | background | color | border |
|---|---|---|---|
| selected | `#0E2350` | `#FFFFFF` | `1.5px solid #0E2350` |
| unselected | `#FFFFFF` | `#3D4A5C` | `1.5px solid #D8DFEA` |

Four size variants exist:

| Variant | height | padding | radius | font-size | font-weight | Used by |
|---|---|---|---|---|---|---|
| Wide | `44px` | `0 18px` | `12px` | `13.5px` | `500` | Gender, Preferred contact channel |
| Medium | `44px` | `0 15px` | `12px` | `13.5px` | `500` | Target entry term |
| Square | `48px` wide × `44px` | — | `12px` | `13.5px` | `600` | Test year level |
| Pill | `42px` | `0 18px` | `999px` | `13.5px` | `500` | Settings → Language |

All chip rows: `display:flex; flex-wrap:wrap;` gap `8px` (`7px` for the square test-year row, L56).
No hover style is declared on any chip. All are `cursor:pointer`.

### `PortalToggle` (settings switch) — portal--settings.html L30–32
```
track : width:46px; height:27px; border-radius:999px; position:relative;
        cursor:pointer; flex:none; transition:background .2s;
        background: ON #0E2350 | OFF #D8DFEA
knob  : position:absolute; top:3px; left: ON 22px | OFF 3px;
        width:21px; height:21px; border-radius:999px; background:#fff;
        box-shadow:0 1px 3px rgba(14,35,80,.25); transition:left .2s;
```
Travel = 19px. Knob inset 3px on both ends (`46 - 3 - 21 = 22`). Semantics: `toggleKey` flips a
boolean in `state.prefsOn` keyed by the pref label (L943, L1004–1007).

### `PortalGhostButton`
```
background:#FFFFFF; color:#0E2350; font-size:13px; font-weight:600;
padding:10px 18px; border-radius:999px; border:1px solid #D8DFEA; cursor:pointer;
:hover -> border-color:#0E2350
```
Used for **Edit** (Account) and **Manage** (Password & security).

### `PortalPrimaryButton`
```
background:#0E2350; color:#fff; font-size:14px; font-weight:600;
padding:13px 26px; border-radius:999px; border:none; cursor:pointer;
:hover -> background:#16326E
```

### `PortalInfoPanel`
```
display:flex; align-items:flex-start; background:#F4F6FA;
font-size:13px; color:#3D4A5C;
small  (step 4): gap:10px; border-radius:12px; padding:12px 16px; line-height:1.5;  icon 15×15
large  (step 5): gap:11px; border-radius:14px; padding:15px 18px; line-height:1.55; icon 16×16
icon: lucide "info" — <circle cx=12 cy=12 r=10> + <path d="M12 16v-4M12 8h.01">,
      fill:none; stroke:#2563EB; stroke-width:2; stroke-linecap:round;
      flex:none; margin-top:2px
```

---

# 2. Add-Child Wizard (Portal) — the canonical multi-step form

File: `portal--add-child-multi-step.html`. Rendered when `view === 'add'`
(`isAdd`, L1014). Entered via `goAdd` which sets `{ view:'add', addStep:1 }` (L1019).

## 2.1 Page layout

```
root   : display:flex; flex-direction:column; gap:24px;
         padding:8px 4px 8px 8px; height:100%; box-sizing:border-box     (L3)
header : (block)                                                          (L4–7)
body   : display:grid; grid-template-columns:230px 1fr; gap:24px;
         flex:1; min-height:0                                             (L8)
```

`grid-template-columns:230px 1fr` is **fixed** — there is no media query or `minmax()` fallback.

### Header (L5–6)

| Element | Copy | Spec |
|---|---|---|
| Back link | `← My children` | `font-size:13.5px; font-weight:500; color:#7C8698; cursor:pointer;` hover `color:#2563EB`. `onClick = goKids` → `view:'children'` |
| Title `h1` | `Add a child` | `margin:12px 0 0; font-size:30px; font-weight:500; letter-spacing:-0.02em; color:#0E2350` |

## 2.2 Step rail (left column, 230px)

Container: `display:flex; flex-direction:column; gap:0; padding-top:8px` (L10).

Each step row (L12–21) is `display:flex; gap:14px; cursor:pointer`, `onClick = st.go`
(→ `setState({ addStep: n })`, L933). **Every step is directly clickable — the rail is free
navigation, not gated.**

Left sub-column: `display:flex; flex-direction:column; align-items:center`.

**Dot** (L14)
```
width:30px; height:30px; border-radius:999px; box-sizing:border-box;
border:1.5px solid <dotBorder>; background:<dotBg>; color:<dotFg>;
display:grid; place-items:center; font-size:12.5px; font-weight:600; flex:none;
```

**Connector line** (L15)
```
width:1.5px; flex:1; min-height:26px; background:<lineBg>; display:<lineDisplay>;
```

**Text block** (L17–20): `padding:5px 0 22px`
- title: `font-size:14px; font-weight:<w>; color:<fg>`
- sub:   `font-size:12px; color:#9AA6B8; margin-top:2px`

### Rail state matrix (resolved from L929–942)

| Step state | dot content | dotBg | dotFg | dotBorder | lineBg | title color `fg` | title weight `w` |
|---|---|---|---|---|---|---|---|
| **done** (`n < step`) | `✓` | `#0E2350` | `#FFFFFF` | `#0E2350` | `#0E2350` | `#3D4A5C` | `500` |
| **current** (`n === step`) | `String(n)` | `#0E2350` | `#FFFFFF` | `#0E2350` | `#E4E9F2` | `#0E2350` | `600` |
| **upcoming** (`n > step`) | `String(n)` | `#FFFFFF` | `#9AA6B8` | `#D8DFEA` | `#E4E9F2` | `#9AA6B8` | `500` |

`lineDisplay` is `none` for step 5 (last), `block` otherwise (L938) — the 5th step has no trailing
connector.

### Rail content (`stepDefs`, L922–928)

| # | Rail title | Rail subtitle |
|---|---|---|
| 1 | `Personal` | `Who the student is` |
| 2 | `Education` | `School & target entry` |
| 3 | `Guardian` | `Contact details` |
| 4 | `Media` | `Photo & voice intro` |
| 5 | `Review` | `Confirm details` |

Note the rail subtitles differ from the in-card step subtitles (§2.3–2.7) — both strings are real
and both must ship.

## 2.3 Step card (right column)

```
background:#FFFFFF; border-radius:24px; box-shadow:0 1px 2px rgba(14,35,80,.04);
padding:34px 38px; display:flex; flex-direction:column;
max-width:760px; overflow-y:auto;                                        (L26)
```

Every step body is `display:flex; flex-direction:column; gap:22px` (step 5 uses `gap:24px`, L123).
Every step opens with a heading block:
- `h2`: `margin:0; font-size:20px; font-weight:600; color:#0E2350`
- `p` : `margin:6px 0 0; font-size:13.5px; color:#7C8698`

Two-up field rows are `display:grid; grid-template-columns:1fr 1fr; gap:16px`.

---

## 2.4 STEP 1 — Personal details

Heading: **`Personal details`** · sub `Step 1 of 5 · Who the student is` (L30).

| # | Label | Req | Control | Placeholder / options | Help text | Default |
|---|---|---|---|---|---|---|
| 1.1 | `Given name` | **Yes** (`*` `#2563EB`) | `PortalInput` | `e.g. Minh` | — | empty |
| 1.2 | `Family name` | No | `PortalInput` | `e.g. Nguyen` | `Optional — many students go by one name only.` | empty |
| 1.3 | `Date of birth` | No | `PortalInput` (text) | `DD/MM/YYYY` | — | empty |
| 1.4 | `Email` | No | `PortalInput` | `student@example.com` | — | empty |
| 1.5 | `Gender` | No | Chip group (Wide, single-select) | `Male` · `Female` · `Other` · `Prefer not to say` | — | `Male` (state L736) |
| 1.6 | `Nationality` | **Yes** (`*`) | `PortalSelect` | `Australian`, `Vietnamese`, `Chinese`, `Indian`, `Korean`, `Filipino`, `Japanese`, `Indonesian`, `Other…` | — | `Australian` (first option, no `selected` attr) |
| 1.7 | `Passport number` | No | `PortalInput` | `e.g. E12345678` | `Optional — schools use this for enrolment paperwork.` | empty |

Row grouping: `[1.1 | 1.2]`, `[1.3 | 1.4]`, `[1.5 full-width]`, `[1.6 | 1.7]`.

Notes for implementation:
- `Date of birth` is a **plain text input with a `DD/MM/YYYY` placeholder**, not `<input type=date>`
  (L36). Format is day-first.
- `Gender` is single-select (`pickKey('gender', g)` — L945 — replaces the value, does not toggle).
- `Other…` uses a **horizontal ellipsis U+2026**, not three dots.
- The `Nationality` list is a fixed 9-item list in the design, not a full ISO country list.

---

## 2.5 STEP 2 — Education

Heading: **`Education`** · sub `Step 2 of 5 · Current schooling and target entry` (L49).

| # | Label | Req | Control | Placeholder / options | Help text | Default |
|---|---|---|---|---|---|---|
| 2.1 | `Current school` | No | `PortalInput` | `e.g. Oakwood Primary` | — | empty |
| 2.2 | `Current year level` | No | `PortalSelect` | `Foundation`, `Year 1` … `Year 12` (13 options) | — | **`Year 7`** (`selected`, L52) |
| 2.3 | `Test year level (7–12)` | No | Chip group (Square, single-select) | `7` `8` `9` `10` `11` `12` | `The SchoolTest testing band — separate from the school year.` (`margin-top:8px`) | `7` (state L736) |
| 2.4 | `Target entry year` | **Yes** (`*`) | `PortalSelect` | `2026`, `2027`, `2028`, `2029` | — | **`2027`** (`selected`, L64) |
| 2.5 | `Target entry term` | **Yes** (`*`) | Chip group (Medium, single-select) | `Term 1` · `Term 2` · `Term 3` · `Term 4` | — | `Term 1` (state L736) |

Row grouping: `[2.1 | 2.2]`, `[2.3 full-width]`, `[2.4 | 2.5]`.

Note: the label uses an **en dash** in `(7–12)`. The square chip group is `gap:7px` (all other chip
rows are `gap:8px`).

---

## 2.6 STEP 3 — Parent or guardian

Heading: **`Parent or guardian`** · sub `Step 3 of 5 · Who we contact about results and enrolment` (L72).

| # | Label | Req | Control | Placeholder / options | Help text | Default |
|---|---|---|---|---|---|---|
| 3.1 | `Parent or guardian name` | **Yes** (`*`) | `PortalInput` | `e.g. Maria Rodriguez` | — | empty |
| 3.2 | `Phone` | **Yes** (`*`) | `PortalInput` | `0400 000 000` | — | empty |
| 3.3 | `Email` | No | `PortalInput` | `guardian@example.com` | — | empty |
| 3.4 | `WeChat ID` | No | `PortalInput` | `e.g. wei_chen88` | — | empty |
| 3.5 | `Preferred contact channel` | No | Chip group (Wide, single-select) | `WhatsApp` · `WeChat` · `Email` · `SMS` | — | `WhatsApp` (state L736) |

Row grouping: `[3.1 | 3.2]`, `[3.3 | 3.4]`, `[3.5 full-width]`.

Note: guardian `Email` is **not** required here even though it is the results-delivery address;
only name and phone carry `*`. The phone placeholder is an Australian mobile format.

---

## 2.7 STEP 4 — Photo & voice

Heading: **`Photo & voice`** · sub `Step 4 of 5 · Optional photo and voice introduction` (L94).

Immediately below the heading: `PortalInfoPanel` (small variant) —
> `Both are optional. You can add or replace them later from the student's profile.`

Then a `1fr 1fr / gap:16px` grid of two identical dropzones.

### `PortalDropzone` component (L102–107, L111–116)
```
container : border:1.5px dashed #C4CEDC; border-radius:16px; padding:30px 20px;
            text-align:center; cursor:pointer;
            :hover -> border-color:#2563EB
icon well : width:46px; height:46px; border-radius:999px; background:#EEF1F6;
            display:grid; place-items:center; margin:0 auto 12px
icon      : 20×20; fill:none; stroke:#0E2350; stroke-width:1.8;
            stroke-linecap:round; stroke-linejoin:round
title     : font-size:14px;   font-weight:600; color:#0E2350
sub       : font-size:12.5px; color:#7C8698;  margin-top:3px
limit     : font-size:11.5px; color:#9AA6B8;  margin-top:8px
```

| # | Label | Icon (lucide) | Title | Sub | Constraint copy |
|---|---|---|---|---|---|
| 4.1 | `Student photo` | `image` — `rect 3,3 18×18 rx3` + `circle 9,9 r2` + `m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21` | `Add a photo` | `Drag & drop or click to upload` | `JPG or PNG, up to 15MB.` |
| 4.2 | `Voice introduction` | `mic` — `M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z` + `M19 10v2a7 7 0 0 1-14 0v-2M12 19v3` | `Add a voice intro` | `Drag & drop or click to upload` | `MP3 or M4A, up to 2 minutes.` |

Validation affordances declared: **file type** (JPG/PNG; MP3/M4A), **max size** (15MB), **max
duration** (2 minutes). No uploaded/filled state, no progress bar, no preview thumbnail and no
remove control exist in the export. See `## UNKNOWNS`.

---

## 2.8 STEP 5 — Review & confirm

Heading: **`Review & confirm`** · sub
`Step 5 of 5 · You can change any of this later in the student's profile.` (L124).
Body gap is `24px` here (not 22px).

### Summary table (L125–130)
```
wrapper : border:1px solid #EEF1F6; border-radius:16px; overflow:hidden
row     : display:flex; justify-content:space-between; gap:16px;
          padding:15px 20px; border-bottom:1px solid #EEF1F6   (last row: no border)
key     : font-size:13px;   color:#7C8698
value   : font-size:13.5px; font-weight:600; color:#0E2350; text-align:right
```

| Key | Example value in design | Composed from |
|---|---|---|
| `Personal` | `Minh Nguyen · born 14/03/2013 · Vietnamese` | 1.1 + 1.2, 1.3 (`DD/MM/YYYY`), 1.6 |
| `Education` | `Year 7 · testing band 7 · entry Term 1, 2027` | 2.2, 2.3 (prefixed `testing band `), 2.5 + `, ` + 2.4 |
| `Guardian` | `Maria Rodriguez · 0400 000 000 · WhatsApp` | 3.1, 3.2, 3.5 |
| `Media` | `Photo added · voice intro skipped` | 4.1 presence (`Photo added` / *unknown empty string*), 4.2 presence (`voice intro skipped` / *unknown filled string*) |

Separator between segments is ` · ` (space, U+00B7, space).

### Cost notice (L131–134)
`PortalInfoPanel` (large variant). Copy, with the price bolded via
`<b style="color:#0E2350">`:
> Adding a third child costs **A$9/month** on your Family plan. Your next invoice will be A$45 on 12 Aug.

This is a **computed sentence** — see the metric table in §7.

## 2.9 Wizard navigation footer (L138–144)

Sticky-to-bottom via `margin-top:auto`:
```
display:flex; align-items:center; justify-content:space-between;
margin-top:auto; padding-top:30px;
```

| Control | Spec | Behaviour (L1044–1047) |
|---|---|---|
| **Back** `← Back` | `background:transparent; border:none; font-size:14px; font-weight:600; padding:12px 10px; cursor:pointer;` color = `#3D4A5C` when `step > 1`, `#9AA6B8` when `step === 1` | `step > 1` → `addStep - 1`; `step === 1` → `view:'children'` (leaves the wizard). **Never disabled** — the greyed colour at step 1 is cosmetic only. |
| **Step counter** | `font-size:12.5px; color:#9AA6B8` — literal `Step {n} of 5` | reads `stepNum` |
| **Next** | `PortalPrimaryButton`; label = `Continue` for steps 1–4, **`Confirm & add child`** for step 5 | `step < 5` → `addStep + 1`; `step === 5` → `view:'children'` |

Right-hand group: `display:flex; align-items:center; gap:16px`.

**No client-side validation gate is present in the design** — `stepNext` advances unconditionally.
The `*` markers are the only validation affordance shipped. See `## UNKNOWNS`.

---

# 3. Add-Child — App variants (reference)

## 3.1 `app--add-child.html` — modal over "My children"

**Frame** (L1): `1440×900; background:#F7F9FC; border-radius:14px; overflow:hidden;
box-shadow:0 8px 24px rgba(14,35,80,.12); position:relative`.

**Blurred backdrop** (L2–12): `position:absolute; inset:0; filter:blur(2px); opacity:.55;
display:grid; grid-template-columns:248px 1fr`. Contains an empty `#FFFFFF` aside with
`border-right:1px solid #E3E8F0`; content pane `padding:28px 32px; gap:20px` with `h1`
`My children` (`26px/700/#0E2350`) and a `repeat(3,1fr) / gap:18px` grid of three `180px`-tall
tiles — two solid (`#FFFFFF`, `1px solid #E3E8F0`, radius `16px`), one "add" tile
(`2px dashed #CBD5E1`, radius `16px`).

**Scrim** (L13): `position:absolute; inset:0; background:rgba(10,26,60,.45);
display:grid; place-items:center`.

**Modal** (L14): `width:560px; background:#FFFFFF; border-radius:18px;
box-shadow:0 20px 48px rgba(14,35,80,.18); overflow:hidden`.

| Region | Spec |
|---|---|
| Header (L15–21) | `padding:24px 28px; border-bottom:1px solid #E3E8F0; flex; align-items:center; justify-content:space-between`. Title block `gap:3px`: `h3` `Add a child` `19px/700/#0E2350`; sub `Link a child to your account to buy tests and see results` `13.5px/#64748B`. Close: `34×34; border-radius:9px; grid place-items:center; color:#64748B;` hover `background:#F1F5F9`; X icon `16×16 stroke-width:2.2`. |
| Body (L22–44) | `padding:24px 28px; display:flex; flex-direction:column; gap:16px` |
| Footer (L45–48) | `padding:18px 28px; border-top:1px solid #E3E8F0; background:#F7F9FC; display:flex; justify-content:flex-end; gap:10px` |

### Segmented control (L23–26)
```
track  : display:grid; grid-template-columns:1fr 1fr;
         background:#F1F5F9; border-radius:10px; padding:4px
tab    : text-align:center; font-size:13.5px; font-weight:600; padding:8px; cursor:pointer
  off  : color:#64748B
  on   : color:#0E2350; background:#FFFFFF; border-radius:8px;
         box-shadow:0 1px 2px rgba(14,35,80,.08)
```
Tabs: `Student code` (off) | **`Add manually`** (on, in this screen).

### App field primitive
```
wrapper : display:flex; flex-direction:column; gap:6px
label   : font-size:13.5px; font-weight:600; color:#16326E
input   : border:1px solid #CBD5E1; border-radius:10px; padding:11px 14px;
          font-size:14.5px; color:#0E2350; outline:none
select  : same box, rendered as a div with
          display:flex; justify-content:space-between; align-items:center; cursor:pointer
          + chevron svg 14×14 stroke:#94A3B8 stroke-width:2.4 (path "m6 9 6 6 6-6")
hint    : font-size:12.5px; color:#94A3B8
```

| # | Label | Control | Example value | Hint |
|---|---|---|---|---|
| a.1 | `First name` | input | `Oliver` | — |
| a.2 | `Last name` | input | `Hansen` | — |
| a.3 | `Date of birth` | input (text) | `14 / 03 / 2018` | — |
| a.4 | `Grade` | fake select | `Grade 2` | — |
| a.5 | `School` | fake select | `Nørrebro Heights School` | `The school will confirm the link before results are shared.` |
| a.6 | `Relationship` | pill radio group, `gap:10px`, wrapper `gap:8px` | `Mother` selected | — |

Relationship pill states (L39–41):

| State | font-weight | color | background | border | radius | padding |
|---|---|---|---|---|---|---|
| selected | `600` | `#2563EB` | `#EFF5FF` | `1px solid #2563EB` | `999px` | `7px 16px` |
| default | `500` | `#475569` | — | `1px solid #CBD5E1` | `999px` | `7px 16px` |

Default hover: `background:#F7F9FC`. Options: `Mother` · `Father` · `Guardian`.

Footer buttons:
- `Cancel` — `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:14px;
  font-weight:600; padding:10px 18px; border-radius:10px;` hover `background:#F7F9FC`
- `Add Oliver` — `background:#2563EB; color:#fff; border:none; font-size:14px; font-weight:600;
  padding:10px 20px; border-radius:10px;` hover `background:#1D4ED8`. **The label interpolates the
  first-name field value** (`Add {firstName}`).

## 3.2 `app--onboarding-add-child.html` — 3-step onboarding, step 2

**Frame** (L1): `1440×900; background:#F7F9FC; border-radius:14px; display:flex;
flex-direction:column; align-items:center; padding:48px 0; box-sizing:border-box;
box-shadow:0 8px 24px rgba(14,35,80,.12)`.
Logo `assets/logo.png`, `height:36px`.
Content column: `margin-top:32px; width:640px; display:flex; flex-direction:column; gap:24px`.

### Horizontal stepper (L4–10)
Container: `display:flex; align-items:center; gap:10px; justify-content:center`.
Badge: `width:24px; height:24px; border-radius:999px; display:grid; place-items:center`.
Label wrapper: `display:flex; align-items:center; gap:7px; font-size:13px`.
Connector: `width:56px; height:2px; border-radius:2px`.

| Step | Label | State | Label weight | Label color | Badge bg | Badge content | Connector after |
|---|---|---|---|---|---|---|---|
| 1 | `Account` | complete | `600` | `#16A34A` | `#16A34A` | check svg `12×12`, `stroke:#fff`, `stroke-width:3`, `M20 6 9 17l-5-5` | `#16A34A` |
| 2 | `Add child` | current | `700` | `#2563EB` | `#2563EB` | `2` — `#fff / 12px / 700` | `#E3E8F0` |
| 3 | `Done` | pending | `600` | `#94A3B8` | `#E3E8F0` | `3` — `#64748B / 12px / 700` | — |

### Title block (L11–14)
`display:flex; flex-direction:column; gap:6px; text-align:center`
- `h2` `Link your first child` — `28px / 700 / letter-spacing:-0.015em / #0E2350`
- `p` `Use the student code from your child's school, or add them manually.` — `14.5px / #64748B`

### Card (L15)
`background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px;
display:flex; flex-direction:column; gap:18px; box-shadow:0 1px 2px rgba(14,35,80,.06)`

Segmented control (same primitive as §3.1): **`I have a student code`** (on) | `Add manually` (off).

| # | Label | Control | Example value | Hint |
|---|---|---|---|---|
| o.1 | `Student code` | mono input + `Verify` button, row `display:flex; gap:10px` | `NH-4823-EM` | `The school sends this code to you by email or letter.` |

Code input (L23): `flex:1; border:1px solid #CBD5E1; border-radius:10px; padding:11px 14px;
font-size:16px; letter-spacing:.08em; font-weight:600; color:#0E2350; outline:none;
font-family: ui-monospace, Menlo, monospace`. Format: `XX-####-XX` (2 letters, 4 digits,
2 letters, hyphen separated).

`Verify` button (L24): `background:#EFF5FF; color:#16326E; border:none; font-size:14px;
font-weight:600; padding:11px 18px; border-radius:10px;` hover `background:#DBEAFE`.

**Match-found result panel** (L28–35) — the success state of code verification:
```
panel  : background:#F0FDFA; border:1px solid #CCFBF1; border-radius:12px;
         padding:14px 16px; display:flex; align-items:center; gap:14px
avatar : 42×42; border-radius:999px; background:#14B8A6; color:#fff;
         font-size:15px; font-weight:700; grid place-items:center; flex:none   -> "EH"
line 1 : font-size:14.5px; font-weight:700; color:#0E2350
         -> "Emma Hansen · Grade 4B"
line 2 : font-size:13px; color:#0D9488
         -> "Nørrebro Heights School · Match found"
check  : svg 20×20; stroke:#0D9488; stroke-width:2.4; "M20 6 9 17l-5-5"
```

Primary CTA (L36): `background:#2563EB; color:#fff; border:none; font-size:15px; font-weight:600;
padding:13px; border-radius:10px;` hover `background:#1D4ED8`. Label
**`Link Emma to my account`** — interpolates the matched child's first name.

Footer row (L38–41): `display:flex; justify-content:space-between; align-items:center`
- `Skip for now` — `a`, `14px / 600 / #64748B`, `href="#2a"`
- `You can add more children anytime` — `13px / #94A3B8`

---

# 4. Settings

## 4.1 Settings — Portal (canonical)

File: `portal--settings.html`. Rendered when `view === 'settings'` (`isSettings`, L1017).

Container (L3): `display:flex; flex-direction:column; gap:22px; padding:8px 4px 8px 8px;
max-width:820px`.

Header (L5–6):
- `h1` `Settings` — `30px / 500 / -0.02em / #0E2350`
- `p`  `Your account, language and notification preferences` — `margin:6px 0 0; 14px / #7C8698`

There are **no tabs** on the portal settings screen — it is four stacked cards in a single
scrolling column.

### Section 1 — Account (L8–15)
Card: `PortalCard` + `padding:26px 30px`.
`h2` `Account` — `margin:0 0 18px; 16px / 600 / #0E2350`.
Row: `display:flex; align-items:center; gap:16px`.

| Element | Spec | Data |
|---|---|---|
| Avatar | `54×54; border-radius:999px; background:#0E2350; color:#fff; display:grid; place-items:center; font-size:18px; font-weight:600; flex:none` | `M` — first initial of the account name |
| Name | `font-size:15px; font-weight:600; color:#0E2350` (wrapper `flex:1`) | `Maria Rodriguez` |
| Meta | `font-size:13px; color:#7C8698; margin-top:2px` | `maria.r@gmail.com · +61 4 1234 5678` |
| Action | `PortalGhostButton` | `Edit` |

No inline edit form exists — `Edit` has no declared target. See `## UNKNOWNS`.

### Section 2 — Language (L16–24)
Card: `PortalCard` + `padding:26px 30px`.
- `h2` `Language` — `margin:0; 16px / 600 / #0E2350`
- `p` `Reports and emails can arrive in your preferred language alongside English.` —
  `margin:5px 0 16px; 13px / #7C8698`
- Chip row: `display:flex; gap:8px; flex-wrap:wrap`; `PortalChip` **Pill** variant
  (`height:42px; padding:0 18px; border-radius:999px; font-size:13.5px; font-weight:500`)

| Option | Value |
|---|---|
| 1 | `English only` |
| 2 | `Tiếng Việt` — **selected by default** (`state.reportLang`, L738) |
| 3 | `简体中文` |
| 4 | `한국어` |
| 5 | `हिन्दी` |

Single-select (`pickKey('reportLang', l)`, L997). Requires a font stack with Vietnamese,
Simplified Chinese, Korean and Devanagari coverage — `Google Sans` alone will fall back for
options 3–5.

### Section 3 — Notifications (L25–36)
Card: `PortalCard` + `padding:8px 30px` (reduced vertical padding so row hairlines span the card).
`h2` `Notifications` — `margin:0; padding:22px 0 8px; 16px / 600 / #0E2350`.

Row (L28–33): `display:flex; align-items:center; gap:16px; padding:16px 0;
border-bottom:1px solid #EEF1F6`. Text block `flex:1; min-width:0`:
- label `font-size:14px; font-weight:600; color:#0E2350`
- sub `font-size:12.5px; color:#7C8698; margin-top:2px`

Control: `PortalToggle` (§1.4).
After the last row: spacer `<div style="padding:6px 0 14px">`. **The last row keeps its
`border-bottom`** (the divider is inside the `sc-for`), so the visual result is a hairline followed
by 20px of empty card.

| # | Label | Sub copy | Default |
|---|---|---|---|
| n.1 | `Test results` | `Email + push as soon as a report is ready` | **ON** |
| n.2 | `Weekly summary` | `One digest every Sunday evening` | **ON** |
| n.3 | `Test reminders` | `48 hours and 2 hours before a deadline` | **ON** |
| n.4 | `Product news` | `New features and tips, about once a month` | **OFF** |

(Defaults from `state.prefsOn`, L738; defs L998–1003.)

### Section 4 — Password & security (L37–40)
Card: `PortalCard` + `padding:22px 30px; display:flex; align-items:center; gap:16px`.

| Element | Spec | Data |
|---|---|---|
| Title | `14px / 600 / #0E2350` | `Password & security` |
| Sub | `12.5px / #7C8698; margin-top:2px` | `Last changed 4 months ago · two-step sign-in on` |
| Action | `PortalGhostButton` | `Manage` |

The sub-line encodes **two** live facts (password age, 2FA status) in one string — see §7.

## 4.2 Settings — App variant (`app--parent-settings.html`)

Frame: `1440×900; display:grid; grid-template-columns:248px 1fr`.

**Sidebar** (L2–10): `background:#FFFFFF; border-right:1px solid #E3E8F0; display:flex;
flex-direction:column; padding:24px 16px; gap:6px; box-sizing:border-box`. Logo `height:30px;
align-self:flex-start; margin:0 8px 22px`.
Nav item: `display:flex; align-items:center; gap:11px; border-radius:10px; padding:10px 12px;
cursor:pointer`.

| State | font-size | weight | color | background | hover |
|---|---|---|---|---|---|
| default | `14px` | `500` | `#475569` | — | `background:#F1F5F9` |
| active | `14px` | `600` | `#2563EB` | `#EFF5FF` | — |

Items in order: `Overview`, `My children`, `Buy tests`, `Results`, `Billing`, **`Settings`** (active).

**Top bar** (L12–14): `background:#FFFFFF; border-bottom:1px solid #E3E8F0; padding:0 32px;
height:64px; display:flex; align-items:center; justify-content:flex-end; gap:16px; flex:none`.
Avatar `38×38; border-radius:999px; background:#DBEAFE; color:#1D4ED8; font-size:14px;
font-weight:700` → `SH`.

**Main** (L15–16): `padding:28px 32px; display:flex; flex-direction:column; gap:20px;
overflow:hidden`. `h1` `Settings` — `26px / 700 / -0.015em / #0E2350`.

**Two-column grid** (L17): `display:grid; grid-template-columns:1fr 1fr; gap:20px;
align-items:flex-start`. Right column is itself `display:flex; flex-direction:column; gap:20px`.

App card primitive: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px;
padding:26px; box-shadow:0 1px 2px rgba(14,35,80,.06)`. `h3` = `17px / 600 / #0E2350`.

### Card A — Profile (left, L18–32) — card `gap:16px`
Avatar row `display:flex; align-items:center; gap:16px`: avatar `60×60; border-radius:999px;
background:#DBEAFE; color:#1D4ED8; font-size:20px; font-weight:700` → `SH`;
`Change photo` button = app secondary (`background:#FFFFFF; color:#16326E;
border:1px solid #CBD5E1; font-size:13px; font-weight:600; padding:8px 14px; border-radius:9px;`
hover `background:#F7F9FC`).

| # | Label | Control | Example value |
|---|---|---|---|
| p.1 | `First name` | input | `Sara` |
| p.2 | `Last name` | input | `Hansen` |
| p.3 | `Email` | input | `sara.hansen@gmail.com` |
| p.4 | `Mobile phone` | input | `+45 28 44 91 02` |
| p.5 | `Language` | fake select + chevron | `Dansk` |

p.1/p.2 share a `grid-template-columns:1fr 1fr; gap:14px` row; p.3–p.5 are full width.
Save button: `align-self:flex-start; background:#2563EB; color:#fff; border:none; font-size:14px;
font-weight:600; padding:11px 20px; border-radius:10px;` hover `background:#1D4ED8` →
`Save changes`.

### Card B — Notifications (right, L34–40) — card `gap:4px`, `h3 margin:0 0 12px`
Row: `display:flex; align-items:center; gap:14px; padding:12px 0;
border-bottom:1px solid #F1F5F9` (**last row has no border**, L39).
Label `14px / 600 / #0E2350`; sub `13px / #64748B`; text wrapper `gap:2px`.

App toggle (different geometry from the portal toggle):
```
track : width:42px; height:24px; border-radius:99px; position:relative;
        flex:none; cursor:pointer
        ON  -> background:#2563EB ; knob positioned right:3px
        OFF -> background:#CBD5E1 ; knob positioned left:3px
knob  : position:absolute; top:3px; width:18px; height:18px; border-radius:99px;
        background:#fff; box-shadow:0 1px 2px rgba(14,35,80,.2)
```
**No `transition` is declared on the app toggle** (unlike the portal toggle).

| # | Label | Sub copy | State |
|---|---|---|---|
| an.1 | `Result ready` | `Email + push when a child's result arrives` | ON |
| an.2 | `Upcoming test reminders` | `24 hours before a scheduled test` | ON |
| an.3 | `Low credit balance` | `Warn me when balance falls below 3` | ON |
| an.4 | `Tips & offers` | `Occasional study tips and discounts` | OFF |

### Card C — Security (right, L41–46) — card `gap:14px`

| Row | Title | Sub | Action |
|---|---|---|---|
| s.1 | `Password` (`14px/600/#0E2350`) | `Last changed 3 months ago` (`13px/#64748B`) | `Change` (app secondary) |
| s.2 | `Two-factor authentication` | `Enabled · SMS` — **`13px / 600 / #16A34A`** | `Manage` (app secondary) |
| s.3 | `Delete account` — **`14px / 600 / #DC2626`** | `Removes all children, results and credits` (`13px/#64748B`) | `Delete…` — `background:#FFFFFF; color:#DC2626; border:1px solid #FECACA; font-size:13px; font-weight:600; padding:8px 14px; border-radius:9px;` hover `background:#FEF2F2` |

Row s.3 is separated by `padding-top:12px; border-top:1px solid #F1F5F9`.
`Delete…` uses a horizontal ellipsis, signalling a confirmation dialog (not present in the export).

---

# 5. Notifications

## 5.1 Notification feed — Portal (canonical)

File: `portal--notifications.html`. Rendered when `view === 'notifications'` (`isNotifs`, L1016).

Container (L3): `display:flex; flex-direction:column; gap:22px; padding:8px 4px 8px 8px;
max-width:820px`.

### Header (L4–10)
`display:flex; align-items:flex-end; justify-content:space-between; gap:16px`
- `h1` `Notifications` — `30px / 500 / -0.02em / #0E2350`
- `p` `2 unread` — `margin:6px 0 0; 14px / #7C8698` — **a metric** (see §7)
- Action `Mark all as read` — `background:transparent; color:#2563EB; font-size:13.5px;
  font-weight:600; border:none; cursor:pointer; padding:8px 4px`

### Feed card (L11)
`PortalCard` + `padding:6px 28px`.

### Group header (L12, L24)
`font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
color:#9AA6B8; padding:20px 0 4px`. Two groups: `Today`, `Earlier`.

### Notification row (L14–22)
```
row   : display:flex; align-items:flex-start; gap:16px; padding:17px 0;
        border-bottom:1px solid #EEF1F6
glyph : width:40px; height:40px; border-radius:12px; display:grid; place-items:center;
        flex:none; font-size:13px; font-weight:700;
        background:<iconBg>; color:<iconFg>
body  : flex:1; min-width:0
  title : font-size:14.5px; font-weight:600; color:#0E2350
  text  : font-size:13px; color:#7C8698; margin-top:2px; line-height:1.5
  time  : font-size:12px; color:#9AA6B8; margin-top:5px
dot   : width:8px; height:8px; border-radius:999px; background:<dot>;
        flex:none; margin-top:6px
```
Trailing spacer after each group: `<div style="padding:6px 0 14px">` (only after `Earlier`, L36).

### Row states (`mkNotif`, L982–986)

| State | `iconBg` | `iconFg` | `dot` |
|---|---|---|---|
| **unread** | `#0E2350` | `#FFFFFF` | `#2563EB` |
| **read** | `#EEF1F6` | `#0E2350` | `transparent` |

The read state keeps the 8px dot in the layout as a **transparent spacer**, so read and unread rows
have identical text measure. Do not `display:none` it.

The glyph is a **1–2 character text token**, not an icon — it is the notification's own semantic
badge (a CEFR level, a punctuation mark, an initial, a currency symbol, a streak count).

### Feed content

**Today** (L987–990) — both unread:

| Glyph | Title | Text | Time |
|---|---|---|---|
| `B1` | `Emma finished her Listening check-in` | `Scored B1 · 74% — up 6% since May. The full report is ready.` | `2 hours ago` |
| `!` | `Placement test due Friday` | `Emma's English placement closes 25 July. She needs a quiet 55 minutes and a headset.` | `5 hours ago` |

**Earlier** (L991–995) — all read:

| Glyph | Title | Text | Time |
|---|---|---|---|
| `A` | `New note from Ms. Alvarez` | `About Emma volunteering to present in class this week.` | `Monday` |
| `$` | `Invoice paid — A$36.00` | `Your July Family plan invoice was charged to Visa ··4242.` | `12 July` |
| `5` | `Lucas hit a 5-day practice streak` | `Mostly reading sets — his strongest run so far.` | `10 July` |

Timestamp formatting is **three-tier**: relative hours (`2 hours ago`) → weekday name (`Monday`) →
absolute `D Month` (`12 July`). The card masking `··4242` uses two U+00B7 middle dots, not four.

### Notification preference controls
Preference toggles do **not** live on this screen — they are Section 3 of Settings (§4.1). There is
no per-notification mute, no filter and no category tab in the portal feed.

## 5.2 Notification panel — App variant (`app--notifications.html`)

A **dropdown panel** anchored to the top bar, over a blurred dashboard.

Backdrop (L2–11): `filter:blur(2px); opacity:.5; display:grid; grid-template-columns:248px 1fr`;
`64px` header bar; content `padding:28px 32px; gap:20px`; a `340×32` `#E3E8F0` radius-`8px` title
placeholder; a `1fr 1fr / gap:18px` grid of two `230px`-tall cards.

Panel (L12): `position:absolute; top:60px; right:96px; width:420px; background:#FFFFFF;
border:1px solid #E3E8F0; border-radius:16px; box-shadow:0 20px 48px rgba(14,35,80,.18);
overflow:hidden`.

**Header** (L13–16): `padding:18px 22px; border-bottom:1px solid #E3E8F0; display:flex;
align-items:center; justify-content:space-between`.
- Title group `gap:9px`: `h3` `Notifications` `16.5px / 700 / #0E2350`;
  badge `4 NEW` — `font-size:11.5px; font-weight:700; color:#fff; background:#DC2626;
  padding:2px 8px; border-radius:999px` (**uppercase literal, count-driven**)
- `Mark all read` — `a`, `13px / 600`, inherits `color:#2563EB` / hover `#1D4ED8` from the global
  `a` rule

**Row** (L17–21):
```
display:flex; gap:14px; padding:14px 22px; align-items:flex-start;
unread -> background:#EFF5FF; border-bottom:1px solid #E3E8F0
read   -> no background;      border-bottom:1px solid #F1F5F9 (last row: none)
icon tile : 38×38; border-radius:11px; display:grid; place-items:center; flex:none
            svg 17×17; fill:none; stroke-width:2; stroke-linecap/linejoin:round
body      : flex:1; display:flex; flex-direction:column; gap:2px
  text : font-size:14px; line-height:1.45;
         unread color:#0E2350 (with <strong> emphasis) | read color:#475569 (no emphasis)
  time : font-size:12.5px; color:#94A3B8
dot  : width:9px; height:9px; border-radius:99px; background:#2563EB;
       flex:none; margin-top:5px      (unread only — omitted entirely on read rows)
```

| # | State | Icon tile bg | Icon stroke | Icon (lucide) | Text | Time |
|---|---|---|---|---|---|---|
| 1 | unread | `#DBEAFE` | `#2563EB` | line chart `M3 3v18h18` + `m19 9-5 5-4-4-3 3` | **`Emma's result is ready`** ` — Math · Multiplication tables: ` **`92%`** (the `92%` is `<strong style="color:#16A34A">`) | `5 minutes ago` |
| 2 | unread | `#FEF3C7` | `#D97706` | clock `circle r10` + `M12 6v6l4 2` | **`Reminder:`** ` Emma has Math · Fractions tomorrow at 09:00` | `1 hour ago` |
| 3 | unread | `#F0FDF4` | `#16A34A` | check `M20 6 9 17l-5-5` | **`Link confirmed`** ` — Nørrebro Heights approved your link to Oliver` | `3 hours ago` |
| 4 | unread | `#FEF2F2` | `#DC2626` | alert triangle `m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z` + `M12 9v4` + `M12 17h.01` | **`Lucas scored below class average`** ` in English · Reading` | `Yesterday` |
| 5 | read | `#F0FDFA` | `#0D9488` | circle-plus `circle r10` + `M12 6v12` + `M8 10h8` | `Payment received — 10 credits added to your balance` | `May 10` |
| 6 | read | `#F1F5F9` | `#64748B` | line chart (same as #1) | `Emma's result is ready — Danish · Spelling level 4: 88%` | `May 9` |

The icon tile tint is **semantic**: blue = result, amber = reminder, green = confirmation,
red = risk alert, teal = payment, grey = archived/read.

**Footer** (L45): `padding:14px 22px; border-top:1px solid #E3E8F0; text-align:center`;
`a` `View all notifications` — `13.5px / 600`.

---

# 6. Billing (Portal)

File: `portal--billing.html`. Rendered when `view === 'billing'` (`isBilling`, L1015).

Container (L3): `display:flex; flex-direction:column; gap:24px; padding:8px 4px 8px 8px`.
**No `max-width`** — billing is the only portal screen that runs full width.

Header (L5–6):
- `h1` `Billing` — `30px / 500 / -0.02em / #0E2350`
- `p` `Family plan · next invoice A$36 on 12 August` — `margin:6px 0 0; 14px / #7C8698`

Grid (L8): `display:grid; grid-template-columns:repeat(auto-fit, minmax(380px, 1fr)); gap:20px;
align-items:start`. **This is the only true responsive rule in any of these screens.**
Left cell is a `display:flex; flex-direction:column; gap:20px` stack of two cards; right cell is
the invoices card.

## 6.1 Plan card (L10–22)
```
background:#0E2350; border-radius:24px; padding:30px 32px; color:#fff;
position:relative; overflow:hidden;
```
Decorative flourish (L11): `position:absolute; right:-60px; top:-80px; width:240px; height:240px;
border-radius:999px; background:rgba(255,255,255,.045)`. All content blocks carry
`position:relative` so they stack above it.

| Element | Spec | Data |
|---|---|---|
| Eyebrow | `font-size:12.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#8FA3C7` | `Family plan` |
| Status pill | `font-size:11.5px; font-weight:600; color:#0E2350; background:#fff; padding:4px 12px; border-radius:999px` | `Active` |
| Price | `font-size:36px; font-weight:700; letter-spacing:-0.02em` (row: `display:flex; align-items:baseline; gap:6px; margin-top:18px`) | `A$36` |
| Period | `font-size:14px; color:#8FA3C7` | `/ month` |
| Meta | `font-size:13.5px; color:#8FA3C7; margin-top:6px` | `2 children · A$18 each · unlimited practice & reports` |
| Buttons row | `display:flex; gap:10px; margin-top:24px` | — |
| `Change plan` | `background:#fff; color:#0E2350; font-size:13px; font-weight:600; padding:10px 18px; border-radius:999px; border:none` | — |
| `Pause` | `background:transparent; color:#fff; font-size:13px; font-weight:600; padding:10px 18px; border-radius:999px; border:1px solid rgba(255,255,255,.3);` hover `border-color:#fff` | — |

Top row: `display:flex; align-items:center; justify-content:space-between`.

## 6.2 Payment method card (L23–37)
`PortalCard` + `padding:26px 28px`.

Header row: `display:flex; align-items:center; justify-content:space-between`
- `h2` `Payment method` — `16px / 600 / #0E2350`
- `Update` — `13px / 600 / #2563EB; cursor:pointer` (a span, not a button)

Card row (`margin-top:18px; display:flex; align-items:center; gap:15px`):

| Element | Spec | Data |
|---|---|---|
| Brand tile | `52×36; border-radius:8px; background:#F4F6FA; border:1px solid #EEF1F6; display:grid; place-items:center; font-size:11px; font-weight:700; color:#0E2350; letter-spacing:.02em; flex:none` | `VISA` |
| Primary | `14px / 600 / #0E2350` | `Visa ending 4242` |
| Secondary | `12.5px / #7C8698; margin-top:1px` | `Expires 09/27 · Maria Rodriguez` |
| Badge | `12px / 600 / #7C8698; border:1px solid #EEF1F6; padding:4px 10px; border-radius:999px` | `Default` |

Footer strip (L33–36): `margin-top:18px; padding-top:16px; border-top:1px solid #EEF1F6;
font-size:12.5px; color:#9AA6B8; display:flex; align-items:center; gap:8px`. Lock icon `13×13`,
`stroke:currentColor` (inherits `#9AA6B8`), `stroke-width:2`, `rect 3,11 18×11 rx2` +
`M7 11V7a5 5 0 0 1 10 0v4`. Copy: `Charged in AUD · cancel anytime · GST included`.

## 6.3 Invoices card (L39–53)
`PortalCard` + `padding:8px 28px`.

Header (`display:flex; align-items:baseline; justify-content:space-between; padding:20px 0 4px`):
- `h2` `Invoices` — `16px / 600 / #0E2350`
- `Download all` — `13px / 500 / #7C8698; cursor:pointer;` hover `color:#2563EB`

Row (L45–50): `display:flex; align-items:center; gap:16px; padding:16px 0;
border-bottom:1px solid #EEF1F6`

| Element | Spec |
|---|---|
| Label | `14px / 600 / #0E2350` (wrapper `flex:1; min-width:0`) |
| Date/meta | `12.5px / #7C8698; margin-top:1px` |
| Amount | `14px / 600 / #0E2350; flex:none` |
| Status pill | `11.5px / 600 / #0E2350; background:#EEF1F6; padding:4px 11px; border-radius:999px; flex:none` — literal `Paid` (hardcoded, not data-driven) |
| Download icon | svg `16×16; stroke:#7C8698; stroke-width:2; cursor:pointer; flex:none` — `M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3` |

Trailing spacer: `<div style="padding:6px 0 12px">`.

Invoice data (L961–966):

| Label | Meta | Amount | Status |
|---|---|---|---|
| `July 2026` | `Paid 12 Jul · Visa ··4242` | `A$36.00` | `Paid` |
| `June 2026` | `Paid 12 Jun · Visa ··4242` | `A$36.00` | `Paid` |
| `May 2026` | `Paid 12 May · Visa ··4242` | `A$36.00` | `Paid` |
| `April 2026` | `Paid 12 Apr · Visa ··4242` | `A$18.00` | `Paid` |

The April→May jump (`A$18.00` → `A$36.00`) is the design's own narrative: a second child was added
in May at `A$18` each.

**Only a `Paid` state exists.** No overdue, failed, pending, refunded or void invoice state is in
the export.

---

# 7. Data inventory — metrics vs labels vs static copy

Every non-static value on these four portal screens, with its format and derivation.

## 7.1 Metrics (numbers that must be computed)

| Screen | Visible label / context | Example value | Unit / format | Must be computed from |
|---|---|---|---|---|
| Wizard §2.9 | `Step {n} of 5` | `Step 1 of 5` | integer 1–5, denominator hardcoded `5` | current `addStep` |
| Wizard step 5 | in-panel: `Adding a third child costs …` | `a third` | English ordinal word | count of existing children + 1 |
| Wizard step 5 | per-child price | `A$9/month` | `A$` + integer + `/month` | plan per-child rate at the **next** tier (note: differs from the `A$18 each` shown on Billing — see UNKNOWNS) |
| Wizard step 5 | next invoice amount | `A$45` | `A$` + integer, no decimals | current MRR + new child's rate |
| Wizard step 5 | next invoice date | `12 Aug` | `D MMM` (abbrev., no year) | billing anchor day + next cycle |
| Notifications | subtitle | `2 unread` | integer + ` unread` | count of `read === false` |
| Notifications | row timestamp | `2 hours ago` / `Monday` / `12 July` | relative <7d → weekday <7d → `D MMMM` | `createdAt` vs now |
| Notif #1 body | CEFR + score | `Scored B1 · 74% — up 6% since May.` | CEFR band, `%` integer, signed delta `%`, month name | latest result + prior result |
| Notif #1 glyph | badge | `B1` | CEFR band code | latest CEFR level |
| Notif #2 body | deadline + duration | `closes 25 July` / `a quiet 55 minutes` | `D MMMM` / integer minutes | test window close, test duration |
| Notif #4 body | amount | `A$36.00` (title) / `Visa ··4242` | `A$` + 2dp / `··` + last-4 | invoice total, payment method |
| Notif #5 | streak | `5-day practice streak` (glyph `5`) | integer + `-day` | consecutive practice days |
| Billing header | next invoice | `next invoice A$36 on 12 August` | `A$` + integer + ` on ` + `D MMMM` | upcoming charge + anchor date |
| Plan card | price | `A$36` | `A$` + integer, no decimals | children × per-child rate |
| Plan card | period | `/ month` | static suffix | plan interval |
| Plan card | composition | `2 children · A$18 each` | integer + noun; `A$` + integer | child count; per-child rate |
| Payment method | card | `Visa ending 4242` / `Expires 09/27` | brand + last-4 / `MM/YY` | PSP token |
| Invoice row | amount | `A$36.00` | `A$` + **2 decimal places** | invoice total |
| Invoice row | meta | `Paid 12 Jul · Visa ··4242` | `Paid ` + `D MMM` + ` · ` + brand + `··` + last-4 | payment date + method |
| Invoice row | label | `July 2026` | `MMMM YYYY` | billing period |
| Settings §4 | `Last changed 4 months ago · two-step sign-in on` | `4 months ago`, `on` | coarse relative duration; on/off word | password `updatedAt`; 2FA enabled flag |
| Settings §1 | avatar | `M` | 1 uppercase char | first char of account name |

**Currency inconsistency to resolve:** the plan card says `A$36` with **no decimals** while invoice
rows say `A$36.00` with **two**. Both are in the design and are internally consistent per-context
(headline vs. ledger). Keep both formats.

## 7.2 Labels (field/section names — all i18n keys)
Wizard: all `PortalLabel` strings in §2.4–2.7; step rail titles/subtitles; step headings and
sub-headings; `← Back`; `Continue`; `Confirm & add child`; `← My children`.
Settings: `Settings`, `Account`, `Language`, `Notifications`, `Password & security`, `Edit`,
`Manage`, all four pref labels.
Notifications: `Notifications`, `Mark all as read`, `Today`, `Earlier`.
Billing: `Billing`, `Family plan`, `Active`, `Change plan`, `Pause`, `Payment method`, `Update`,
`Default`, `Invoices`, `Download all`, `Paid`.

## 7.3 Static copy (never computed)
- `Optional — many students go by one name only.`
- `Optional — schools use this for enrolment paperwork.`
- `The SchoolTest testing band — separate from the school year.`
- `Both are optional. You can add or replace them later from the student's profile.`
- `Drag & drop or click to upload` (×2)
- `JPG or PNG, up to 15MB.` / `MP3 or M4A, up to 2 minutes.`
- `You can change any of this later in the student's profile.`
- `Your account, language and notification preferences`
- `Reports and emails can arrive in your preferred language alongside English.`
- All four notification-pref sub-lines (§4.1 n.1–n.4)
- `unlimited practice & reports` (tail of the plan-card meta)
- `Charged in AUD · cancel anytime · GST included`

---

# ANIMATIONS

Everything below was found by exhaustive grep for `@keyframes`, `animation:` and `transition:`
across both source exports. **The portal export contains exactly two declared transitions and zero
keyframes** (`grep -c "@media\|@keyframes" "Parent Portal.dc.html"` → `0`; `transition:` appears
only at L658–659, which is the settings toggle). The app export contains one keyframe, unused by
any screen in this document.

## A.1 Declared — settings toggle (the only real animation in scope)

`portal--settings.html` L30–31:

| Element | Property | Duration | Easing | Animates |
|---|---|---|---|---|
| Toggle track | `transition: background .2s` | `200ms` | **not specified → CSS default `ease`** | `background` `#D8DFEA` ⇄ `#0E2350` |
| Toggle knob | `transition: left .2s` | `200ms` | **not specified → CSS default `ease`** | `left` `3px` ⇄ `22px` (19px travel) |

Build note: animating `left` forces layout on every frame. Reimplement as
`transform: translateX(0 → 19px)` with `transition: transform .2s ease, background .2s ease` for a
compositor-only equivalent. The visual result is identical.

## A.2 Declared — hover/focus state changes (no duration given)

These are authored as `style-hover` / `style-focus` attributes in the export. **They are not
implemented by `support.js`** (`grep -c "style-hover" support.js` → `0`) — they are declarative
intent. Each one declares the target state but **no transition duration**, so as authored they
snap instantly. Add a shared `transition: <prop> .15s ease` when building.

| Screen | Element | Trigger | Property → value |
|---|---|---|---|
| Wizard L5 | `← My children` back link | hover | `color` → `#2563EB` (from `#7C8698`) |
| Wizard L32,33,36,37,42,51,74,75,78,79 | every `PortalInput` | **focus** | `border-color` → `#2563EB` (from `#D8DFEA`) |
| Wizard L102,111 | `PortalDropzone` | hover | `border-color` → `#2563EB` (from `#C4CEDC`) |
| Wizard L142 | Next button | hover | `background` → `#16326E` (from `#0E2350`) |
| Settings L13,39 | `Edit` / `Manage` ghost buttons | hover | `border-color` → `#0E2350` (from `#D8DFEA`) |
| Billing L20 | `Pause` button | hover | `border-color` → `#fff` (from `rgba(255,255,255,.3)`) |
| Billing L42 | `Download all` | hover | `color` → `#2563EB` (from `#7C8698`) |
| App L20 (`app--add-child`) | modal close button | hover | `background` → `#F1F5F9` |
| App L40,41 (`app--add-child`) | unselected relationship pills | hover | `background` → `#F7F9FC` |
| App L46 (`app--add-child`) | `Cancel` | hover | `background` → `#F7F9FC` |
| App L47 (`app--add-child`) | `Add Oliver` | hover | `background` → `#1D4ED8` (from `#2563EB`) |
| App L24 (`app--onboarding-add-child`) | `Verify` | hover | `background` → `#DBEAFE` (from `#EFF5FF`) |
| App L36 (`app--onboarding-add-child`) | `Link Emma to my account` | hover | `background` → `#1D4ED8` |
| App L4–8 (`app--parent-settings`) | inactive sidebar items | hover | `background` → `#F1F5F9` |
| App L22,31,43,44 (`app--parent-settings`) | secondary buttons | hover | `background` → `#F7F9FC` |
| App L45 (`app--parent-settings`) | `Delete…` | hover | `background` → `#FEF2F2` |
| Global (portal, L16) | `a:hover` | hover | `color` `#0E2350` → `#2563EB` |
| Global (app, L17) | `a:hover` | hover | `color` `#2563EB` → `#1D4ED8` |

## A.3 Declared — keyframes present in the export but NOT used by these screens

`SchoolTest App Screens.dc.html` L20:
```css
@keyframes st-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
```
Applied as `animation: st-shimmer 1.4s linear infinite` on elements with
`background: linear-gradient(90deg,#F1F5F9 25%,#E9EEF6 50%,#F1F5F9 75%); background-size:800px 100%`
(darker pairing for larger blocks: `#E9EEF6 25%, #E3E8F0 50%, #E9EEF6 75%`).
Every usage (L2171–2200) is inside `app--loading-skeleton.html`. **None of the eight screens in
this document uses it.** It is documented here because the add-child wizard, settings, notification
feed and invoice list are all async-loaded surfaces that should reuse this exact shimmer token for
their loading states.

## A.4 NOT present in the design — motion the build must originate

The following have **no** representation in the export and are therefore engineering decisions, not
spec:
- step-to-step transition of the wizard step card (no enter/exit, no slide, no crossfade)
- step-rail dot / connector fill transition when a step completes
- chip select/deselect transition (no `transition` on any `PortalChip`)
- modal / scrim enter & exit (`app--add-child`) and dropdown enter & exit (`app--notifications`)
- notification "mark as read" transition (unread `#0E2350` tile → read `#EEF1F6` tile; dot
  `#2563EB` → `transparent`) — the two states are fully specified, the transition between them is not
- toast / success confirmation after `Confirm & add child`
- file-upload progress in the step-4 dropzones
- focus-visible ring (`--ring: rgba(37,99,235,0.35)` exists in `tokens.css` L47 but is used by
  **nothing** in these screens — the only focus treatment authored is the input `border-color`)

Per the project's UI-polish bar, A.4 must be filled in; A.1–A.3 give the vocabulary
(`200ms`, `ease`, `1.4s linear infinite` for shimmer) to stay consistent with.

---

# RESPONSIVE

Every responsive affordance actually present in the markup:

| Screen | Rule | Effect |
|---|---|---|
| Billing (L8) | `grid-template-columns: repeat(auto-fit, minmax(380px, 1fr))` | 2 columns above ≈`780px` of content width (2×380 + 20 gap), 1 column below. The only container-driven reflow in the set. |
| Wizard (L8) | `grid-template-columns: 230px 1fr` | **fixed** — no fallback. Below ≈`1000px` the step card is crushed. Needs a stacked/horizontal-rail treatment that does not exist in the design. |
| Wizard step card (L26) | `max-width:760px` + `overflow-y:auto` | Card never exceeds 760px; scrolls internally rather than growing the page. |
| Wizard rows (L31,35,40,50,63,73,77,99) | `grid-template-columns:1fr 1fr; gap:16px` | **fixed** — no `auto-fit`. Needs a single-column stack below ≈`640px`. |
| All chip rows (L39,56,65,83 + settings L19) | `display:flex; flex-wrap:wrap` | Chips wrap to multiple lines. This is the wizard's only built-in narrow-width tolerance. |
| Settings + Notifications (L3 both) | `max-width:820px` | Measure-capped single column; already narrow-safe. |
| Billing container (L3) | *no* `max-width` | Full-width. |
| Portal shell | `max-width:1600px; margin:0 auto; height:100vh` | Page caps at 1600px and never scrolls at the page level — `main` owns `overflow-y:auto`. |
| Text blocks (L16 notif, L29 settings, L46 billing) | `flex:1; min-width:0` | Enables truncation/wrapping inside flex rows. |
| Wizard/notif/billing rows | `gap:16px` between text and trailing controls | Keeps trailing badges off the text at narrow widths. |
| App screens | fixed `width:1440px; height:900px` frames | Mock frames, **not** responsive artefacts. Do not treat 1440×900 as a breakpoint. |

**There is not a single `@media` query in either source export**
(`grep -c "@media"` → `0` for both `Parent Portal.dc.html` and `SchoolTest App Screens.dc.html`).
All breakpoints are an engineering decision.

---

# ACCESSIBILITY GAPS IN THE SOURCE (flagged, not invented)

Read directly off the markup — these are facts about the export, and each needs a decision:

- Step rail items are `<div onClick>` (L12), not `<button>` / `role="tab"`. No `aria-current`.
- Settings toggles are `<div onClick>` with a `<span>` knob (L30–31) — no `role="switch"`,
  no `aria-checked`, not focusable.
- Chips are real `<button>` elements (L39, L58, L65, L85, settings L21) but carry no
  `aria-pressed` and are not grouped in a `radiogroup`.
- `Update` (billing L26), `Download all` (billing L42) and the invoice download icon (billing L49)
  are `<span>` / `<svg>` with `cursor:pointer`, not buttons — no keyboard affordance.
- Inputs have no `id`/`for` pairing with their `<label>` anywhere in the export.
- No `<form>` element wraps any step.
- Dropzones (L102, L111) are `<div>`s with no `<input type=file>` behind them.
- `outline:none` is set on every portal input and select with only a `border-color` change on
  focus — this is the sole focus indicator, and it is absent on `<select>` entirely.
- The `--ring` token (`tokens.css` L47) is never applied.

---

## UNKNOWNS

Genuinely undeterminable from the files read. Each needs a product decision before build.

1. **No validation rules exist.** The only validation affordance in the entire wizard is the blue
   `*` on 6 fields (1.1, 1.6, 2.4, 2.5, 3.1, 3.2). There is no error state, no error message
   component, no error border colour, no inline error text style, no field-level `aria-describedby`,
   and `stepNext` (L1045) advances unconditionally. Whether steps gate on validity is unspecified.
2. **Date-of-birth input type.** Rendered as a text input with a `DD/MM/YYYY` placeholder (L36).
   Whether a date picker is intended, and what the min/max age bounds are, is not specified.
3. **`Nationality` option list.** 9 fixed options ending in `Other…` (L41). Whether `Other…` opens
   a free-text field, and whether the real list is the full ISO-3166 set, is not shown.
4. **`Current year level` vs `Test year level`.** Both exist (2.2 = 13 options incl. `Foundation`;
   2.3 = 6 options `7`–`12`). The relationship/derivation between them is described only by the
   help string `The SchoolTest testing band — separate from the school year.`
5. **Step-4 filled states.** No uploaded-photo state, no audio-recorded state, no progress
   indicator, no preview, no replace/remove control. Only the empty dropzone is drawn.
6. **Step-5 media summary strings.** The design shows `Photo added · voice intro skipped`. The
   opposite strings (photo skipped / voice intro added) are not present.
7. **Price inconsistency between wizard and billing.** Wizard step 5 says a third child costs
   `A$9/month` and projects `A$45`; the Billing plan card says `2 children · A$18 each` = `A$36`.
   `36 + 9 = 45` is arithmetically consistent, so the third child is priced at half rate — but no
   pricing rule, tier table or discount logic appears anywhere in the export.
8. **`Edit` (Account) and `Manage` (Password & security) targets.** Both are buttons with no
   declared destination, modal or expanded form.
9. **`Change plan` / `Pause` / `Update` (payment method) destinations.** No plan-picker, pause
   confirmation, or card-update form exists in these slices.
10. **Invoice states other than `Paid`.** The `Paid` pill is a hardcoded literal (billing L48), not
    bound to `inv.status`. Overdue/failed/pending/refunded styling is undefined.
11. **Notification glyph derivation.** The glyphs (`B1`, `!`, `A`, `$`, `5`) are per-item literals
    in `mkNotif` (L987–995). The rule mapping a notification type to its glyph is not stated.
12. **Notification group boundaries.** `Today` / `Earlier` are the only two groups, and membership
    is hardcoded into two arrays (L987, L991). The cutoff rule (midnight? rolling 24h?) is not given.
13. **`Mark all as read` behaviour.** The button (notifications L9) has no `onClick` binding in the
    slice or the script.
14. **Portal Settings has no logout, no delete-account and no billing link.** The app variant
    (`app--parent-settings.html` L45) has `Delete account`; the portal does not. Whether the portal
    intentionally drops it is not determinable.
15. **Dark mode.** `tokens.css` L74–114 defines a complete `.dark` palette, but **none** of the
    eight screens uses a token or a `.dark` selector — every colour is a hardcoded light-mode hex.
    No dark rendering of any of these screens exists in the export.
16. **`style-hover` / `style-focus` implementation.** These attributes appear throughout the export
    but are implemented nowhere in `support.js` or `image-slot.js` (grep count `0` in both). They
    are read here as declarative intent for the hover/focus state; the actual CSS mechanism
    (pseudo-class, data-attribute, JS listener) is an engineering choice.
17. **Portal-local palette has no tokens.** Nine hexes used pervasively in the portal
    (`#3D4A5C`, `#7C8698`, `#9AA6B8`, `#D8DFEA`, `#EEF1F6`, `#E4E9F2`, `#F4F6FA`, `#C4CEDC`,
    `#E9EEF6`) have no entry in `tokens.css`. Whether the portal is meant to adopt the shadcn
    semantic tokens (which would shift every neutral) or to extend the token file with a portal
    scale is undecided. §1.2 proposes names but the design does not.
18. **App vs portal precedence.** Two complete, mutually incompatible designs exist for add-child
    (5-step full-page wizard vs 560px modal with a `Student code` / `Add manually` segmented
    control) and for settings (4 stacked cards vs a 2-column card grid with a Security card).
    The portal version is assumed canonical here because it is the newer, more complete surface —
    but the export contains no directive saying so.
19. **Student-code linking flow is absent from the portal.** The app onboarding screen has a
    `Student code` → `Verify` → match-found → `Link` flow (§3.2). The portal wizard has no
    equivalent — it is manual-entry only. Whether code-linking is dropped or lives elsewhere in the
    portal is not shown.
