'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { Alert } from './alert';
import { Button } from './button';
import type { AlertVariant } from '@/modules/design-system/types/design-system.types';

/**
 * The entities a control can depend on. Each kind maps to one
 * `Components.missingDependency.<kind>` copy group; kinds without a `cta`
 * key (destinationClasses, forms) must not receive `ctaHref`/`onCta`.
 * `teachers` is the informational kind (the action continues without one);
 * `eligibleTeachers` is the BLOCKING kind — the action cannot start at all.
 */
const KINDS = ['classes', 'destinationClasses', 'teachers', 'eligibleTeachers', 'forms'] as const;

export type MissingDependencyKind = (typeof KINDS)[number];

export interface MissingDependencyNoticeProps {
  /** Which entity is missing — selects the shared copy group. */
  kind: MissingDependencyKind;
  /** Set only for kinds with a `cta` key: the CTA navigates here (locale-aware). */
  ctaHref?: string;
  /** Set only for kinds with a `cta` key: the CTA runs this instead of navigating. */
  onCta?: () => void;
  variant?: AlertVariant;
  className?: string;
}

/**
 * THE one "you are missing the thing this control depends on" notice. Any
 * select, picker or flow whose options come from another entity renders this
 * INSTEAD of an empty control: the rule is that a dependent dropdown never
 * renders empty — the user is told what to create first and given the way
 * there. Copy is shared (`Components.missingDependency.*`) so every portal
 * words the refusal the same way.
 */
function MissingDependencyNotice({
  kind,
  ctaHref,
  onCta,
  variant = 'warning',
  className,
}: MissingDependencyNoticeProps) {
  const t = useTranslations('Components.missingDependency');
  const hasCta = ctaHref !== undefined || onCta !== undefined;

  return (
    <Alert variant={variant} title={t(`${kind}.title`)} className={cn('text-left', className)}>
      <p>{t(`${kind}.description`)}</p>
      {hasCta ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          {...(ctaHref !== undefined ? { href: ctaHref } : { onClick: onCta })}
        >
          {t(`${kind}.cta`)}
        </Button>
      ) : null}
    </Alert>
  );
}

export { MissingDependencyNotice };
