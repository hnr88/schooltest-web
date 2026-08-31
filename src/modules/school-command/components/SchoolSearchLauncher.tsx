'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

import { Button } from '@/modules/design-system';
import { SchoolSearchDialog } from '@/modules/school-command/components/SchoolSearchDialog';

/**
 * The school portal's ⌘K launcher: a pill-shaped topbar button plus the
 * global keyboard shortcut (Meta/Ctrl+K). Rendered only inside the school
 * admin area, so no role check is needed here — the section's guard already
 * settled who can see it.
 */
export function SchoolSearchLauncher({ className }: { className?: string }) {
  const t = useTranslations('SchoolCommand');
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openPalette]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        aria-label={t('triggerLabel')}
        onClick={openPalette}
        className={className}
      >
        <Search aria-hidden="true" />
        <span className="hidden sm:inline">{t('triggerLabel')}</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-sans text-xs text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </Button>
      {open ? (
        <SchoolSearchDialog
          open={open}
          onOpenChange={(next) => {
            if (!next) setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
