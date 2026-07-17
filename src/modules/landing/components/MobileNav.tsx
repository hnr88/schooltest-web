'use client';

import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
import { NAV_LINKS } from '@/modules/landing/constants/landing.constants';

function MobileNav() {
  const t = useTranslations('Home');

  return (
    <Sheet>
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
          {NAV_LINKS.map(({ href, key }) => (
            <SheetClose
              key={key}
              render={
                <a
                  href={href}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                />
              }
            >
              {t(key)}
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
          <SheetClose
            render={
              <a
                href="#cta"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted"
              />
            }
          >
            {t('nav.signIn')}
          </SheetClose>
          <SheetClose
            render={
              <a
                href="#pricing"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/80"
              />
            }
          >
            {t('nav.startFree')}
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { MobileNav };
