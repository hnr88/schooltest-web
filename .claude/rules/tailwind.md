---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

Docs: `.claude/docs/getting-started/css.md`

CSS-first config. Theme defined in `globals.css` via `@theme`.

1. **OKLCH colors ONLY.** Never raw hex, HSL, `#000`, `#fff`. Always tint.
2. **4pt spacing scale:** p-1, p-2, p-3, p-4, p-6, p-8, p-12, p-16, p-24.
3. **Never arbitrary values.** No `p-[23px]`, `w-[347px]`, `text-[17px]`. Use built-in utilities or define tokens in `@theme`.
4. **Never absurdly large spacing.** No `px-80`, `py-96`. Max padding: `p-24` for page containers. Use `max-w-*` + `mx-auto`.
5. **Never arbitrary text sizes.** Use `text-xs` through `text-9xl` or `--font-size-*` tokens.
6. Use `gap-*` for sibling spacing. Never margin for gaps between siblings.
7. Use `clamp()` for fluid typography via `--font-size-*` tokens.
8. **BANNED fonts:** Inter, Roboto, Arial, Open Sans, Lato, Montserrat. Use: Instrument Sans, Plus Jakarta Sans, Outfit, Onest, Figtree, Urbanist, DM Sans.
9. Animate `transform` and `opacity` ONLY. Never width/height/padding/margin.
10. Exponential easings only: ease-out-quart, ease-out-quint, ease-out-expo.
11. **BANNED patterns:** glassmorphism, gradient text on headings, neon-on-dark.
12. Every value from default scale or `@theme` tokens. Square brackets `[]` = wrong.
