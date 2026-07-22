# 06 · Auth, System States & Landing — build spec

Source of truth (all read in full for this document):

| Area | Slice |
|---|---|
| Login | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--login.html` |
| Register | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--register.html` |
| Forgot password | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--forgot-password.html` |
| Loading skeleton | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--loading-skeleton.html` |
| 404 | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--404.html` |
| Empty state | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/app--empty-state.html` |
| Landing sections | `.qa/design/screens/landing--{hero,features,feature-detail,stats,how-it-works,pricing,faq,cta}.html` |
| Landing component library | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--landing-components.html` |
| Footers & page furniture | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--footers.html` |
| Form field states (referenced for error affordance) | `/home/hnr/Code/schooltest/schooltest-web/.qa/design/screens/ds--forms.html` |
| Tokens | `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/tokens.css` |
| Global stylesheet / keyframes | `dashbaord-design/SchoolTest App Screens.dc.html:12-21`, `dashbaord-design/SchoolTest Design System.dc.html:11-25`, `dashbaord-design/SchoolTest Landing.dc.html:11-19` |

Every slice is inline-styled. All numbers below are literal values copied from those files.

---

## 0. Global foundations

### 0.1 Document defaults
From `dashbaord-design/SchoolTest Landing.dc.html:12-18` and `dashbaord-design/SchoolTest App Screens.dc.html:13-19` (identical except `body` background):

```css
@font-face { font-family:'Google Sans'; src:url('fonts/GoogleSans-Variable.ttf') format('truetype');
             font-weight:400 800; font-style:normal; font-display:swap; }
@font-face { font-family:'Google Sans'; src:url('fonts/GoogleSans-Italic-Variable.ttf') format('truetype');
             font-weight:400 800; font-style:italic; font-display:swap; }
body { margin:0; font-family:'Google Sans', -apple-system, 'Segoe UI', system-ui, sans-serif;
       color:#475569; -webkit-font-smoothing:antialiased; }
a       { color:#2563EB; text-decoration:none; }
a:hover { color:#1D4ED8; }
input::placeholder, textarea::placeholder { color:#94A3B8; }
input, textarea, button, select { font-family:inherit; }
```

`body` background differs per document: `#FFFFFF` on the Landing doc (`SchoolTest Landing.dc.html:14`), `#E9EEF6` on the App-Screens canvas doc (`SchoolTest App Screens.dc.html:15`), `#F7F9FC` on the Design-System doc (`SchoolTest Design System.dc.html:14`). The canvas colour `#E9EEF6` is a gallery backdrop, not an app surface; app surfaces are `#F7F9FC`.

**Every unstyled `<a>` in every screen below inherits `#2563EB` (`--primary`) and hovers to `#1D4ED8` (`--blue-700`).** This is the only styling the "Forgot password?", "Create an account", "Sign in", "Terms of Service", "Privacy Policy", "Cookie policy" and "← Back to sign in" links carry beyond their own `font-size`/`font-weight`.

### 0.2 Colour → token map (only colours that appear in this document)

| Hex | tokens.css name(s) | tokens.css line |
|---|---|---|
| `#0A1A3C` | `--navy-950` | 12 |
| `#0E2350` | `--navy-900`, `--foreground`, `--card-foreground`, `--popover-foreground` | 13, 27, 29, 31 |
| `#16326E` | `--navy-800`, `--secondary-foreground`, `--sidebar-accent-foreground` | 14, 34, 62 |
| `#1D4ED8` | `--blue-700`, dark `--chart-4` | 15, 100 |
| `#2563EB` | `--blue-600`, `--primary`, `--chart-1`, `--sidebar-primary` | 16, 32, 52, 59 |
| `#3B82F6` | `--blue-500`, dark `--primary` | 17, 84 |
| `#DBEAFE` | `--blue-100`, dark `--sidebar-accent-foreground` | 18, 116 |
| `#EFF5FF` | `--blue-50`, `--secondary`, `--sidebar-accent` | 19, 33, 61 |
| `#0D9488` | `--teal-600`, dark `--chart-5` | 20, 101 |
| `#14B8A6` | `--teal-500`, `--accent`, `--chart-2` | 21, 35, 53 |
| `#CCFBF1` | `--teal-100` | 22 |
| `#F0FDFA` | `--teal-50` | 23 |
| `#F7F9FC` | `--background` (light) | 26 |
| `#FFFFFF` | `--card`, `--popover`, `--primary-foreground`, `--accent-foreground`, `--sidebar` | 28, 30, 37, 40, 58 |
| `#F1F5F9` | `--muted` | 35 |
| `#64748B` | `--muted-foreground` | 36 |
| `#DC2626` | `--destructive` | 38 |
| `#16A34A` | `--success` | 41 |
| `#E3E8F0` | `--border`, `--sidebar-border` | 45, 64 |
| `#CBD5E1` | `--input` | 46 |
| `#93C5FD` | `--chart-4`, dark `--chart-3` | 55, 99 |
| `#5EEAD4` | `--chart-5` | 56 |
| `#475569` | `--sidebar-foreground` | 60 |
| `#0B1226` | dark `--background` | 76 |
| `#C7D6F2` | dark `--secondary-foreground` | 88 |
| `#1A2A4E` | dark `--secondary`, dark `--sidebar-accent` | 87, 115 |
| `#2DD4BF` | dark `--accent` | 90 |
| `#8FA3C7` | dark `--muted-foreground` | 89 |
| `#A9BADC` | dark `--sidebar-foreground` | 113 |
| `#06251F` | dark `--accent-foreground` | 91 |
| `#223154` | dark `--border`, dark `--sidebar-border` | 96, 117 |
| `#F59E0B` | dark `--warning` | 94 |
| `#EF4444` | dark `--destructive` | 92 |

**Colours used in these screens with NO token in tokens.css** (must be added as extras if a token layer is built):
`#94A3B8` (tertiary/placeholder text — used ~20×), `#EEF2F7` (hairline/soft border on landing cards), `#E9EEF6` (skeleton shimmer highlight + canvas bg), `#BFDBFE` (feature-detail panel border), `#5E729E` (login legal footnote), `#15803D` (app-footer status text), `#4285F4`/`#34A853`/`#FBBC05`/`#EA4335` and `#FFC107`/`#FF3D00`/`#4CAF50`/`#1976D2` (two different Google-logo palettes, see §1.6).

Shadow tokens (tokens.css:68-71):
`--shadow-sm: 0 1px 2px rgba(14,35,80,.06)` · `--shadow-md: 0 2px 8px rgba(14,35,80,.08)` · `--shadow-lg: 0 8px 24px rgba(14,35,80,.12)` · `--shadow-xl: 0 20px 48px rgba(14,35,80,.18)`.
Screen frames all use `--shadow-lg`. Note two deviations that are NOT tokens: the login primary button and the login role-tab active pill use `0 1px 2px rgba(14,35,80,.08)` (shadow-sm geometry, shadow-md alpha) — `app--login.html:22,35`.

Radius: `--radius: 0.625rem` = **10px** (tokens.css:47). Screens use 10px for inputs/buttons, 12–16px for cards, 18–32px for landing surfaces, `999px` for pills.

### 0.3 Screen frame (all six app screens)
Identical wrapper on `app--login.html:1`, `app--register.html:1`, `app--forgot-password.html:1`, `app--loading-skeleton.html:1`, `app--404.html:1`, `app--empty-state.html:1`:

```
width:1440px; height:900px; background:#F7F9FC; border-radius:14px;
overflow:hidden; box-shadow:0 8px 24px rgba(14,35,80,.12);
```

1440×900 is the design viewport, not a production constraint. `border-radius:14px` + the shadow are gallery framing; in the real app the page fills the viewport and the frame radius/shadow are dropped.

---

## 1. AUTH

### 1.1 Login — split layout (`app--login.html`)

**Layout** (`:1`): `display:grid; grid-template-columns:560px 1fr` on the 1440px frame ⇒ left brand panel **560px**, right form panel **880px**.

#### Left brand panel (`:2-14`)
- `background:#0E2350` (`--navy-900`), `padding:56px`, `display:flex; flex-direction:column; justify-content:space-between` — three children pinned top / centre / bottom. Content width = 560 − 112 = **448px**.
- **Logo** (`:3`): `assets/logo.png`, `height:40px`, `align-self:flex-start`, `filter:brightness(0) invert(1)` (renders the dark logo as pure white).
- **Copy block** (`:4-12`): `flex column; gap:20px`.
  - `h1` (`:5`) `font-size:40px; line-height:1.15; font-weight:700; letter-spacing:-0.02em; color:#FFFFFF; margin:0`. Text: `Every test.<br/>Every child.<br/>One place.` (three hard-broken lines).
  - `p` (`:6`) `font-size:16px; line-height:1.6; color:#A9BADC; max-width:360px; margin:0`. Text: "Follow your children's progress, buy tests in seconds, and see results the moment they arrive."
  - **Benefit list** (`:7-11`): `flex column; gap:12px; margin-top:8px`; three rows, each `flex; align-items:center; gap:10px; font-size:14px; color:#C7D6F2`.
    - Bullet marker: `span` `width:22px; height:22px; border-radius:999px; background:#14B8A6 (--accent); display:grid; place-items:center; flex:none`, containing a check `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap/linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`.
    - Items (static copy): "Real-time results for every test" · "All your children under one account" · "Secure payments & instant credits".
- **Legal footnote** (`:13`): `font-size:12.5px; color:#5E729E`, text `© 2026 SchoolTest · Privacy · Terms` (plain text, not links, in the design).

#### Right form panel (`:15-41`)
- Container (`:15`): `display:grid; place-items:center; padding:56px` — the form is centred both axes in the 880×900 column.
- Form column (`:16`): `width:420px; flex column; gap:24px`. Fixed 420px, not fluid.

Children top-to-bottom (gap 24px between each):

1. **Heading block** (`:17-20`) `flex column; gap:8px`
   - `h2` `font-size:28px; font-weight:700; letter-spacing:-0.015em; color:#0E2350` — "Welcome back".
   - `p` `font-size:14.5px; color:#64748B` — "Sign in to your SchoolTest account".
2. **Role segmented control** (`:21-24`) — 2-up switch, **not** a shadcn Tabs bar:
   - Track: `display:grid; grid-template-columns:1fr 1fr; background:#F1F5F9 (--muted); border-radius:10px; padding:4px`.
   - Active segment ("Parent", `:22`): `text-align:center; font-size:13.5px; font-weight:600; color:#0E2350; background:#FFFFFF; border-radius:8px; padding:8px; box-shadow:0 1px 2px rgba(14,35,80,.08)`.
   - Inactive segment ("School", `:23`): same box metrics minus background/shadow/radius, `color:#64748B; padding:8px; cursor:pointer`.
   - States present in design: **active** and **inactive**. Hover/focus for the inactive segment is not specified — see UNKNOWNS.
