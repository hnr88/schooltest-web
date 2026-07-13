---
paths:
  - "src/modules/**/stores/**"
  - "src/modules/**/queries/**"
  - "src/lib/axios/**"
  - "src/modules/**/schemas/**"
  - "src/components/ui/**"
---

## shadcn/ui

1. Always check if shadcn has the component BEFORE building custom.
2. Wrap shadcn in module components. Never replace or duplicate.
3. **Never edit files in `src/components/ui/`.**
4. Install: `pnpm dlx shadcn@latest add <component>`.
5. Available: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip.

## Zustand

1. ONE store per concern (auth, cart, ui). Never a mega-store.
2. Stores in `src/modules/[name]/stores/use-[name]-store.ts`.
3. Always type the state interface explicitly.
4. Always use selectors: `useCartStore((s) => s.items)`. No full-store subscriptions.
5. `persist` middleware with `partialize` — persist ONLY what must survive reload.
6. Never import a store in a Server Component.

## TanStack Query

1. Query keys: arrays starting with resource name — `['products']`, `['products', id]`.
2. ONE hook per query in `src/modules/[name]/queries/use-[name].query.ts`.
3. Mutations in `use-[name].mutation.ts` alongside queries.
4. Always invalidate or `setQueryData` after successful mutation.
5. Never call `fetch`/`axios` directly in components. Go through query/mutation hooks.
6. `QueryProvider` is a `'use client'` component wrapping `QueryClientProvider` with `useState`.

## Axios

1. ALL instances live in `src/lib/axios/`. Never create elsewhere.
2. Never `import axios from 'axios'` in a component.
3. `publicApi` — unauthenticated. `privateApi` — authenticated, auto-attaches token, handles 401.

## Forms

Docs: `.claude/docs/guides/forms.md`, `.claude/docs/api-reference/components/form.md`

1. Every form: `useForm` + `zodResolver`. Never manual `useState` for form values.
2. Every form has a Zod schema in `src/modules/[name]/schemas/`.
3. Always use shadcn Form, FormField, FormItem, FormLabel, FormControl, FormMessage.
4. Always provide `defaultValues`.
5. Same Zod schema validates on both client form AND Server Action.
6. For pending/error state, use `useActionState` from React 19. See `.claude/docs/getting-started/error-handling.md`.
