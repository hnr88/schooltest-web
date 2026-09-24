import { Fragment } from 'react';

import { Link } from '@/i18n/navigation';
import type { CmsBreadcrumbProps } from '@/modules/cms/types/components.types';

// The visible trail; the JSON-LD BreadcrumbList is built from the same items.
function CmsBreadcrumb({ items, label }: CmsBreadcrumbProps) {
  return (
    <nav aria-label={label} className="mx-auto w-full max-w-3xl px-6 py-3">
      <ol className="flex flex-wrap items-center gap-2 text-body-sm">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <li aria-hidden="true" className="text-input">/</li> : null}
            <li>
              {item.href ? (
                <Link href={item.href} className="text-body underline-offset-2 hover:text-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-semibold text-foreground">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

export { CmsBreadcrumb };