3. **Field group** (`:25-36`) `flex column; gap:16px`
   - **Email field** (`:26-29`): wrapper `flex column; gap:6px`; `label` `font-size:13.5px; font-weight:600; color:#16326E` = "Email"; `input[type=email]` `border:1px solid #CBD5E1; border-radius:10px; padding:11px 14px; font-size:14.5px; color:#0E2350; background:#fff; outline:none`. Design value `sara.hansen@gmail.com`.
   - **Password field** (`:30-33`): wrapper `flex column; gap:6px`. Label row is `flex; justify-content:space-between; align-items:baseline` holding the "Password" label (same label spec) and an `<a href="#1c">` "Forgot password?" at `font-size:13px; font-weight:600` (colour inherited `#2563EB` → hover `#1D4ED8`). Input identical to email but `type=password`, design value `password123`.
   - **Remember checkbox** (`:34`): `label` `flex; align-items:center; gap:9px; font-size:14px; color:#475569; cursor:pointer`. Box = `span` `width:18px; height:18px; border-radius:5px; background:#2563EB; display:grid; place-items:center` with white check `svg 11×11, stroke-width 3.5`. Text "Keep me signed in". Only the **checked** state is drawn here; the unchecked box is drawn on `app--register.html:32` as `width:18px; height:18px; border-radius:5px; border:1.5px solid #CBD5E1; background:#fff`.
   - **Primary submit** (`:35`): `background:#2563EB; color:#fff; border:none; font-size:15px; font-weight:600; padding:13px; border-radius:10px; cursor:pointer; box-shadow:0 1px 2px rgba(14,35,80,.08)`; full width of the 420px column; **hover `background:#1D4ED8`** (declared via `style-hover`). Label "Sign in".
4. **"or" divider** (`:37`): `flex; align-items:center; gap:14px`; two `span` rules `flex:1; height:1px; background:#E3E8F0`; centre label `font-size:12.5px; color:#94A3B8`, text "or".
5. **Social button — Google** (`:38`): `flex; align-items:center; justify-content:center; gap:10px; background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:14.5px; font-weight:600; padding:12px; border-radius:10px; cursor:pointer`; **hover `background:#F7F9FC`**. Icon = 17×17 four-path Google "G" using the Material palette `#FFC107 / #FF3D00 / #4CAF50 / #1976D2`. Label "Continue with Google". **This is the only social provider in the design.**
6. **Footer link line** (`:39`): `text-align:center; font-size:14px; color:#64748B` — "New to SchoolTest? " + `<a href="#1b" style="font-weight:600">Create an account</a>`.

**Not present on login:** error/alert banner, field-level error text, loading/disabled button state, password-visibility toggle, "remember" unchecked state, captcha. See UNKNOWNS and §1.5 for the reusable error affordance.

### 1.2 Register (`app--register.html`) — centred single column, role picker + form

**Layout** (`:1`): frame is `display:flex; flex-direction:column; align-items:center; padding:48px 0; box-sizing:border-box` — **not** the split layout. Everything is centred on a 560px column.

- **Logo** (`:2`): `assets/logo.png`, `height:36px`, full colour (no invert), at the top of the padded frame.
- **Content column** (`:3`): `margin-top:36px; width:560px; flex column; gap:26px`.

1. **Heading block** (`:4-7`) `flex column; gap:8px; text-align:center`
   - `h2` `font-size:28px; font-weight:700; letter-spacing:-0.015em; color:#0E2350` — "Create your account".
   - `p` `font-size:14.5px; color:#64748B` — "Step 1 of 2 · Tell us who you are" (**progress indicator is copy only — no stepper component**).
2. **Role cards** (`:8-20`): `display:grid; grid-template-columns:1fr 1fr; gap:16px` ⇒ two 272px cards.
   - **Selected card** ("I'm a parent", `:9-14`): `background:#FFFFFF; border:2px solid #2563EB; border-radius:14px; padding:22px; flex column; gap:8px; cursor:pointer; position:relative`.
     - Selection tick (`:10`): absolutely placed `top:14px; right:14px; width:20px; height:20px; border-radius:999px; background:#2563EB; display:grid; place-items:center`, white check `svg 11×11, stroke-width 3.5`.
     - Icon chip (`:11`): `width:40px; height:40px; border-radius:10px; background:#EFF5FF; display:grid; place-items:center`; lucide **users** glyph `20×20, stroke #2563EB, stroke-width 2`.
     - Title `font-size:15.5px; font-weight:700; color:#0E2350` — "I'm a parent".
     - Body `font-size:13px; line-height:1.5; color:#64748B` — "Follow my children, buy tests and see their results".
   - **Unselected card** ("I'm a school", `:15-19`): `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:14px; padding:22px; flex column; gap:8px; cursor:pointer`; **hover `border-color:#CBD5E1`**. No tick. Icon chip `40×40; radius:10px; background:#F0FDFA` with lucide **school** glyph `20×20, stroke #0D9488, stroke-width 2`. Title "I'm a school"; body "Manage students, parents, tests and results".
   - Delta between states: border `1px #E3E8F0` → `2px #2563EB`, plus the tick badge. Note the 1px→2px border change shifts inner content by 1px unless compensated.
3. **Form card** (`:21-34`): `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:28px; flex column; gap:16px; box-shadow:0 1px 2px rgba(14,35,80,.06)` (= `--shadow-sm`).
   - Field label spec everywhere: `font-size:13.5px; font-weight:600; color:#16326E`; field wrapper `flex column; gap:6px`; input `border:1px solid #CBD5E1; border-radius:10px; padding:11px 14px; font-size:14.5px; color:#0E2350; outline:none` (no explicit background — inherits UA white).
   - Row 1 (`:22-25`) `grid 1fr 1fr; gap:14px`: **First name** (value `Sara`) · **Last name** (value `Hansen`).
   - Row 2 (`:26`): **Email**, `type=email`, placeholder `you@example.com`.
   - Row 3 (`:27`): **Mobile phone**, `type=tel`, placeholder `+45 12 34 56 78` (Danish format — implies country default DK).
   - Row 4 (`:28-31`) `grid 1fr 1fr; gap:14px`: **Password** placeholder `8+ characters` · **Confirm password** placeholder `Repeat password`. The "8+ characters" placeholder is the only stated password rule; there is **no strength meter**.
   - **Terms consent** (`:32`): `label` `flex; align-items:flex-start; gap:9px; font-size:13.5px; line-height:1.5; color:#475569; cursor:pointer`. Unchecked box: `width:18px; height:18px; border-radius:5px; border:1.5px solid #CBD5E1; background:#fff; flex:none; margin-top:1px`. Text "I agree to the [Terms of Service] and [Privacy Policy]" with two inline links (inherit `#2563EB`).
   - **Submit** (`:33`): `background:#2563EB; color:#fff; border:none; font-size:15px; font-weight:600; padding:13px; border-radius:10px; cursor:pointer`; hover `#1D4ED8`. Label "Continue → Add your first child" (arrow is a literal `→` character in the label).
4. **Footer link line** (`:35`): `text-align:center; font-size:14px; color:#64748B` — "Already have an account? " + `<a href="#1a" style="font-weight:600">Sign in</a>`.

**Register has no social/Google button** — differs from login.

### 1.3 Forgot password (`app--forgot-password.html`) — two cards, request + confirmation

**Layout** (`:1`): frame `display:grid; place-items:center; position:relative`. Logo (`:2`) is absolutely centred at `top:44px; left:50%; transform:translateX(-50%); height:34px`. The two cards sit in a `flex; gap:32px; align-items:stretch` row (`:3`) — in production these are the **two sequential states of one screen**, shown side-by-side in the design.

#### Card A — request (`:4-13`)
`width:420px; background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:36px; flex column; gap:20px; box-shadow:0 2px 8px rgba(14,35,80,.08)` (= `--shadow-md`).
- Icon chip (`:5`): `44×44; border-radius:12px; background:#EFF5FF; display:grid; place-items:center`; lucide **lock** `21×21, stroke #2563EB, stroke-width 2`.
- `h2` (`:7`) `font-size:24px; font-weight:700; color:#0E2350` — "Reset your password". (No letter-spacing here, unlike login/register h2.)
- `p` (`:8`) `font-size:14.5px; line-height:1.55; color:#64748B` — "Enter the email you use for SchoolTest and we'll send you a reset link."
- **Email field** (`:10`): label `13.5px/600/#16326E` "Email"; input as §1.1 (`1px #CBD5E1`, r10, `11px 14px`, `14.5px`, `#0E2350`), value `sara.hansen@gmail.com`.
- **Primary button** (`:11`): `#2563EB` bg, white, `15px/600`, `padding:13px`, r10; hover `#1D4ED8`. Label "Send reset link".
- **Back link** (`:12`): `text-align:center; font-size:14px; font-weight:600` → "← Back to sign in" (colour inherited `#2563EB`).

#### Card B — confirmation / "email sent" (`:14-23`)
Same box spec as Card A.
- Icon chip (`:15`): `44×44; r12; background:#F0FDFA`; lucide **mail** `21×21, stroke #0D9488, stroke-width 2`.
- `h2` (`:17`) `24px/700/#0E2350` — "Check your inbox".
- `p` (`:18`) `14.5px; line-height:1.55; color:#64748B` — "We sent a reset link to **sara.hansen@gmail.com**. The link expires in 30 minutes." The address is wrapped in `<strong style="color:#0E2350">` (emphasis = colour + UA bold).
- **Success alert** (`:20`): `background:#F0FDFA; border:1px solid #CCFBF1; border-radius:10px; padding:12px 14px; font-size:13.5px; color:#0D9488; flex; gap:9px; align-items:center`; check icon `15×15, stroke currentColor, stroke-width 2.4`. Text "Email sent successfully". This is the **teal/success-info alert pattern** used for positive confirmations on auth surfaces.
- **Secondary button with cooldown** (`:21`): `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:14.5px; font-weight:600; padding:12px; border-radius:10px; cursor:pointer`; hover `background:#F7F9FC`. Label "Resend email (0:42)" — a live `m:ss` countdown baked into the label. Design does not show the post-cooldown enabled label; see UNKNOWNS.
- **Back link** (`:22`): identical to Card A.

### 1.4 Compact auth card (alternate) — `ds--footers.html:88-101`
A second, narrower sign-in surface exists in the design system ("page furniture" group). Use it for modal/inline auth; it differs from `app--login.html` and both must not be mixed.

