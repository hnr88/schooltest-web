'use client';

import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Alert, Badge, Button, Skeleton } from '@/modules/design-system';
import { OpsFormWindowEditor } from '@/modules/ops/components/OpsFormWindowEditor';
import { useFormWindowData } from '@/modules/ops/hooks/use-form-window';
import type { FormWindow } from '@/modules/ops/schemas/form-window.schema';

interface OpsFormWindowProps {
  documentId: string;
}

const DATE_TIME = 'd MMM yyyy, HH:mm';

// Remount key for the editor: the window's CONTENT (never its object
// identity), so a background refetch returning the same window keeps the
// operator's edits, while a real change (their own save) re-seeds the form.
function windowKey(window: FormWindow | null): string {
  if (!window) return 'none';
  return `${window.documentId}:${window.form?.documentId ?? ''}:${window.opens_at}:${window.closes_at}`;
}

// Ops form-window panel (task 68, C-WIN-01/02, mvp-updates 4.2): which prebuilt
// form is live for this school's sittings, and when. The current window and
// its lock badge come from core finds; the save is the replace PUT. A locked
// form is not pre-hidden - the 400 FORM_LOCKED refusal surfaces as panel copy.
export function OpsFormWindow({ documentId }: OpsFormWindowProps) {
  const t = useTranslations('Ops.window');
  const win = useFormWindowData(documentId);

  if (win.isPending) {
    return (
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </section>
    );
  }

  if (win.isError) {
    return (
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <Alert
          variant="error"
          title={t('loadErrorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={win.retrying}
              onClick={win.retry}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('loadErrorDescription')}
        </Alert>
      </section>
    );
  }

  const current = win.currentWindow;

  return (
    <section
      data-surface="ops-form-window"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>
      {current?.form ? (
        <div
          data-surface="ops-form-window-current"
          className="flex flex-col items-start gap-1 rounded-lg bg-muted p-3"
        >
          <p className="text-sm font-medium text-foreground">
            {t('currentForm', { formCode: current.form.form_code })}
          </p>
          <p className="text-sm text-body">
            {t('currentPeriod', {
              opens: format(parseISO(current.opens_at), DATE_TIME),
              closes: format(parseISO(current.closes_at), DATE_TIME),
            })}
          </p>
          {win.locked ? <Badge variant="error">{t('lockedBadge')}</Badge> : null}
        </div>
      ) : (
        <p className="text-sm text-body">{t('currentNone')}</p>
      )}
      <OpsFormWindowEditor
        key={windowKey(current)}
        schoolDocumentId={documentId}
        currentWindow={current}
        forms={win.forms}
      />
    </section>
  );
}
