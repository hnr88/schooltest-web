'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  BULK_AUDIENCES,
  COMMS_AUDIENCE_MAX,
  COMMS_EMAIL_BODY_MAX,
  COMMS_PUSH_BODY_MAX,
  COMMS_PUSH_TITLE_MAX,
  COMMS_SUBJECT_MAX,
  type BulkAudience,
} from '@schooltest/ops-contracts';

import { Button, Card, FieldShell, Input, SelectField, Textarea } from '@/modules/design-system';
import { useBulkEmailMutation } from '@/modules/ops/queries/use-bulk-email.mutation';
import { usePushBroadcastMutation } from '@/modules/ops/queries/use-push-broadcast.mutation';

import { OpsConfirmDialog } from './OpsConfirmDialog';

// C-OPSM-01 / C-OPSM-04 — ONE composer for both fan-outs.
//
// Bulk email and push broadcast are the same interaction over two routes:
// choose an audience, write a headline and a body, preview the blast radius,
// then confirm an irreversible send. They differ in three values (the headline
// field's name and ceiling, the body ceiling, and whether the preview counts
// recipients or subscriptions), so this is one configurable component rather
// than two near-identical ones.
//
// THE SAFETY MODEL, which is the whole point of the screen:
//  - the API defaults `dryRun` to TRUE; this component always sends the flag
//    explicitly so the intent is on the wire, never inferred.
//  - "Preview" is a real POST with `dryRun: true`. It resolves the audience
//    server-side and reports the true count without sending anything, so the
//    operator sees the blast radius before committing.
//  - "Send" cannot fire from the form. It opens the confirm dialog, and only
//    the dialog's confirm issues `dryRun: false`.
//  - validation runs BEFORE any request, so a bad form never reaches the API.
//  - the result is reported from the server's own counts, and a failure shows
//    the server's own message. There is no optimistic success anywhere.
export type BroadcastVariant = 'email' | 'push';

interface OpsBroadcastComposerProps {
  variant: BroadcastVariant;
}

interface FieldErrors {
  audience?: string;
  headline?: string;
  body?: string;
}

const HEADLINE_MAX: Record<BroadcastVariant, number> = {
  email: COMMS_SUBJECT_MAX,
  push: COMMS_PUSH_TITLE_MAX,
};

const BODY_MAX: Record<BroadcastVariant, number> = {
  email: COMMS_EMAIL_BODY_MAX,
  push: COMMS_PUSH_BODY_MAX,
};

