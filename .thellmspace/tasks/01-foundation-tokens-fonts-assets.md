---
id: 01
title: Foundation — SchoolTest tokens, fonts, brand assets
layer: ui
kind: build
slice: globals.css token rewrite + Google Sans via next/font/local + brand assets in public/brand
target: src/app/globals.css, src/app/layout.tsx, src/app/fonts/, public/brand/
contract: C-TOKENS
status: DONE
depends_on: []
---
## Objective
Port the authoritative token set from `/design-system-and-components/tokens.css` into
`src/app/globals.css` as OKLCH (exact values below — already converted, use them verbatim),
wire the shipped Google Sans variable fonts via next/font/local (replacing Geist), and place
brand assets (logos + extracted hero photo) under `public/brand/`.

## Contract (C-TOKENS — full entry in .qa/CONTRACTS.md)
Semantic tokens, brand scales, charts, sidebar, shadows, dark-mode overrides — all below.
Old brand tokens (rausch/babu/arches/canvas/ink/divider/progress-track) stay for now
(removal is task 12 after the old landing is gone); `--text-display` is REPLACED by the
value below; `--shadow-landing-card` stays.

### Exact values to add (hex shown for reference only — write the oklch form)
```
--navy-950: oklch(0.227 0.0691 263.0857);   /* #0A1A3C */
--navy-900: oklch(0.2692 0.0871 263.0388);  /* #0E2350 */
--navy-800: oklch(0.3341 0.1099 263.0016);  /* #16326E */
--blue-700: oklch(0.4882 0.2172 264.3763);  /* #1D4ED8 */
--blue-600: oklch(0.5461 0.2152 262.8809);  /* #2563EB */
--blue-500: oklch(0.6231 0.188 259.8145);   /* #3B82F6 */
--blue-100: oklch(0.9319 0.0316 255.5855);  /* #DBEAFE */
--blue-50: oklch(0.9685 0.0148 260.7297);   /* #EFF5FF */
--teal-600: oklch(0.6002 0.1038 184.704);   /* #0D9488 */
--teal-500: oklch(0.7038 0.123 182.5025);   /* #14B8A6 */
--teal-100: oklch(0.9527 0.0498 180.8012);  /* #CCFBF1 */
--teal-50: oklch(0.9836 0.0142 180.72);     /* #F0FDFA */
```
`:root` semantic (replace existing values):
```
--background: oklch(0.9814 0.0045 258.3244);      /* #F7F9FC */
--foreground: oklch(0.2692 0.0871 263.0388);      /* #0E2350 */
--card: oklch(1 0 89.8756);                       /* #FFFFFF */
--card-foreground: oklch(0.2692 0.0871 263.0388);
--popover: oklch(1 0 89.8756);
--popover-foreground: oklch(0.2692 0.0871 263.0388);
--primary: oklch(0.5461 0.2152 262.8809);         /* #2563EB */
--primary-foreground: oklch(1 0 89.8756);
--secondary: oklch(0.9685 0.0148 260.7297);       /* #EFF5FF */
--secondary-foreground: oklch(0.3341 0.1099 263.0016); /* #16326E */
--muted: oklch(0.9683 0.0069 247.8956);           /* #F1F5F9 */
--muted-foreground: oklch(0.5544 0.0407 257.4166);/* #64748B */
--accent: oklch(0.7038 0.123 182.5025);           /* #14B8A6 */
--accent-foreground: oklch(1 0 89.8756);
--destructive: oklch(0.5771 0.2152 27.325);       /* #DC2626 */
--destructive-foreground: oklch(1 0 89.8756);
--success: oklch(0.6271 0.1699 149.2138);         /* #16A34A */
--success-foreground: oklch(1 0 89.8756);
--warning: oklch(0.6658 0.1574 58.3183);          /* #D97706 */
--warning-foreground: oklch(1 0 89.8756);
--border: oklch(0.9295 0.0121 259.823);           /* #E3E8F0 */
--input: oklch(0.869 0.0198 252.8943);            /* #CBD5E1 */
--ring: oklch(0.5461 0.2152 262.8809 / 35%);
--radius: 0.625rem;
--chart-1: oklch(0.5461 0.2152 262.8809);
--chart-2: oklch(0.7038 0.123 182.5025);
--chart-3: oklch(0.2692 0.0871 263.0388);
--chart-4: oklch(0.8091 0.0956 251.8128);
--chart-5: oklch(0.8549 0.1251 181.0707);
--sidebar: oklch(1 0 89.8756);
--sidebar-foreground: oklch(0.4455 0.0374 257.2808);
--sidebar-primary: oklch(0.5461 0.2152 262.8809);
--sidebar-primary-foreground: oklch(1 0 89.8756);
--sidebar-accent: oklch(0.9685 0.0148 260.7297);
--sidebar-accent-foreground: oklch(0.3341 0.1099 263.0016);
--sidebar-border: oklch(0.9295 0.0121 259.823);
--sidebar-ring: oklch(0.5461 0.2152 262.8809 / 35%);
--shadow-sm: 0 1px 2px oklch(0.2692 0.0871 263.0388 / 6%);
--shadow-md: 0 2px 8px oklch(0.2692 0.0871 263.0388 / 8%);
--shadow-lg: 0 8px 24px oklch(0.2692 0.0871 263.0388 / 12%);
--shadow-xl: 0 20px 48px oklch(0.2692 0.0871 263.0388 / 18%);
```
`.dark` (replace existing semantic block; brand scales are mode-independent):
```
--background: oklch(0.1876 0.0422 267.6881);      /* #0B1226 */
--foreground: oklch(0.9418 0.0162 262.7519);      /* #E6ECF7 */
--card: oklch(0.2267 0.049 265.5909);             /* #111B33 */
--card-foreground: oklch(0.9418 0.0162 262.7519);
--popover: oklch(0.2583 0.059 265.9728);          /* #162240 */
--popover-foreground: oklch(0.9418 0.0162 262.7519);
--primary: oklch(0.6231 0.188 259.8145);          /* #3B82F6 */
--primary-foreground: oklch(1 0 89.8756);
--secondary: oklch(0.2916 0.0693 264.4597);       /* #1A2A4E */
--secondary-foreground: oklch(0.8736 0.0421 263.0004); /* #C7D6F2 */
--muted: oklch(0.2609 0.0554 265.2532);           /* #17233F */
--muted-foreground: oklch(0.7127 0.0574 262.1235);/* #8FA3C7 */
--accent: oklch(0.7845 0.1325 181.912);           /* #2DD4BF */
--accent-foreground: oklch(0.2397 0.0381 177.6461);/* #06251F */
--destructive: oklch(0.6368 0.2078 25.3313);      /* #EF4444 */
--destructive-foreground: oklch(1 0 89.8756);
--success: oklch(0.7227 0.192 149.5793);          /* #22C55E */
--success-foreground: oklch(0.2348 0.0553 149.8002);/* #06250F */
--warning: oklch(0.7686 0.1647 70.0804);          /* #F59E0B */
--warning-foreground: oklch(0.2355 0.0459 77.8229);/* #2A1B02 */
--border: oklch(0.3186 0.0659 265.3192);          /* #223154 */
--input: oklch(0.3664 0.0744 265.8278);           /* #2C3D66 */
--ring: oklch(0.6231 0.188 259.8145 / 45%);
--chart-1: oklch(0.7137 0.1434 254.624);
--chart-2: oklch(0.7845 0.1325 181.912);
--chart-3: oklch(0.8091 0.0956 251.8128);
--chart-4: oklch(0.4882 0.2172 264.3763);
--chart-5: oklch(0.6002 0.1038 184.704);
--sidebar: oklch(0.2142 0.0496 265.3945);
--sidebar-foreground: oklch(0.7873 0.0521 264.2139);
--sidebar-primary: oklch(0.6231 0.188 259.8145);
--sidebar-primary-foreground: oklch(1 0 89.8756);
--sidebar-accent: oklch(0.2916 0.0693 264.4597);
--sidebar-accent-foreground: oklch(0.9319 0.0316 255.5855);
--sidebar-border: oklch(0.3186 0.0659 265.3192);
--sidebar-ring: oklch(0.6231 0.188 259.8145 / 45%);
```
`@theme inline` additions (keep existing structure; map every new var):
```
--color-navy-950/900/800, --color-blue-700/600/500/100/50, --color-teal-600/500/100/50,
--color-success, --color-success-foreground, --color-warning, --color-warning-foreground,
--shadow-sm/md/lg/xl → var(--shadow-sm)…,
--text-display: clamp(2.75rem, 6vw, 3.5rem);
--text-display--line-height: 1.05;
--text-display--letter-spacing: -0.03em;
```