- Card: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:32px; box-shadow:0 8px 24px rgba(14,35,80,.08)` (shadow-lg geometry with .08 alpha — not a token).
- Logo `height:26px` (`:89`).
- Title (`:90`) `font-size:20px; font-weight:700; color:#0E2350; margin-top:20px` — "Welcome back".
- Subtitle (`:91`) `font-size:13.5px; color:#64748B; margin-top:4px` — "Sign in to your **teacher** account" (teacher wording, vs "your SchoolTest account" on the parent login).
- **Google button first** (`:92`): full width, `flex; align-items:center; justify-content:center; gap:9px; background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1; font-size:13.5px; font-weight:600; padding:10px; border-radius:10px; margin-top:20px`; hover `#F7F9FC`. Icon 15×15 using the **brand-G palette** `#4285F4 / #34A853 / #FBBC05 / #EA4335` (different artwork from login's `#FFC107…` set).
- Divider (`:93`): `flex; gap:12px; margin:18px 0`; rules `flex:1; height:1px; background:#EEF2F7`; label `font-size:12px; color:#94A3B8` "or".
- Inputs (`:95-96`): `flex column; gap:12px`; each `width:100%; box-sizing:border-box; padding:10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF; outline:none; transition:border-color .15s, box-shadow .15s`, **focus `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)`**. Placeholders `you@school.edu`, `Password`. No labels — placeholder-only.
- Forgot link row (`:98`): `flex; justify-content:flex-end; margin-top:10px`; link `font-size:12.5px; font-weight:600`.
- Submit (`:99`): full width `#2563EB`, `14px/600`, `padding:11px`, r10, `margin-top:14px`; hover `#1D4ED8`; label "Sign in".
- Footer (`:100`): `font-size:13px; color:#64748B; text-align:center; margin-top:16px` — "New to SchoolTest? [Create an account]".

**This compact card is the only place in the auth set that declares an input `:focus` ring.** Adopt `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` (≈ `--ring: rgba(37,99,235,.35)` at lower alpha) as the focus treatment for the full-page auth inputs too — the full-page inputs only declare `outline:none`.

### 1.5 Form field — canonical states & error affordance (`ds--forms.html:6-20`)
The auth screens draw only the default state. The complete field state set lives in the Forms slice and is what auth must reuse:

| State | Spec | Source |
|---|---|---|
| Default | `padding:10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF; outline:none; transition:border-color .15s, box-shadow .15s` | `ds--forms.html:8` |
| Focus | `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` | `ds--forms.html:8` (`style-focus`) |
| **Error** | `border:1px solid #DC2626; box-shadow:0 0 0 3px rgba(220,38,38,.10)` (no transition declared on the error variant) | `ds--forms.html:13` |
| Error label | `font-size:13.5px; font-weight:600; color:#0E2350` + required marker `<span style="color:#DC2626">*</span>` | `ds--forms.html:12` |
| Error message | `inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:500; color:#DC2626`, leading 13×13 alert-circle icon (`stroke:currentColor; stroke-width:2.2`). Example copy: "Enter a valid email address." | `ds--forms.html:14` |
| Disabled | `border:1px solid #E3E8F0; color:#94A3B8; background:#F1F5F9; cursor:not-allowed`; label greyed to `#94A3B8` | `ds--forms.html:17-18` |
| Help text | `font-size:12.5px; color:#94A3B8` | `ds--forms.html:9` |

Field wrapper in the Forms slice is `flex column; gap:7px` (auth screens use `gap:6px`).

### 1.6 Auth screen inventory — layout comparison

| | Login | Register | Forgot password | Compact card |
|---|---|---|---|---|
| Frame layout | grid `560px 1fr` | column, centred, `padding:48px 0` | grid `place-items:center` | free-standing card |
| Content width | 420px form / 448px brand copy | 560px | 420px per card | fluid card, `padding:32px` |
| Logo | 40px, inverted white, top-left of navy panel | 36px, full colour, top-centre | 34px, absolute top-centre (`top:44px`) | 26px, top-left of card |
| Social auth | Google (Material palette) | none | none | Google (brand-G palette), placed **above** the fields |
| Labels | visible labels | visible labels | visible label | placeholder-only |
| Role switch | segmented 2-up (Parent/School) | 2 role cards (parent/school) | — | — |

---

## 2. LOADING SKELETON SYSTEM (`app--loading-skeleton.html`)

### 2.1 Shimmer primitive
Keyframe (declared once, globally — `dashbaord-design/SchoolTest App Screens.dc.html:20`, mirrored at `SchoolTest Design System.dc.html:23`):

```css
@keyframes st-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
```

Two shimmer paints exist. Both are applied as:
`background-size:800px 100%; animation: st-shimmer 1.4s linear infinite;`

| Variant | Gradient | Where |
|---|---|---|
| **Light** (on white cards / sidebar / header) | `linear-gradient(90deg,#F1F5F9 25%,#E9EEF6 50%,#F1F5F9 75%)` | `:4-7`, `:11-12`, `:21-22`, `:24-26`, `:30-33` |
| **Dark** (page-title block on the `#F7F9FC` page background) | `linear-gradient(90deg,#E9EEF6 25%,#E3E8F0 50%,#E9EEF6 75%)` | `:16-17` |

Rule: the shimmer base must be one step darker than the surface it sits on — `#F1F5F9`→`#E9EEF6` on `#FFFFFF`, `#E9EEF6`→`#E3E8F0` on `#F7F9FC`.

The 800px background-size against a −400px→+400px sweep means the highlight crosses any element in exactly one 1.4s cycle regardless of element width; wide elements therefore appear to shimmer "slower" per pixel. Keep `800px 100%` verbatim.

### 2.2 Skeleton page structure (`:1`)
`display:grid; grid-template-columns:248px 1fr` — the standard app shell (sidebar 248px, content 1192px).

**Sidebar skeleton** (`:2-8`): `background:#FFFFFF; border-right:1px solid #E3E8F0; flex column; padding:24px 16px; gap:14px; box-sizing:border-box`.
- Real logo is kept (`:3`) — `height:30px; align-self:flex-start; margin:0 8px 14px`. **The logo never skeletonises.**
- 4 × nav placeholders: `height:36px; border-radius:10px`, light shimmer. (The real nav has 6 items — `app--empty-state.html:4-9` — so the skeleton deliberately under-fills.)

**Header skeleton** (`:10-13`): `background:#FFFFFF; border-bottom:1px solid #E3E8F0; padding:0 32px; height:64px; flex; align-items:center; justify-content:flex-end; gap:14px; flex:none`.
- Credits pill placeholder: `width:110px; height:30px; border-radius:999px`, light shimmer.
- Avatar placeholder: `38×38; border-radius:999px`, light shimmer.

**Main skeleton** (`:14-35`): `padding:28px 32px; flex column; gap:22px`.
1. **Page-title block** (`:15-18`) `flex column; gap:10px`: title bar `width:320px; height:28px; border-radius:8px` (dark shimmer) + subtitle bar `width:420px; height:16px; border-radius:6px` (dark shimmer).
2. **Two child cards** (`:19-28`) `grid 1fr 1fr; gap:18px`. Each card is a **real** card chrome — `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:22px; flex column; gap:14px` — with skeletons inside:
   - Identity row `flex; align-items:center; gap:14px`: avatar `52×52; border-radius:999px; flex:none` + text stack `flex:1; flex column; gap:8px` of `width:60%; height:16px; r6` and `width:40%; height:13px; r6` (second card uses **55%** and **35%** — deliberate irregularity so the two cards don't look cloned; `:21` vs `:25`).
   - Metric row `grid repeat(3,1fr); gap:12px` of three `height:66px; border-radius:12px` blocks.
3. **List card** (`:29-34`): real card chrome (`#FFFFFF`, `1px #E3E8F0`, r16, `padding:22px`, `flex column; gap:14px`) containing a section-title bar `width:180px; height:18px; r6` and 3 × row bars `height:44px; border-radius:10px`.

### 2.3 Skeleton shape catalogue (reusable primitives)

| Shape | Size | Radius | Represents |
|---|---|---|---|
| Nav item | `h 36px`, full width | 10px | sidebar link |
| Header pill | `110×30` | 999px | credits badge |
| Avatar sm | `38×38` | 999px | header avatar |
| Avatar lg | `52×52` | 999px | child avatar |
| Page title | `320×28` | 8px | `h1` |
| Page subtitle | `420×16` | 6px | lead paragraph |
| Card title | `180×18` | 6px | section heading |
| Text line (primary) | `60%/55% × 16` | 6px | name |
| Text line (secondary) | `40%/35% × 13` | 6px | meta |
| Metric tile | `h 66px` (1/3 col) | 12px | stat tile |
| List row | `h 44px`, full width | 10px | table/list row |

All shapes are `<span>` elements — no text, no aria. Add `aria-hidden="true"` + a visually-hidden "Loading" live region when rebuilding (not in the design; see UNKNOWNS).

---

## 3. 404

### 3.1 Full-page 404 (`app--404.html`)
Frame `display:grid; place-items:center; position:relative`; logo absolutely centred `top:44px; left:50%; translateX(-50%); height:34px` (`:2`).

Content column (`:3`): `flex column; align-items:center; gap:22px; text-align:center; max-width:520px`.

1. **Numeral + badge composite** (`:4`):
   - `span` `font-size:110px; font-weight:700; letter-spacing:-0.04em; line-height:1; color:#DBEAFE (--blue-100); position:relative`, text `404`.
   - Nested badge, absolutely positioned `bottom:14px; left:50%; transform:translateX(-50%)`: `width:64px; height:64px; border-radius:18px; background:#0E2350; display:grid; place-items:center; box-shadow:0 8px 24px rgba(14,35,80,.25)` (shadow-lg geometry at .25 alpha). Inside: a **search-minus** glyph `30×30, stroke #2DD4BF, stroke-width 2` (`circle cx=11 cy=11 r=8`, `m21 21-4.3-4.3`, `M8 11h6`). The badge overlaps the middle "0", reading as the zero.
2. **Copy block** (`:5-8`) `flex column; gap:8px`
   - `h1` `font-size:28px; font-weight:700; letter-spacing:-0.015em; color:#0E2350` — "This page skipped class".
   - `p` `font-size:15px; line-height:1.6; color:#64748B` — "The page you're looking for doesn't exist or was moved. Check the address, or head back to your dashboard."
3. **Action row** (`:9-12`) `flex; gap:12px`; both are `<a>` styled as buttons, `font-size:14.5px; font-weight:600; padding:12px 24px; border-radius:10px`:
   - Primary "Go to dashboard": `background:#2563EB; color:#fff`; hover `background:#1D4ED8; color:#fff` (colour restated so the global `a:hover` doesn't win).
   - Secondary "Contact support": `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1`; hover `background:#F7F9FC; color:#16326E`.

### 3.2 Compact 404 card (`ds--footers.html:78-86`)
For in-shell / embedded 404s.
- Card `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:36px; flex column; align-items:center; text-align:center`.
- Numeral (`:79`): `font-size:64px; font-weight:700; letter-spacing:-0.04em; color:#0E2350; line-height:1; display:flex; align-items:center; gap:12px` composed as `4` + `<img src="assets/logo-mark.png" alt="0" style="height:52px">` + `4` — **the logo mark substitutes for the zero** (with `alt="0"`).
- Title `font-size:16px; font-weight:600; color:#0E2350; margin-top:16px` — "This page hopped away".
- Body `font-size:13.5px; color:#64748B; margin-top:5px; max-width:300px` — "The link may be broken, or the test may have been deleted."
- Actions `flex; gap:10px; margin-top:18px`: primary `#2563EB` white `13.5px/600; padding:9px 17px; r9`, hover `#1D4ED8`, label "Back to dashboard"; secondary white / `1px #CBD5E1` / `#16326E`, `padding:8px 16px; r9`, hover `#F7F9FC`, label "Report a problem".

Note the two 404s use different copy, different numeral treatments, different radii (10px vs 9px buttons) and different secondary CTAs ("Contact support" vs "Report a problem"). Pick one per context; do not merge.

---

## 4. EMPTY STATE (`app--empty-state.html`)

This is a **full app shell with an empty main region**, not a bare card — the chrome stays, the content is replaced.

**Shell** (`:1`): `grid 248px 1fr`.

**Sidebar** (`:2-10`): `background:#FFFFFF; border-right:1px solid #E3E8F0; flex column; padding:24px 16px; gap:6px; box-sizing:border-box`. Logo `height:30px; align-self:flex-start; margin:0 8px 22px`.
- Active item (`:4`) "Overview": `flex; align-items:center; gap:11px; font-size:14px; font-weight:600; color:#2563EB; background:#EFF5FF; border-radius:10px; padding:10px 12px`.
- Inactive items (`:5-9`) "My children", "Buy tests", "Results", "Billing", "Settings": same box, `font-weight:500; color:#475569; cursor:pointer`, **hover `background:#F1F5F9`**.

**Header** (`:12-15`): `background:#FFFFFF; border-bottom:1px solid #E3E8F0; padding:0 32px; height:64px; flex; align-items:center; justify-content:flex-end; gap:16px; flex:none`.
- Credits badge (`:13`): `inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:700; color:#16326E; background:#EFF5FF; padding:7px 13px; border-radius:999px` — text **"0 credits"**.
- Avatar (`:14`): `38×38; border-radius:999px; background:#DBEAFE; color:#1D4ED8; display:grid; place-items:center; font-size:14px; font-weight:700` — initials **"SH"**.

**Main** (`:16`): `flex:1; display:grid; place-items:center; padding:40px`. Content column (`:17`) `width:560px; flex column; align-items:center; gap:22px; text-align:center`.

1. **Illustration chip** (`:18`): `96×96; border-radius:999px; background:#EFF5FF; display:grid; place-items:center`; lucide **user-plus** `42×42, stroke #2563EB, stroke-width 1.8` (note the lighter 1.8 stroke at large size).
2. **Copy** (`:19-22`) `flex column; gap:8px`
   - `h1` `font-size:27px; font-weight:700; letter-spacing:-0.015em; color:#0E2350` — "No children linked yet".
   - `p` `font-size:15px; line-height:1.6; color:#64748B` — "Link your first child to start buying tests and following their results. If their school uses SchoolTest, you received a student code by email."
3. **Inline action card** (`:23-26`): `width:100%; background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:22px; display:flex; gap:10px; box-sizing:border-box; box-shadow:0 1px 2px rgba(14,35,80,.06)`.
   - Input `flex:1; border:1px solid #CBD5E1; border-radius:10px; padding:12px 14px; font-size:14.5px; color:#0E2350; outline:none`, placeholder **"Enter student code, e.g. NH-4823-EM"** (code format: 2 letters – 4 digits – 2 letters, uppercase, hyphen-separated).
   - Button `background:#2563EB; color:#fff; border:none; font-size:14px; font-weight:600; padding:12px 20px; border-radius:10px`; hover `#1D4ED8`; label "Link child".
4. **Divider** (`:27`): `flex; align-items:center; gap:14px; width:100%`; rules `flex:1; height:1px; background:#E3E8F0`; label `12.5px; #94A3B8` "or".
5. **Escape-hatch link** (`:28`): `font-size:14px; font-weight:600` — "Add a child manually →" (inherits `#2563EB`).

**Empty-state pattern (generalised):** 96px circular `#EFF5FF` icon chip (`--blue-50`) → 27px/700 navy headline → 15px/1.6 `#64748B` explanation (≤ 2 sentences, second sentence tells the user where to find the missing input) → **primary inline action inside a white card** → "or" divider → secondary text link. Column is 560px, centred in the content region, `gap:22px`.

---

## 5. LANDING PAGE

Section order in the source page `dashbaord-design/SchoolTest Landing.dc.html`: **announcement bar (23-28) → nav (31-45) → hero (48-…) → features → feature detail → stats → how-it-works + testimonial → pricing (198-238, behind `showPricing`) → FAQ (241-258) → CTA → footer (…-320)**.

Two page-level booleans exist as component props (`SchoolTest Landing.dc.html:322`): `showAnnouncement` (default `true`) and `showPricing` (default `true`), both `boolean`, section "Sections". Build them as feature flags.

### 5.0 Announcement bar (`SchoolTest Landing.dc.html:23-28`) — above the nav
`background:#0E2350; padding:10px 24px; display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap`.
- Text `font-size:13px; color:#A9BADC` — "New: AI speaking feedback is now available on every plan".
- Link `font-size:13px; font-weight:600; color:#5EEAD4` — "Learn more →".
- DS variant (`ds--landing-components.html:5-8`) is the same bar boxed as a card: `border-radius:12px; padding:11px 20px`, copy "…is now available for all plans", link colour `#5EEAD4`, `text-decoration:none`.

### 5.1 Nav (`SchoolTest Landing.dc.html:31-45`)
`position:sticky; top:0; z-index:50; background:rgba(255,255,255,.88); backdrop-filter:blur(12px); border-bottom:1px solid #EEF2F7`.
Inner `max-width:1200px; margin:0 auto; padding:14px 32px; display:flex; align-items:center; gap:28px`.
- Logo `height:30px; width:auto`.
- `nav` `display:flex; gap:4px`; links `font-size:14px; font-weight:500; color:#475569; padding:8px 14px; border-radius:9px`; **hover `background:#F1F5F9; color:#0E2350`**. Items: Product · For schools · Pricing · Resources.
- Right cluster `margin-left:auto; flex; align-items:center; gap:10px`:
  - "Sign in" link `font-size:14px; font-weight:600; color:#16326E; padding:9px 16px; border-radius:10px`; hover `background:#F1F5F9`.
  - "Start free" button `inline-flex; align-items:center; gap:8px; background:#2563EB; color:#FFFFFF; border:none; font-size:14px; font-weight:600; padding:10px 18px; border-radius:10px; box-shadow:0 4px 12px rgba(37,99,235,.25)`; hover `#1D4ED8`.

### 5.2 Hero (`landing--hero.html`)
Section background `linear-gradient(#FFFFFF,#F7F9FC)`, `overflow:hidden` (`:1`).

**5.2.1 Hero media card** (`:2-20`)
- Outer container `max-width:1360px; margin:20px auto 0; padding:0 20px`.
- Card `position:relative; border-radius:32px; overflow:hidden; box-shadow:0 30px 70px rgba(14,35,80,.22); background:#0E2350`.
- **Background image slot** (`:4`): `<x-import component-from-global-scope="image-slot" from="./image-slot.js" id="hero-field" shape="rect" fit="cover" placeholder=" " hint-size="100%,600px" style="position:absolute;inset:0;width:100%;height:100%">`. In production = a full-bleed `object-fit:cover` photo, intrinsic slot 100% × 600px. Navy `#0E2350` is the fallback behind it.
- **Scrim** (`:5`): `position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg, rgba(10,26,60,.55) 0%, rgba(10,26,60,.18) 45%, rgba(10,26,60,.42) 88%, rgba(10,26,60,.10) 100%)` — four stops, `rgba(10,26,60,…)` = `--navy-950` at varying alpha.
- **Editor-only hint chip** (`:6`): `top:18px; right:20px; z-index:3; font-size:12px; font-weight:600; color:#FFFFFF; background:rgba(10,26,60,.45); border:1px dashed rgba(255,255,255,.4); backdrop-filter:blur(6px); padding:6px 13px; border-radius:999px; pointer-events:none`, text "Drop a photo here — e.g. a sunny grass field". **Design-tool affordance — do NOT ship.**
- **Content stack** (`:7`): `position:relative; z-index:2; flex column; align-items:center; justify-content:center; text-align:center; min-height:600px; padding:72px 32px; pointer-events:none` (buttons re-enable pointer events).
  - **Eyebrow pill** (`:8-10`): `inline-flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:#FFFFFF; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.25); backdrop-filter:blur(8px); padding:7px 17px; border-radius:999px`, leading `7×7` dot `border-radius:50%; background:#2DD4BF`. Text "Trusted by 1,200+ schools and language centers".
  - **H1** (`:11`): `margin:28px auto 0; max-width:780px; font-size:68px; line-height:1.03; font-weight:700; letter-spacing:-0.032em; color:#FFFFFF; text-wrap:balance; text-shadow:0 2px 24px rgba(10,26,60,.35)`. Text "Smarter tests.<br />Better results."
  - **Lead** (`:12`): `margin:22px auto 0; max-width:520px; font-size:18px; line-height:1.6; color:rgba(255,255,255,.88); text-wrap:pretty; text-shadow:0 1px 12px rgba(10,26,60,.4)`. Text "Build language tests in minutes, deliver them with one link, and let AI draft the grading — you stay in control."
  - **CTA row** (`:13-16`): `flex; justify-content:center; gap:12px; margin-top:34px; pointer-events:auto`.
    - Primary "Start free trial": `inline-flex; align-items:center; gap:9px; background:#2563EB; color:#FFFFFF; border:none; font-size:15.5px; font-weight:600; padding:14px 28px; border-radius:12px; box-shadow:0 8px 24px rgba(10,26,60,.35)`; hover `#1D4ED8`; trailing arrow `15×15, stroke currentColor, stroke-width 2.4`.
    - Secondary "Watch demo": `background:rgba(255,255,255,.92); color:#0E2350; border:none; font-size:15.5px; font-weight:600; padding:14px 27px; border-radius:12px; backdrop-filter:blur(8px)`; hover `background:#FFFFFF`; leading filled play triangle `14×14, fill currentColor, margin-left:1px`. (Padding is 27px not 28px — compensates for the absent border.)
  - **Reassurance line** (`:17`): `font-size:13px; color:rgba(255,255,255,.75); margin-top:16px` — "Free for up to 30 students · No credit card required".

**5.2.2 Value-proposition strip** (`:22-31`)
- Container `max-width:900px; margin:96px auto 0; padding:0 32px; text-align:center`.
- `h2` (`:23`) `max-width:680px; font-size:34px; line-height:1.25; font-weight:700; letter-spacing:-0.02em; color:#0E2350; text-wrap:balance`, with two inline colour spans: "Students answer. **<span #2563EB>AI drafts the grade.</span>** You approve and release — **<span #0D9488>the same day.</span>**"
- **3-step row** (`:24-30`): `flex; align-items:center; justify-content:center; gap:36px; margin-top:40px; flex-wrap:wrap`. Each step = `flex; align-items:center; gap:10px` of a numbered disc `inline-grid; place-items:center; width:34px; height:34px; border-radius:50%; background:#EFF5FF; color:#2563EB; font-size:14px; font-weight:700` + label `font-size:14.5px; font-weight:600; color:#0E2350`. Steps: "1 Create & share a link", "2 AI drafts scores", "3 You release results". Between steps: arrow `svg 20×20, stroke #CBD5E1, stroke-width 2.2`.

**5.2.3 Logo wall** (`:33-40`)
`max-width:1200px; margin:0 auto; padding:72px 32px; flex; align-items:center; justify-content:center; gap:44px; flex-wrap:wrap`.
- Eyebrow `font-size:12px; font-weight:600; color:#94A3B8; letter-spacing:.06em` — "TRUSTED BY".
- Five wordmarks, each `font-size:16px; font-weight:700; color:#CBD5E1`: Northfield Academy · LinguaLab · Prep&Go · EduCore · Wexford Schools (text stand-ins for real logos).

### 5.3 Features (`landing--features.html`)
Section `background:#FFFFFF`; container `max-width:1200px; margin:0 auto; padding:88px 32px 0` (`:1-2`).
- **Eyebrow** (`:4`): `font-size:12.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#2563EB` — "Everything in one place".
- **H2** (`:5`): `margin:14px auto 0; max-width:560px; font-size:40px; line-height:1.12; font-weight:700; letter-spacing:-0.025em; color:#0E2350; text-wrap:balance` — "From first question to final grade".
- **Grid** (`:7`): `grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; margin-top:48px` ⇒ 3 × 365.33px inside the 1136px content box.

| Card | Surface | Icon chip | Title (18px/700) | Body (14.5px/1.6) |
|---|---|---|---|---|
| 1 (`:8-12`) | `background:#F7F9FC; border:1px solid #EEF2F7; border-radius:20px; padding:30px` | `46×46; r14; background:#EFF5FF`; file-text glyph `20×20 stroke #2563EB sw2` | `#0E2350` "20 question types" | `#64748B` "Multiple choice, drag-and-drop, dictation, speaking, essays — every PTE-style task, ready to use." |
| 2 — highlighted (`:13-17`) | `background:#0E2350; border-radius:20px; padding:30px` (no border) | `46×46; r14; background:#16326E`; sparkles glyph `20×20 stroke #5EEAD4 sw2` | `#FFFFFF` "AI grading & feedback" | `#A9BADC` "Speaking and writing scored in seconds against your rubric. You review, adjust, and release." |
| 3 (`:18-22`) | same as card 1 | `46×46; r14; background:#F0FDFA`; bar-chart glyph `20×20 stroke #0D9488 sw2` | `#0E2350` "Per-skill analytics" | `#64748B` "Listening, reading, writing, speaking — see exactly where each student and class stands." |

- Icon chip is `inline-grid; place-items:center`. Title `margin-top:18px`; body `margin-top:8px`.
- **Hover (all three)**: `transition:box-shadow .2s, transform .2s`; light cards → `box-shadow:0 16px 40px rgba(14,35,80,.10); transform:translateY(-3px)`; navy card → `box-shadow:0 16px 40px rgba(14,35,80,.28); transform:translateY(-3px)`.

### 5.4 Feature detail (`landing--feature-detail.html`)
Section `background:#FFFFFF`; container `max-width:1200px; padding:88px 32px 0; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.1fr); gap:56px; align-items:center` (`:2`) ⇒ text col ≈ 514px, panel col ≈ 566px.

**Left column** (`:3-12`)
- Eyebrow `12.5px/700; letter-spacing:.1em; uppercase; color:#0D9488` — "AI feedback students actually read" (teal here vs blue in Features).
- `h3` `margin:14px 0 0; font-size:32px; line-height:1.18; font-weight:700; letter-spacing:-0.02em; color:#0E2350; text-wrap:balance` — "Grading that used to take a weekend now takes a coffee break".
- `p` `margin:16px 0 0; font-size:15.5px; line-height:1.65; color:#64748B; text-wrap:pretty` — "Every speaking and writing answer gets a rubric score and a concrete suggestion. Teachers approve each one before students see it."
- Check list `flex column; gap:12px; margin-top:22px`; each row `flex; align-items:center; gap:10px; font-size:14.5px; color:#0E2350` with check `svg 16×16, stroke #16A34A (--success), stroke-width 2.6`. Items: "Grammar, vocabulary, and coherence scores" · "One-click \"apply suggestion\" for students" · "Teacher review before anything is released".

**Right panel — AI writing feedback mock** (`:13-27`)
- Panel: `background:linear-gradient(135deg,#EFF5FF 0%,#F0FDFA 100%); border:1px solid #BFDBFE; border-radius:24px; padding:28px`.
- Header row (`:14-18`) `flex; align-items:center; gap:10px`: navy glyph tile `32×32; border-radius:10px; background:#0E2350` with sparkle `16×16 stroke #5EEAD4 sw2`; title `font-size:15px; font-weight:700; color:#0E2350` "AI writing feedback"; **BETA badge** `font-size:11px; font-weight:700; letter-spacing:.05em; color:#0D9488; background:#CCFBF1; padding:3px 8px; border-radius:999px; margin-left:auto`.
- **Score tiles** (`:19-23`) `grid repeat(3,minmax(0,1fr)); gap:12px; margin-top:16px`. Each tile `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:12px; padding:13px 14px`:
  - label `font-size:12px; color:#64748B`
  - value `font-size:20px; font-weight:700; color:#0E2350; margin-top:2px`
  - meter track `margin-top:7px; height:5px; border-radius:999px; background:#EEF2F7`; fill `height:100%; border-radius:999px` with per-tile width & colour.

| Tile | Label | Value | Fill width | Fill colour |
|---|---|---|---|---|
| 1 | Grammar | `8.5` | `85%` | `#2563EB` (`--chart-1`) |
| 2 | Vocabulary | `7.0` | `70%` | `#14B8A6` (`--chart-2`) |
| 3 | Coherence | `6.5` | `65%` | `#0E2350` (`--chart-3`) |

  Format: one decimal on a 0–10 scale; bar width = `value × 10 %`.
- **Suggestion card** (`:24-26`): `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:12px; padding:14px 15px; margin-top:12px`; text `font-size:13px; line-height:1.6; color:#475569` — `Try linking your second and third paragraphs — <span style="font-weight:600;color:#0E2350;background:#CCFBF1;padding:1px 6px;border-radius:5px">"on the other hand"</span> would make the contrast clearer.` The highlighted-token style (`#CCFBF1` chip, r5) is the "AI suggestion" inline marker.

### 5.5 Stats band (`landing--stats.html`)
`section max-width:1200px; margin:88px auto 0; padding:0 32px` (`:1`).
Band (`:2`): `background:#0E2350; border-radius:28px; padding:56px 40px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:32px; text-align:center; position:relative; overflow:hidden`.
Watermark (`:3`): `assets/logo-mark.png`, `position:absolute; right:-40px; bottom:-46px; height:220px; opacity:.10; filter:brightness(0) invert(1)`.
Each stat: value `font-size:48px; font-weight:700; letter-spacing:-0.03em` + label `font-size:14px; color:#8FA3C7; margin-top:6px`.

| Value | Colour | Label |
|---|---|---|
| `2.4M` | `#FFFFFF` | tests delivered |
| `98%` | `#5EEAD4` (`--chart-5`) | grading accuracy |
| `6 hrs` | `#93C5FD` (`--chart-4`) | saved per teacher, weekly |

### 5.6 How it works + testimonial (`landing--how-it-works.html`)
`section max-width:1200px; margin:0 auto; padding:88px 32px 0`; inner `grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); gap:20px; align-items:stretch` (`:2`).

**Left — steps card** (`:3-19`): `background:#F7F9FC; border:1px solid #EEF2F7; border-radius:24px; padding:36px`.
- Eyebrow `12.5px/700; letter-spacing:.1em; uppercase; color:#2563EB` — "How it works".
- Steps list `flex column; gap:26px; margin-top:26px`; each row `flex; gap:18px; align-items:flex-start`:
  - Number tile `inline-grid; place-items:center; width:36px; height:36px; border-radius:11px; background:#2563EB; color:#fff; font-size:15px; font-weight:700; flex:none`.
  - Title `font-size:16.5px; font-weight:700; color:#0E2350`; body `font-size:14px; line-height:1.6; color:#64748B; margin-top:4px`.
  - 1 "Create your test" — "Pick from 20 question types or start with a template. Import existing questions from CSV or DOCX."
  - 2 "Share one link" — "Students join with their name — no accounts, no installs. Works on any device."
  - 3 "Review & release results" — "AI drafts scores and feedback as students finish. Approve, adjust, and send — same day."

**Right — testimonial card** (`:20-35`): `background:#FFFFFF; border:1px solid #EEF2F7; border-radius:24px; padding:36px; flex column; justify-content:space-between; box-shadow:0 2px 8px rgba(14,35,80,.05)`.
- Star row `flex; gap:2px`: 5 × `svg 16×16 viewBox 0 0 24 24 fill="#F59E0B"` (solid star path). Rating is hard-coded 5/5 — no half-star artwork exists.
- Quote `font-size:19px; line-height:1.55; color:#0E2350; margin-top:18px; text-wrap:pretty` — "I stopped spending Sundays grading. The AI drafts the feedback, I approve it, and my students get results the same day."
- Attribution `flex; align-items:center; gap:12px; margin-top:24px`: initials avatar `inline-grid; place-items:center; width:44px; height:44px; border-radius:50%; background:#14B8A6; color:#fff; font-size:14px; font-weight:700` = "LP"; name `font-size:14.5px; font-weight:600; color:#0E2350` "Lena Petrova"; role `font-size:13px; color:#94A3B8` "English teacher, Lyceum 14".

### 5.7 Pricing (`landing--pricing.html`) — wrapped in `sc-if showPricing`
`section max-width:1200px; margin:0 auto; padding:88px 32px 0`.
- Eyebrow `12.5px/700; .1em; uppercase; #2563EB` — "Pricing"; `h2` `margin:14px auto 0; font-size:40px; line-height:1.12; font-weight:700; letter-spacing:-0.025em; color:#0E2350` — "Start free, grow when you're ready".
- Grid (`:6`): `repeat(3,minmax(0,1fr)); gap:20px; margin-top:48px; align-items:stretch`.

Common card anatomy: plan name `font-size:15px; font-weight:700` → price row `flex; align-items:baseline; gap:5px; margin-top:12px` (amount `font-size:40px; font-weight:700; letter-spacing:-0.02em`, period `font-size:13.5px`) → feature list `flex column; gap:10px; margin-top:20px; font-size:14px; flex:1` (each `flex; align-items:center; gap:9px`, icon `14×14 stroke-width 2.6`) → CTA `margin-top:24px; width:100%; font-size:14px; font-weight:600; border-radius:11px`.

| | **Free** (`:7-16`) | **Pro** (`:17-27`) | **School** (`:28-37`) |
|---|---|---|---|
| Card | `#FFFFFF`, `1px #E3E8F0`, r20, `padding:30px` | `#0E2350`, no border, r20, `padding:30px`, `box-shadow:0 24px 56px rgba(14,35,80,.28)` | `#FFFFFF`, `1px #E3E8F0`, r20, `padding:30px` |
| Ribbon | — | `position:absolute; top:-12px; left:50%; translateX(-50%); font-size:11px; font-weight:700; letter-spacing:.06em; uppercase; color:#06251F; background:#2DD4BF; padding:5px 13px; border-radius:999px` — "Most popular" | — |
| Name colour | `#0E2350` | `#FFFFFF` | `#0E2350` |
| Price | `$0` `#0E2350` + "/ month" `#94A3B8` | `$29` `#FFFFFF` + "/ teacher / month" `#8FA3C7` | `Custom` `#0E2350`, no period |
| Feature text | `#475569` | `#C7D6F2` | `#475569` |
| Check colour | `#16A34A` | `#2DD4BF` | `#16A34A` |
| Features | Up to 30 students · 5 tests per month · **AI feedback (excluded)** — row is `color:#94A3B8` with an ✕ icon `stroke:#CBD5E1` (`M18 6 6 18` / `m6 6 12 12`) | Unlimited students & tests · AI speaking & writing feedback · Full per-skill analytics | SSO & roster sync · District-level reporting · Dedicated support |
| CTA | white / `1px #CBD5E1` / `#16326E`, `padding:11px`, hover `#F7F9FC` — "Get started" | `#2563EB` / white, `padding:12px`, hover `#1D4ED8` — "Start free trial" | white / `1px #CBD5E1` / `#16326E`, `padding:11px`, hover `#F7F9FC` — "Talk to sales" |

The excluded-feature row (greyed text + grey ✕) is the canonical "not included" affordance.

### 5.8 FAQ (`landing--faq.html`) — interactive accordion
`section max-width:760px; margin:0 auto; padding:88px 32px 0` (narrower than every other section).
- `h2` `font-size:32px; font-weight:700; letter-spacing:-0.02em; color:#0E2350; text-align:center` — "Questions, answered".
- List container `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:18px; padding:8px 4px; margin-top:36px`.
- Repeated per item (`sc-for list="{{ faqItems }}"`, 4 items): row wrapper `border-top:1px solid #F1F5F9` (so the first item also shows a rule inside the 8px top padding).
  - **Question button** `flex; align-items:center; justify-content:space-between; gap:14px; padding:18px 22px; cursor:pointer; user-select:none`; text `font-size:15.5px; font-weight:600; color:#0E2350`; chevron `svg 16×16, stroke #64748B, stroke-width 2.2, flex:none`, `transform: rotate(0deg) | rotate(180deg)`, **`transition:transform .2s`**.
  - **Answer** (rendered only when open) `padding:0 22px 20px; font-size:14.5px; line-height:1.65; color:#64748B`. No height animation — the panel is mounted/unmounted; only the chevron animates.
- **Behaviour** (`SchoolTest Landing.dc.html:324, 336-341`): single-open accordion, `state.faqOpen = 0` (first item open on load); clicking the open item sets `faqOpen = -1` (closes all).
- **Content** (`SchoolTest Landing.dc.html:331-335`, verbatim):
  1. Q "Do students need an account?" — A "No — share one link and students join with their name. Accounts are optional for tracking progress across tests."
  2. Q "How does AI grading work?" — A "Speaking and writing answers are scored instantly against your rubric. Teachers see every score and can adjust before results are released."
  3. Q "Can I import my existing tests?" — A "Yes — upload a CSV or DOCX and we map your questions to the right types automatically."
  4. Q "Is SchoolTest suitable for PTE / IELTS prep?" — A "Yes. All 20 PTE Academic task types are built in — from Read Aloud to Write from Dictation — with realistic timing and scoring."

### 5.9 Closing CTA (`landing--cta.html:1-11`)
`section max-width:1200px; margin:0 auto; padding:88px 32px` (bottom padding present here — it is the last section before the footer).
- Panel: `background:linear-gradient(135deg,#0E2350 0%,#16326E 60%,#1D4ED8 140%); border-radius:28px; padding:72px 40px; text-align:center; position:relative; overflow:hidden`. Note the 140% stop — the blue never fully lands inside the box.
- Watermark: `assets/logo-mark.png`, `position:absolute; left:-50px; top:-40px; height:240px; opacity:.10; filter:brightness(0) invert(1)`.
- `h2` `margin:0 auto; max-width:520px; font-size:42px; line-height:1.12; font-weight:700; letter-spacing:-0.025em; color:#FFFFFF; text-wrap:balance` — "Ready to give your class a better test day?"
- `p` `margin:16px auto 0; max-width:400px; font-size:15.5px; line-height:1.6; color:#A9BADC` — "Set up your first test in under five minutes. Free for up to 30 students."
- Button row `flex; justify-content:center; gap:12px; margin-top:30px`:
  - Primary "Start free trial": `background:#FFFFFF; color:#0E2350; border:none; font-size:15px; font-weight:600; padding:13px 26px; border-radius:12px`, trailing arrow `15×15 sw2.4`; **hover `background:#DBEAFE`**.
  - Ghost "Talk to sales": `background:transparent; color:#FFFFFF; border:1px solid rgba(255,255,255,.35); font-size:15px; font-weight:600; padding:12px 25px; border-radius:12px`; **hover `background:rgba(255,255,255,.08)`**.

### 5.10 Marketing footer (`landing--cta.html:14-60`, identical to `ds--footers.html:5-55` except the language select)
`footer background:#0E2350`.
- **Link grid** (`:15`): `max-width:1200px; margin:0 auto; padding:56px 32px 0; display:grid; grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(0,1fr)); gap:36px`. (DS variant uses `padding:44px 40px 36px` inside a `border-radius:16px` card — `ds--footers.html:6`.)
- **Brand column** (`:16-24`): logo `height:30px; width:auto; filter:brightness(0) invert(1)`; blurb `margin:14px 0 0; font-size:13.5px; line-height:1.6; color:#8FA3C7; max-width:240px` — "Smarter tests and better results for teachers, students, and schools."; social row `flex; gap:10px; margin-top:18px` with three `34×34; border-radius:9px; background:#16326E; color:#A9BADC; inline-grid; place-items:center` links (X 14×14 filled path, YouTube 15×15 stroked, LinkedIn 14×14 stroked), `aria-label` set on each. Hover: `color:#FFFFFF` in the landing copy; `background:#1A2A4E; color:#FFFFFF` in the DS copy (`ds--footers.html:11-13`) — prefer the DS version.
- **Three link columns**: heading `font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#8FA3C7`; list `flex column; gap:11px; margin-top:16px`; links `font-size:13.5px; color:#C7D6F2`, hover `#FFFFFF`.
  - **Product**: Test builder · AI feedback · Analytics · Pricing
  - **For schools**: Districts · Language centers · Universities · Case studies
  - **Company**: About · Blog · Careers · Contact
- **Bottom bar** (`:53-59`): `max-width:1200px; margin:36px auto 0; padding:18px 32px; border-top:1px solid #1A2A4E; display:flex; align-items:center; gap:20px; flex-wrap:wrap`.
  - `© 2026 SchoolTest, Inc.` `font-size:12.5px; color:#8FA3C7`; then Privacy · Terms · Security at `12.5px; color:#8FA3C7`, hover `#FFFFFF`.
  - Status chip `margin-left:auto; inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#5EEAD4` with `7×7; border-radius:50%; background:#2DD4BF` dot — "All systems operational".
  - **DS variant only** (`ds--footers.html:49-52`) replaces the status chip with a **language select**: `appearance:none; padding:7px 30px 7px 32px; border-radius:9px; border:1px solid #223154; font-size:12.5px; font-weight:600; color:#C7D6F2; background:#16326E; cursor:pointer`, options English / Español / Deutsch, with a 13×13 globe icon absolutely at `left:11px` and a 12×12 chevron at `right:10px`, both `stroke:#8FA3C7; pointer-events:none`.

### 5.11 App footer (light) — `ds--footers.html:57-66`
For in-product pages: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:20px 32px; flex; align-items:center; gap:20px; flex-wrap:wrap`.
- `logo-mark.png` `height:22px`; `© 2026 SchoolTest` `12.5px; #94A3B8`.
- Right cluster `margin-left:auto; flex; gap:18px; flex-wrap:wrap`: Help center · Privacy · Terms at `font-size:13px; font-weight:500; color:#64748B`, hover `#2563EB`; then status chip `12.5px/600; color:#15803D` with `7×7` dot `background:#16A34A` — "All systems operational". (Light-surface status uses green `#16A34A/#15803D`; dark-surface status uses teal `#2DD4BF/#5EEAD4`.)

### 5.12 Cookie banner — `ds--footers.html:70-77`
`background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:18px 22px; box-shadow:0 12px 32px rgba(14,35,80,.14); display:flex; align-items:center; gap:18px; flex-wrap:wrap`.
- Icon chip `inline-grid; place-items:center; width:38px; height:38px; border-radius:11px; background:#EFF5FF; flex:none`; info glyph `17×17 stroke #2563EB sw2`.
- Copy `flex:1; min-width:220px; font-size:13px; line-height:1.55; color:#475569` — "We use cookies to keep you signed in and measure what's working. [Cookie policy]" (link `font-weight:600`, inherits `#2563EB`). `min-width:220px` + `flex-wrap` is the only intrinsic responsive rule in the furniture set.
- Buttons `flex; gap:9px; flex:none`: "Only essential" white / `1px #CBD5E1` / `#16326E`, `13px/600; padding:8px 15px; r9`, hover `#F7F9FC`; "Accept all" `#0E2350` / white, `padding:9px 16px; r9`, hover `#16326E`.

### 5.13 Landing component library (`ds--landing-components.html`) — variants that differ from the live page
Use these when composing narrower marketing surfaces. All are one step smaller than the full-page versions.

| Component | Key deltas vs live landing | Lines |
|---|---|---|
| Boxed announcement | card form, `r12`, `padding:11px 20px` | 5-8 |
| Compact hero | `#FFFFFF` card, `1px #E3E8F0`, `r16`, `padding:48px 40px`, centred. Pill `12.5px/600; color:#0D9488; background:#F0FDFA; padding:5px 14px; r999` "Trusted by 1,200+ schools". H3 `44px/1.1/700/-0.025em/#0E2350` "Smarter Tests.<br />Better Results." Lead `16px/1.6/#64748B; max-width:440px`. CTAs `15px/600; r12`; primary `#2563EB` w/ `box-shadow:0 6px 16px rgba(37,99,235,.28)`. Note `12.5px; #94A3B8` "No credit card required · Free for up to 30 students". | 10-19 |
| Feature cards (3-up) | `#FFFFFF`, `1px #E3E8F0`, `r16`, `padding:24px`; chip `42×42; r12`; title `16.5px/700; margin-top:16px`; body `14px/1.6; margin-top:7px`. Hover `box-shadow:0 8px 24px rgba(14,35,80,.10); border-color:#CBD5E1` (no lift). Copy: "Build tests in minutes" / "AI grading & feedback" / "Progress you can see". | 21-37 |
| Stat cards (3-up) | white cards `r16; padding:26px; text-align:center`; value `38px/700/-0.02em`, colours `#0E2350` / `#2563EB` / `#0D9488`; label `13.5px; #64748B; margin-top:4px`. Same three metrics as §5.5. | 39-43 |
| Pricing (compact) | `r16; padding:26px`; price `36px`; features `13.5px; gap:9px`; CTA `padding:10-11px; r10`; Pro shadow `0 16px 40px rgba(14,35,80,.25)`; ribbon `top:-11px; padding:4px 12px`; third Pro feature reads "Full analytics" (vs "Full per-skill analytics"). | 45-77 |
| Testimonial (compact) | `r16; padding:26px`; stars `15×15` with `fill+stroke #F59E0B; stroke-width 1`; quote `16px/1.6`; avatar `38×38`, name `13.5px/600`, role `12.5px; #94A3B8`. | 81-94 |
| Logo strip | white card `r16; padding:20px 26px; flex; justify-content:space-between; flex-wrap:wrap`; eyebrow `12px/600; #94A3B8`; 4 wordmarks `15px/700; #CBD5E1; letter-spacing:-0.01em`. | 95-101 |
| How-it-works (compact) | white card `r16; padding:26px`; eyebrow `11px/700; .08em; uppercase; #94A3B8`; `grid repeat(3,1fr); gap:16px`; number tile `30×30; r9; #2563EB`; step title `14px/600; margin-top:10px`; body `12.5px/1.5; #64748B`. Steps "Create" / "Share" / "Review". | 102-109 |
| FAQ (compact) | container `r16; padding:10px 6px`; eyebrow row `11px/700; .08em; uppercase; #94A3B8; padding:12px 20px 6px` "FAQ — try it"; question `14px/600`, row `padding:14px 20px`, chevron `15×15`; answer `13.5px/1.6; padding:0 20px 16px`; 3 placeholder items. | 112-125 |
| Newsletter card | white `r16; padding:24px`; title `15px/700/#0E2350` "Get product updates"; sub `13px; #64748B; margin-top:4px` "One email a month. No spam."; row `flex; gap:8px; margin-top:14px`; input `flex:1; min-width:0; padding:10px 13px; r10; 1px #CBD5E1; 14px; #0E2350` + focus ring `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)`, placeholder `you@school.edu`; button `#0E2350; white; 13.5px/600; padding:10px 18px; r10; flex:none`, hover `#16326E`, label "Subscribe". | 126-133 |
| Mini CTA card | `linear-gradient(135deg,#0E2350 0%,#16326E 100%); r16; padding:28px; color:#FFFFFF; position:relative; overflow:hidden`; watermark `logo-mark.png` `right:-26px; top:-20px; height:130px; opacity:.12; brightness(0) invert(1)`; headline `22px/700/-0.01em/1.25; max-width:280px`; button white/`#0E2350` `14px/600; padding:11px 20px; r10`, hover `#DBEAFE`. | 134-138 |

---

## 6. ANIMATIONS

### 6.1 Keyframes (global, declared in the design-system + app-screens stylesheets)
`SchoolTest Design System.dc.html:19-24` (all six) and `SchoolTest App Screens.dc.html:20` (`st-shimmer` only). The Landing document declares **no keyframes at all** (`SchoolTest Landing.dc.html:11-19`).

| Name | Definition | Animates | Used by (this document) |
|---|---|---|---|
| `st-shimmer` | `0% { background-position:-400px 0 } 100% { background-position:400px 0 }` | background-position | **All skeleton shapes** — `animation: st-shimmer 1.4s linear infinite` with `background-size:800px 100%` (`app--loading-skeleton.html:4-33`) |
| `st-toast-in` | `from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none }` | opacity + Y | not referenced by any screen in this spec |
| `st-fade-in` | `from { opacity:0 } to { opacity:1 }` | opacity | not referenced by any screen in this spec |
| `st-pop-in` | `from { opacity:0; transform:scale(.96) } to { opacity:1; transform:none }` | opacity + scale | not referenced by any screen in this spec |
| `st-spin` | `to { transform:rotate(360deg) }` | rotation | not referenced by any screen in this spec |
| `st-rec-pulse` | `0% { box-shadow:0 0 0 0 rgba(220,38,38,.35) } 70% { box-shadow:0 0 0 16px rgba(220,38,38,0) } 100% { box-shadow:0 0 0 0 rgba(220,38,38,0) }` | box-shadow ring | not referenced by any screen in this spec |

`st-toast-in`, `st-fade-in`, `st-pop-in`, `st-spin` are the intended entrance/loading primitives for overlays, toasts, modals and spinners; wire auth submit spinners to `st-spin` and the forgot-password success alert to `st-pop-in` when building (design does not assign them).

### 6.2 Declared transitions

| Element | Transition | Trigger → end state | Source |
|---|---|---|---|
| Landing feature card (3-up) | `box-shadow .2s, transform .2s` | hover → `box-shadow:0 16px 40px rgba(14,35,80,.10)` (navy card `.28`) + `translateY(-3px)` | `landing--features.html:8,13,18` |
| FAQ chevron | `transform .2s` | open → `rotate(180deg)`; closed → `rotate(0deg)` | `landing--faq.html:10`; `ds--landing-components.html:118` |
| Text input / textarea | `border-color .15s, box-shadow .15s` | focus → `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` | `ds--footers.html:95,96`; `ds--landing-components.html:130`; `ds--forms.html:8,25,39` |
| Checkbox box | `all .15s` | check/uncheck (border + background) | `ds--forms.html:47,53` |
| Radio ring + dot | `all .15s` | select | `ds--forms.html:66,70` |
| Switch track | `background .18s` | toggle | `ds--forms.html:77,81` |
| Switch knob | `transform .18s` | toggle | `ds--forms.html:77,81` |

### 6.3 Hover states declared via `style-hover` (no transition declared — add `transition: background-color .15s, color .15s, border-color .15s` when building)

| Element | Hover |
|---|---|
| Global `<a>` | `color:#1D4ED8` (`a:hover`, real CSS) |
| Primary button (`#2563EB`) — login, register, forgot, empty-state, 404, hero, pricing Pro, compact card | `background:#1D4ED8` |
| Secondary/outline button (white + `1px #CBD5E1`) — Google, resend, 404 support, pricing Free/School | `background:#F7F9FC` (404 secondary also restates `color:#16326E`) |
| 404 primary anchor-button | `background:#1D4ED8; color:#fff` |
| Register unselected role card | `border-color:#CBD5E1` |
| Sidebar inactive nav item | `background:#F1F5F9` |
| Landing nav link | `background:#F1F5F9; color:#0E2350` |
| Landing nav "Sign in" | `background:#F1F5F9` |
| Hero "Watch demo" | `background:#FFFFFF` (from `rgba(255,255,255,.92)`) |
| CTA primary (white on navy) | `background:#DBEAFE` |
| CTA ghost | `background:rgba(255,255,255,.08)` |
| Footer link / social tile | `color:#FFFFFF` (DS social tile also `background:#1A2A4E`) |
| App-footer link | `color:#2563EB` |
| Newsletter Subscribe / cookie "Accept all" (`#0E2350`) | `background:#16326E` |
| DS landing feature card | `box-shadow:0 8px 24px rgba(14,35,80,.10); border-color:#CBD5E1` |

### 6.4 Motion inventory summary
The only motion actually shipped in these screens is: **shimmer (1.4s linear infinite)**, **FAQ chevron rotation (.2s)**, **feature-card hover lift (.2s)**, **input focus ring (.15s)**, and form-control micro-transitions (.15s–.18s). Everything else is instant. There is **no scroll-reveal, no parallax, no counter animation, no page transition and no `prefers-reduced-motion` block anywhere in the design** — see UNKNOWNS.

---

## 7. RESPONSIVE HINTS PRESENT IN THE MARKUP

**There are zero `@media` queries** in `SchoolTest Landing.dc.html`, `SchoolTest App Screens.dc.html` and `SchoolTest Design System.dc.html` (verified by grep: 0 matches each). All responsive intent is expressed intrinsically:

| Mechanism | Where |
|---|---|
| `max-width` content rails | 1360px (hero media, `landing--hero.html:2`) · 1200px (nav, features, feature-detail, stats, how-it-works, pricing, CTA, footer) · 1240px (DS sections) · 900px (hero value strip) · 760px (FAQ) |
| Fluid grid tracks | `repeat(3,minmax(0,1fr))` on features/stats/pricing/score-tiles; `minmax(0,1fr) minmax(0,1.1fr)` on feature-detail; `minmax(0,1.15fr) minmax(0,1fr)` on how-it-works; `minmax(0,1.4fr) repeat(3,minmax(0,1fr))` on the footer. `minmax(0,…)` everywhere = overflow-safe tracks. |
| `flex-wrap:wrap` | hero 3-step row + logo wall (`landing--hero.html:24,33`) · CTA footer bottom bar (`landing--cta.html:53`) · DS footer bottom bar, app footer, app-footer link cluster, cookie banner (`ds--footers.html:44,57,60,70`) · DS logo strip, boxed announcement (`ds--landing-components.html:95,5`) |
| `min-width` floor on a flex child | cookie-banner copy `min-width:220px` (`ds--footers.html:72`) — forces the buttons onto their own line below ~500px |
| `min-width:0` | newsletter input (`ds--landing-components.html:130`) — prevents flex overflow |
| Text-length caps | h1 `max-width:780px`; hero lead `520px`; features h2 `560px`; CTA h2 `520px` / lead `400px`; footer blurb `240px`; login lead `360px`; 404 column `520px`; mini-CTA headline `280px` |
| `text-wrap:balance` / `pretty` | headings use `balance` (hero h1, hero h2, features h2, feature-detail h3, CTA h2); body copy uses `pretty` (hero lead, feature-detail p, testimonial quote) |
| Fixed pixel widths that must become fluid | login form column `420px`, login brand panel `560px`, register column `560px`, forgot-password cards `420px` each, empty-state column `560px`, app shell sidebar `248px`, skeleton sidebar `248px` |

**No mobile layouts exist in the design.** Column counts, the 560px login split and the 248px sidebar have no defined collapse behaviour — see UNKNOWNS.

---

## 8. DATA INVENTORY

### 8.1 Metrics (numbers that must be computed)

| Screen / section | Visible label | Example value in design | Unit / format | Computed from |
|---|---|---|---|---|
| Empty state header (`app--empty-state.html:13`) | (none — value is the label) | `0 credits` | integer + " credits" | parent account credit balance |
| Empty state header (`:14`) | (avatar) | `SH` | 2 uppercase initials | first+last name of signed-in user |
| Register (`app--register.html:6`) | — | `Step 1 of 2` | "Step N of M" | current step index / total steps of the signup flow |
| Forgot password (`app--forgot-password.html:18`) | — | `30 minutes` | integer + unit | reset-token TTL (server-configured) |
| Forgot password (`:21`) | Resend email | `(0:42)` | `m:ss` countdown | resend-cooldown seconds remaining, ticking to 0 |
| Hero eyebrow (`landing--hero.html:9`) | — | `1,200+` schools | thousands-separated integer, rounded down, "+" suffix | count of active school/centre accounts |
| Hero reassurance (`:17`) | — | `30 students` | integer | Free-plan seat cap |
| Stats band (`landing--stats.html:4`) | tests delivered | `2.4M` | 1-decimal millions abbreviation | lifetime count of submitted test sessions |
| Stats band (`:5`) | grading accuracy | `98%` | integer percent | agreement rate between AI draft scores and teacher-released scores |
| Stats band (`:6`) | saved per teacher, weekly | `6 hrs` | integer + " hrs" | mean weekly grading time saved per teacher |
| DS stat cards (`ds--landing-components.html:40-42`) | same three labels | `2.4M` / `98%` / `6 hrs` | as above | as above |
| Feature-detail score tile (`landing--feature-detail.html:20`) | Grammar | `8.5` | 1 decimal, 0–10 scale | AI rubric sub-score |
| Feature-detail score tile (`:21`) | Vocabulary | `7.0` | 1 decimal, 0–10 | AI rubric sub-score |
| Feature-detail score tile (`:22`) | Coherence | `6.5` | 1 decimal, 0–10 | AI rubric sub-score |
| Feature-detail meter fills (`:20-22`) | — | `85%` / `70%` / `65%` | percent width | `score × 10` |
| Pricing Free (`landing--pricing.html:9`) | / month | `$0` | currency, no decimals | plan price |
| Pricing Free features (`:11-12`) | — | `30` students, `5` tests per month | integers | plan quota |
| Pricing Pro (`:20`) | / teacher / month | `$29` | currency, no decimals | per-seat plan price |
| Pricing School (`:30`) | — | `Custom` | literal string (no price) | — |
| Testimonial rating (`landing--how-it-works.html:23-27`) | — | 5 filled stars | 0–5 integer, no half-star artwork | review rating |
| Features card 1 (`landing--features.html:10`) | — | `20 question types` | integer | count of supported item types |
| FAQ item 4 (`SchoolTest Landing.dc.html:335`) | — | `20` PTE Academic task types | integer | same catalogue count |

### 8.2 Labels (field/section names — translatable, never computed)
Login: "Email", "Password", "Forgot password?", "Keep me signed in", "Sign in", "or", "Continue with Google", "Parent", "School".
Register: "First name", "Last name", "Email", "Mobile phone", "Password", "Confirm password", "I'm a parent", "I'm a school".
Forgot: "Email", "Send reset link", "Resend email", "← Back to sign in".
Empty state sidebar: "Overview", "My children", "Buy tests", "Results", "Billing", "Settings".
Landing nav: "Product", "For schools", "Pricing", "Resources", "Sign in", "Start free".
Landing eyebrows: "Everything in one place", "AI feedback students actually read", "How it works", "Pricing", "TRUSTED BY", "FAQ — try it".
Footer column heads: "Product", "For schools", "Company"; bottom bar "Privacy", "Terms", "Security", "Help center".
Score tiles: "Grammar", "Vocabulary", "Coherence". Plans: "Free", "Pro", "School". Badges: "BETA", "Most popular".

### 8.3 Static copy (marketing strings — no data source)
All headings, leads, benefit bullets, feature-card bodies, how-it-works step bodies, the testimonial quote and attribution ("Lena Petrova", "English teacher, Lyceum 14"), the four FAQ Q/A pairs, the announcement sentence, the footer blurb, the cookie sentence, the five trusted-by wordmarks (Northfield Academy, LinguaLab, Prep&Go, EduCore, Wexford Schools), and the copyright line `© 2026 SchoolTest, Inc.` (year is hard-coded in the design; make it dynamic).

### 8.4 Seed/demo values that must not ship
`sara.hansen@gmail.com` (login + forgot), `password123` (login), `Sara` / `Hansen` (register), placeholder `+45 12 34 56 78`, `NH-4823-EM` (student-code placeholder — keep as placeholder, not value), avatar `SH`, testimonial person `LP` / "Lena Petrova".

---

## UNKNOWNS

The following are genuinely undeterminable from the files read; they are not specified anywhere in the slices, the source documents or `tokens.css`.

- **Auth error states are never rendered on the auth screens.** `app--login.html`, `app--register.html` and `app--forgot-password.html` contain no error banner, no field-level error text and no invalid-credentials alert. The only error affordance in the whole design is the generic form field error at `ds--forms.html:12-14` (`border:1px solid #DC2626`, `box-shadow:0 0 0 3px rgba(220,38,38,.10)`, message `12.5px/500 #DC2626` with a 13×13 alert-circle). Whether auth uses a form-top alert, per-field errors, or both is undefined.
- **Button loading / disabled / focus states** are not drawn for any button on these screens. Only `background` hover values exist. No spinner is attached to any submit button (the `st-spin` keyframe exists but is unused here).
- **Input `:focus` on the full-page auth screens** — the login/register/forgot inputs declare `outline:none` with no replacement ring. Only the compact card (`ds--footers.html:95-96`) and the DS forms (`ds--forms.html:8`) declare the `#2563EB` + `rgba(37,99,235,.16)` ring. Applying it to full-page auth is an inference, not a spec.
- **Login role-tab inactive hover/focus** and the keyboard/ARIA model for the segmented control (tablist vs radiogroup) are unspecified.
- **Register step 2** ("Add your first child") is not part of the assigned slices; the button label implies `app--onboarding-add-child.html` follows, but that screen was not read for this document.
- **Register unchecked → checked terms box**: the checked appearance of the terms checkbox is not drawn on the register screen (only the unchecked box at `:32` and the login-style checked box at `app--login.html:34`).
- **"Resend email" post-cooldown label** — only the counting state `Resend email (0:42)` exists; the enabled label and the disabled styling during cooldown are not drawn.
- **Skeleton accessibility** — no `aria-busy`, `aria-hidden`, `role="status"` or visually-hidden loading text appears on any skeleton element.
- **Skeleton coverage** — only the parent-overview shape is skeletonised (sidebar + header + 2 child cards + list card). Table, chart, report and test-taking skeletons do not exist in the design.
- **`prefers-reduced-motion`** — not present anywhere; no reduced-motion fallback for `st-shimmer` or the hover lifts is defined.
- **Responsive breakpoints** — zero `@media` rules exist in any design document. Mobile/tablet behaviour for the login split (560px + 1fr), the 248px sidebar, the 3-column landing grids, the hero 68px h1 and the fixed 420/560px auth columns is entirely undefined.
- **Dark mode for auth/landing** — `tokens.css:75-119` defines a full `.dark` palette, but none of the screens in this document render a dark variant (the navy panels are brand surfaces in light mode, not dark mode).
- **Two different Google logo artworks** ship in the design: `app--login.html:38` uses `#FFC107/#FF3D00/#4CAF50/#1976D2`; `ds--footers.html:92` uses `#4285F4/#34A853/#FBBC05/#EA4335`. Which is canonical is not stated.
- **Landing footer hover on social tiles** differs between the two copies (`landing--cta.html:20-22` = `color:#FFFFFF` only; `ds--footers.html:11-13` = `background:#1A2A4E; color:#FFFFFF`). Which wins is not stated.
- **Language switcher placement** — present in the DS footer (`ds--footers.html:50`) and absent from the live landing footer (`landing--cta.html:53-59`), which shows the status chip in the same slot. Whether both can coexist is not stated.
- **`assets/logo.png` and `assets/logo-mark.png`** are raster references; no SVG source, no intrinsic dimensions and no light/dark variants are provided (white versions are produced with `filter:brightness(0) invert(1)`).
- **Hero background photograph** is an unfilled `image-slot` placeholder (`landing--hero.html:4`, `hint-size="100%,600px"`); no asset, art direction rule or focal point is defined beyond the hint text "a sunny grass field".
