'use client';

import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  Button,
  Logo,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/modules/design-system';
import { EALD_NAV_LINKS } from '@/modules/eald/constants/eald.constants';
import type { EaldPage } from '@/modules/eald/types/eald.types';

interface EaldMobileNavProps {
  readonly activePage?: EaldPage;
}

function EaldMobileNav({ activePage }: EaldMobileNavProps) {
  const t = useTranslations('Eald');
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={t('nav.openMenu')}
            className="ml-auto size-11 lg:hidden"
          />
        }
      >
        <Menu aria-hidden="true" className="size-5" />
      </SheetTrigger>
      <SheetContent showCloseButton={false} className="gap-0 p-0">
        <SheetHeader className="flex-row items-center justify-between border-b border-border">
          <Logo alt={t('footer.logoAlt')} />
          <SheetTitle className="sr-only">{t('nav.label')}</SheetTitle>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={t('nav.closeMenu')}
                className="size-11"
              />
            }
          >
            <X aria-hidden="true" className="size-5" />
          </SheetClose>
        </SheetHeader>
        <nav aria-label={t('nav.label')} className="flex flex-col gap-1 p-4">
          {EALD_NAV_LINKS.map(({ href, key, page }) => (
            <Link
              key={key}
              href={href}
              onClick={close}
              className={cn(
                'rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted',
                activePage === page && 'bg-blue-50 font-semibold',
              )}
            >
              {t(key)}
            </Link>
          ))}
          <Link
            href="/dashboard/search"
            onClick={close}
            className="rounded-lg px-3 py-3 text-sm font-medium text-body hover:bg-muted"
          >
            {t('nav.schoolSearch')}
          </Link>
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
          <Link
            href="/sign-in"
            onClick={close}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted"
          >
            {t('nav.signIn')}
          </Link>
          <Link
            href="/#register"
            onClick={close}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            {t('nav.registerInterest')}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { EaldMobileNav };