export function OpsBroadcastComposer({ variant }: OpsBroadcastComposerProps) {
  const t = useTranslations('Ops.comms');
  const scope = variant === 'email' ? 'bulkEmail' : 'push';

  const [audience, setAudience] = useState<BulkAudience | ''>('');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [preview, setPreview] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Both hooks are called unconditionally — hook order cannot depend on a prop.
  // Only the one this variant needs is used.
  const bulkEmail = useBulkEmailMutation();
  const push = usePushBroadcastMutation();
  const pending = variant === 'email' ? bulkEmail.isPending : push.isPending;

  const headlineMax = HEADLINE_MAX[variant];
  const bodyMax = BODY_MAX[variant];

  /** Mirrors the server's own `requireText`: non-empty after trim, then a ceiling. */
  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!audience) next.audience = t('validation.audienceRequired');
    else if (audience.length > COMMS_AUDIENCE_MAX) next.audience = t('validation.audienceRequired');

    if (headline.trim().length === 0) next.headline = t(`${scope}.validation.headlineRequired`);
    else if (headline.length > headlineMax)
      next.headline = t('validation.tooLong', { max: headlineMax });

    if (body.trim().length === 0) next.body = t('validation.bodyRequired');
    else if (body.length > bodyMax) next.body = t('validation.tooLong', { max: bodyMax });

    return next;
  }

  function serverMessage(error: unknown): string | undefined {
    return (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
      ?.error?.message;
  }

  /** One call path for both dry run and real send, so they cannot diverge. */
  async function submit(dryRun: boolean): Promise<void> {
    if (!audience) return;
    if (variant === 'email') {
      const result = await bulkEmail.mutateAsync({ audience, subject: headline, body, dryRun });
      if (result.dryRun) {
        setPreview(result.recipients);
        toast.success(t('bulkEmail.previewToast', { count: result.recipients }));
        return;
      }
      toast.success(t('bulkEmail.sentToast', { sent: result.sent, failed: result.failed }));
      return;
    }
    const result = await push.mutateAsync({ audience, title: headline, body, dryRun });
    if (result.dryRun) {
      setPreview(result.subscriptions);
      toast.success(t('push.previewToast', { count: result.subscriptions }));
      return;
    }
    toast.success(t('push.sentToast', { sent: result.sent, failed: result.failed }));
  }

  /** Preview and Send share one gate: validate, and stop dead if it fails. */
  async function guarded(action: 'preview' | 'send'): Promise<void> {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (action === 'send') {
      setConfirmOpen(true);
      return;
    }
    try {
      await submit(true);
    } catch (error) {
      toast.error(serverMessage(error) ?? t('errorToast'));
    }
  }

  async function confirmSend(): Promise<void> {
    try {
      await submit(false);
      setConfirmOpen(false);
      setPreview(null);
    } catch (error) {
      setConfirmOpen(false);
      toast.error(serverMessage(error) ?? t('errorToast'));
    }
  }

  const audienceOptions = BULK_AUDIENCES.map((value) => ({
    value,
    label: t(`audiences.${value}`),
  }));

  return (
    <Card
      data-slot={`ops-broadcast-composer-${variant}`}
      data-variant={variant}
      className="flex flex-col gap-4 p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{t(`${scope}.title`)}</h2>
        <p className="text-sm text-body">{t(`${scope}.description`)}</p>
      </div>

      <SelectField
        id={`${variant}-audience`}
        label={t('fields.audience')}
        placeholder={t('fields.audiencePlaceholder')}
        options={audienceOptions}
        value={audience}
        onValueChange={(next) => {
          setAudience(next as BulkAudience);
          // A different audience means a different blast radius: the old
          // preview number is no longer about this send.
          setPreview(null);
        }}
        errorText={errors.audience}
        required
        className="max-w-sm"
      />

      <FieldShell
        id={`${variant}-headline`}
        label={t(`${scope}.headline`)}
        errorText={errors.headline}
        helperText={t('fields.maxChars', { max: headlineMax })}
        required
      >
        <Input
          id={`${variant}-headline`}
          value={headline}
          maxLength={headlineMax}
          onChange={(event) => setHeadline(event.target.value)}
          aria-invalid={errors.headline ? true : undefined}
        />
      </FieldShell>

      <FieldShell
        id={`${variant}-body`}
        label={t('fields.body')}
        errorText={errors.body}
        helperText={t('fields.maxChars', { max: bodyMax })}
        required
      >
        <Textarea
          id={`${variant}-body`}
          value={body}
          rows={variant === 'email' ? 6 : 3}
          maxLength={bodyMax}
          onChange={(event) => setBody(event.target.value)}
          aria-invalid={errors.body ? true : undefined}
        />
      </FieldShell>

      {preview !== null ? (
        <p data-slot={`ops-broadcast-preview-${variant}`} className="text-sm font-medium text-foreground">
          {t(`${scope}.previewResult`, { count: preview })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          data-slot={`ops-broadcast-preview-button-${variant}`}
          disabled={pending}
          onClick={() => void guarded('preview')}
        >
          {t('actions.preview')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          data-slot={`ops-broadcast-send-button-${variant}`}
          disabled={pending}
          onClick={() => void guarded('send')}
        >
          {t(`${scope}.send`)}
        </Button>
      </div>

      <OpsConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t(`${scope}.confirmTitle`)}
        // The count in this copy is the SERVER's preview when one was taken;
        // without it the operator is told the radius is unknown rather than
        // being shown a comforting zero.
        description={
          preview === null
            ? t(`${scope}.confirmUnknown`)
            : t(`${scope}.confirmDescription`, { count: preview })
        }
        confirmLabel={t(`${scope}.confirmAction`)}
        cancelLabel={t('actions.cancel')}
        tone="destructive"
        pending={pending}
        onConfirm={() => void confirmSend()}
      />
    </Card>
  );
}
