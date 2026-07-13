---
paths:
  - "src/modules/**"
---

Docs: `.claude/docs/getting-started/project-structure.md`

ALL custom code lives in `src/modules/[name]/`. Code outside modules is a structural violation.

## Module Structure
1. Modules are self-contained — they own their own everything.
2. Cross-module imports MUST go through the barrel `index.ts`. Never reach into internals.
3. `index.ts` exports ONLY the public surface. Internal helpers stay private.
4. Shared code goes in `src/lib/` or a dedicated shared module.

## File Placement — Where Code MUST Live

| Code type | MUST live in | NEVER in |
|---|---|---|
| `type`, `interface` | `types/x.types.ts` | components, hooks, lib, actions, queries |
| Zod `z.object(...)` | `schemas/x.schema.ts` | components, hooks, actions |
| `useQuery`/`useMutation` | `queries/use-x.query.ts` | components |
| `useX` custom hooks | `hooks/useX.ts` | components |
| `'use server'` functions | `actions/x.action.ts` | components, pages |
| `create<Store>()` | `stores/use-x-store.ts` | components, hooks |
| Constants, config objects | `constants/x.constants.ts` | components, hooks |
| Pure utility functions | `lib/x.ts` | components, hooks |

Only exception: inline props type for a single-use component (`{ title }: { title: string }`).
Inferred types from Zod schemas (`z.infer<>`) MUST be re-exported from `types/`.

## Components Are Dumb — Logic Lives Elsewhere

Components render UI. That is their ONLY job.

**Components CAN:** return JSX, call hooks, handle simple UI state (`isOpen`), destructure props, map lists.

**Components CANNOT:**
- Contain business logic, calculations, data transformations → extract to `hooks/` or `lib/`
- Contain API calls (`useQuery`/`useMutation`/`fetch`/`axios`) → wrap in `queries/` hooks
- Contain form validation logic → Zod in `schemas/`, `useForm` in `hooks/` if complex
- Contain >3 `useState` calls → extract to custom hook
- Contain `useEffect` with complex logic → extract to custom hook
- Define helper functions that don't use hooks → move to `lib/`

**Rule of thumb:** Remove the JSX `return` — if >15 lines of logic remain, the component does too much.

## Extended Approved Stack

When adding libraries, use ONLY these. Confirm with user before adding any.

| Need | USE | BANNED |
|---|---|---|
| Date/time | date-fns or Day.js | Moment.js, Luxon |
| Tables | @tanstack/react-table + shadcn Table | MUI DataGrid, AG Grid |
| Charts | Recharts or Tremor | Chart.js, Victory, Nivo |
| Animation | Framer Motion (motion/react) | react-spring, GSAP |
| Drag & drop | dnd-kit | react-dnd, react-beautiful-dnd |
| Virtualization | @tanstack/react-virtual | react-window |
| Rich text | Tiptap | Draft.js, Quill, Slate |
| Markdown | react-markdown + remark-gfm | marked + dangerouslySetInnerHTML |
| File upload | react-dropzone | filepond, uppy |
| Maps | react-leaflet or @vis.gl/react-google-maps | react-google-maps/api |
| Class merge | clsx + tailwind-merge via cn() | classnames |
| IDs | nanoid | uuid (unless RFC 4122 required) |
| Env | @t3-oss/env-nextjs + Zod | raw process.env |
| Auth | Auth.js v5 / NextAuth OR custom Axios | Clerk SDK |
| Search | Fuse.js or Algolia | Lunr.js |
| Variants | cva (class-variance-authority) | prop-to-class switches |
