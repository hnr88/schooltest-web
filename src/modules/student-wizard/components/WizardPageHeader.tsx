'use client';

import { ArrowLeft } from 'lucide-react';

import { Link } from '@/i18n/navigation';

interface WizardPageHeaderProps {
  title: string;
  backLabel: string;
}

// Page header (spec 03 §2.1): a 13.5/500 "← My children" back link that goes
// #2563EB on hover, then the 30/500/-0.02em portal h1 12px under it. The design
// draws this as a `<span onClick>`; it is a real <Link> here — it is navigation.
export function WizardPageHeader({ title, backLabel }: WizardPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <Link
        href="/dashboard/children"
        className="group inline-flex w-fit items-center gap-1.5 rounded-tile text-body-sm font-medium text-body transition-colors duration-200 ease-out hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-4 transition-transform duration-200 ease-out-expo group-hover:-translate-x-0.5 motion-reduce:transition-none"
        />
        {backLabel}
      </Link>
      <h1 className="text-portal-title font-medium text-foreground">{title}</h1>
    </header>
  );
}
