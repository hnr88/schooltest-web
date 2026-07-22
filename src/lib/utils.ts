import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Custom `@theme` tokens that tailwind-merge cannot classify on its own, grouped by
 * the tailwind-merge classGroup they belong to.
 *
 * WHY THIS FILE EXISTS. tailwind-merge only knows Tailwind's built-in scales. A class
 * built from a project token — `text-meta`, `rounded-panel`, `ease-out-expo` — is an
 * unknown string, so it either lands in the WRONG group (an unknown `text-*` is read
 * as a text COLOUR, which then drops the real colour class, or is dropped by it) or in
 * NO group at all (two competing `rounded-*` classes both survive and raw stylesheet
 * order silently picks the winner). Either way the token loses, with no error and no
 * missing-class warning — `text-meta` fell back to 16px and `rounded-panel` fell back
 * to the primitive's 14px `rounded-xl` for as long as they went unregistered.
 *
 * Each entry is the token name with its `--<namespace>-` prefix stripped, i.e. exactly
 * the suffix of the utility class. `tests/e2e/design-tokens.spec.ts` asserts these
 * lists stay at exact parity with `src/app/globals.css`, so a token added to `@theme`
 * without a matching entry here fails the suite instead of silently not rendering.
 *
 * Namespaces deliberately NOT listed: `--color-*` (tailwind-merge accepts any colour
 * value), `--background-image-*` and `--font-*` (verified to resolve correctly today).
 */
export const THEME_CLASS_GROUPS = {
  // --text-* → text-<name>
  'font-size': [
    'display',
    'h1',
    'h2',
    'h3',
    'h4',
    'flow',
    'cta-title',
    'quote',
    'micro',
    'caption',
    'button',
    'error-code',
    'page-title',
    'auth-title',
    'panel-title',
    'lede',
    'body-lg',
    'body-md',
    'body-sm',
    'meta',
    'overline',
    'stat-xl',
    'stat-lg',
    'stat-md',
    'stat-sm',
    'portal-title',
    'portal-heading',
    'portal-kpi',
    'portal-stat',
    'portal-panel',
  ],
  // --radius-* → rounded-<name>
  rounded: [
    'sm',
    'md',
    'lg',
    'tile',
    'panel',
    'card',
    'result',
    'segment',
    'selection',
    'xl',
    '2xl',
    '3xl',
    '4xl',
  ],
  // --ease-* → ease-<name>
  ease: ['out-expo'],
  // --tracking-* → tracking-<name>
  tracking: ['eyebrow', 'overline', 'rail'],
  // --shadow-* → shadow-<name>
  shadow: ['sm', 'md', 'lg', 'xl', 'primary-glow', 'dark-lift', 'knob', 'float'],
  // --container-* → max-w-<name>
  'max-w': ['landing', 'hero', 'auth', 'auth-wide', 'portal', 'shell'],
} as const;

/** The utility prefix each classGroup's tokens are written with. */
const GROUP_UTILITY: Record<keyof typeof THEME_CLASS_GROUPS, string> = {
  'font-size': 'text',
  rounded: 'rounded',
  ease: 'ease',
  tracking: 'tracking',
  shadow: 'shadow',
  'max-w': 'max-w',
};

/** The `@theme` custom-property namespace each classGroup's tokens are declared in. */
export const GROUP_TOKEN_PREFIX: Record<keyof typeof THEME_CLASS_GROUPS, string> = {
  'font-size': '--text-',
  rounded: '--radius-',
  ease: '--ease-',
  tracking: '--tracking-',
  shadow: '--shadow-',
  'max-w': '--container-',
};

const classGroups = Object.fromEntries(
  Object.entries(THEME_CLASS_GROUPS).map(([group, tokens]) => [
    group,
    [{ [GROUP_UTILITY[group as keyof typeof THEME_CLASS_GROUPS]]: [...tokens] }],
  ]),
);

const twMerge = extendTailwindMerge({ extend: { classGroups } });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
