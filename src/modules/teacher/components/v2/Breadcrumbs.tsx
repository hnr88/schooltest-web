'use client';

import { Fragment } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/modules/design-system';
import { BackButton } from '@/modules/teacher/components/v2/BackButton';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { BreadcrumbsProps } from '@/modules/teacher/types/teacher-kit-controls.types';

/**
 * Teacher Portal v2 — the breadcrumb row (`Teacher Portal v2.dc.html:303–312`,
 * `:521–528`): optional Back button, then "Classes / 7A EAL/D / Name" — 13px,
 * #6B7280/500 links, "/" separators, the current page navy/600. Built on the
 * vendored Breadcrumb primitives (`data-slot="breadcrumb"`, `aria-current`).
 */
function Breadcrumbs({ items, back, className }: BreadcrumbsProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="gap-2 text-[13px] text-[#9CA3AF]">
        {back ? (
          <BreadcrumbItem>
            <BackButton {...back} />
          </BreadcrumbItem>
        ) : null}
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${index}-${item.label}`}>
              <BreadcrumbItem>
                {last ? (
                  <BreadcrumbPage className="font-semibold text-navy-900">{item.label}</BreadcrumbPage>
                ) : item.href === undefined ? (
                  <span className="font-medium text-[#6B7280]">{item.label}</span>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={item.href} />}
                    className={cn('rounded-[4px] font-medium text-[#6B7280] hover:text-navy-900', KIT_FOCUS_RING)}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {last ? null : <BreadcrumbSeparator>/</BreadcrumbSeparator>}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { Breadcrumbs };
