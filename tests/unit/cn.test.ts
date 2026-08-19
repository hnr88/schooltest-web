import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils';

/**
 * First user of the new unit tier (Lane J): the `cn` class merger with its
 * custom `@theme` token registrations (text-meta, rounded-panel, shadow-primary-
 * glow, max-w-eald...). The e2e design-tokens spec pins the token LISTS to
 * globals.css parity; this unit tier pins the MERGE BEHAVIOUR those tokens
 * exist for. Offline by construction (pure string function).
 */

describe('cn', () => {
  it('merges clsx inputs', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('lets a registered font-size token win its group (text-meta beats text-xs)', () => {
    expect(cn('text-xs', 'text-meta')).toBe('text-meta');
  });

  it('keeps a font-size token alongside a different group (size vs colour coexist)', () => {
    // text-meta is a SIZE token, not a colour — it must not eat text-red-500.
    expect(cn('text-meta', 'text-red-500')).toBe('text-meta text-red-500');
  });

  it('keeps a registered radius token (rounded-panel beats rounded-xl)', () => {
    expect(cn('rounded-xl', 'rounded-panel')).toBe('rounded-panel');
  });

  it('keeps a registered shadow token', () => {
    expect(cn('shadow-md', 'shadow-primary-glow')).toBe('shadow-primary-glow');
  });

  it('keeps a registered max-width token', () => {
    expect(cn('max-w-7xl', 'max-w-eald')).toBe('max-w-eald');
  });

  it('drops conflicting Tailwind defaults per tailwind-merge rules', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