## Files
- CREATE `src/app/fonts/GoogleSans-Variable.ttf` + `GoogleSans-Italic-Variable.ttf`
  (copy from `/home/hnr/Code/schooltest/design-system-and-components/fonts/`)
- CREATE `public/brand/logo.png` + `logo-mark.png`
  (copy from `/home/hnr/Code/schooltest/design-system-and-components/assets/`)
- CREATE `public/brand/hero-field.webp` — extract from
  `/home/hnr/Code/schooltest/design-system-and-components/.image-slots.state.json`:
  JSON key `hero-field.u` holds a base64 data-URI; decode to webp:
  `node -e 'const s=require("/home/hnr/Code/schooltest/design-system-and-components/.image-slots.state.json");const u=s["hero-field"].u;require("fs").writeFileSync("public/brand/hero-field.webp",Buffer.from(u.split(",")[1],"base64"))'`
  then `file public/brand/hero-field.webp` must report WebP image data, 1200 x 800.
- EDIT `src/app/globals.css` — values above; keep `@import`s, `@custom-variant`, `@layer base`,
  old-brand tokens (until task 12), `--shadow-landing-card`.
- EDIT `src/app/layout.tsx` — replace Geist/Geist_Mono with next/font/local:
  `src: '../app/fonts/GoogleSans-Variable.ttf'` + italic file, `variable: '--font-sans'`,
  weight '400 800', display swap, style normal+italic (two entries in `src` array or two
  localFont calls merged into one variable). Remove `--font-mono` wiring only if nothing
  references it — check first (grep `font-mono` in src/; ui/kbd may use it: if referenced,
  KEEP a mono stack by setting `--font-mono` fallback in globals.css instead of next/font).

## Depends on
Nothing (foundation task).

## Steps
1. Copy fonts + logos; extract hero webp; verify with `file` (TTF/WebP/PNG, expected dims).
2. Rewrite globals.css token sections exactly as specified.
3. Rewire layout.tsx fonts via next/font/local.
4. `pnpm tsc --noEmit` and `pnpm lint` — zero errors.

## Project rules
schooltest-web CLAUDE.md + rules: tailwind.md (OKLCH only, tokens not arbitrary values),
quality.md (next/font mandatory), imports.md. Read .qa/RULES.md first.

## Done criteria
- All four asset classes exist with correct formats/dimensions (file output captured).
- globals.css contains every token above in OKLCH; no hex introduced; dark block matches.
- layout.tsx uses next/font/local with Google Sans; `--font-sans` provided by the font.
- tsc + lint pass with zero errors.
- Verifier: `grep -c "oklch" globals.css` sane; spot-check 5 values against this file;
  `grep -rn "Geist" src/` empty (except lockfile/comments); assets verified with `file`.

## Assumptions
- Old landing still renders (degraded) until task 12 — acceptable intermediate state.
- `--font-mono`: keep working via globals fallback if referenced.

## Evidence
PASS (independent verifier, 2026-07-17): 85/85 OKLCH values verbatim vs task file; assets byte-identical to design source (TTF ×2, logo 503×160, mark 179×119, hero WebP 1200×800 / 192KB); tsc 0 errors; lint 0 errors (1 pre-existing articles warning); zero hex introduced; Geist fully removed, --font-mono fallback stack per spec clause; no ui/* edits, no scope creep.
(filled by builder/verifier)
