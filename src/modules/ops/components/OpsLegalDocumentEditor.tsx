'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LEGAL_SLUGS, type LegalSlug } from '@schooltest/ops-contracts';
import { z } from 'zod';

import { useAuthStore } from '@/modules/auth';
import { Alert, Button, Card, FieldShell, Input, SelectField, Textarea } from '@/modules/design-system';
import { useLegalDocumentQuery } from '@/modules/ops/queries/use-legal-document.query';
import { useLegalUpdateMutation } from '@/modules/ops/queries/use-legal-update.mutation';

import { OpsConfirmDialog } from './OpsConfirmDialog';

// Ledger 10 (D-008) — the ops legal-document editor on the settings screen.
//
// SCOPE OF EDITING: version, effective date and the BODY (each section's
// heading + paragraphs, one paragraph per line). Title, summary, per-section
// ids and bullet lists are NOT editable here and pass through untouched — the
// PUT is a partial patch, and the sections array is rebuilt from the hydrated
// row so nothing the operator did not touch can be lost. A missing token or a
// hydrate failure disables the save instead of inviting a blind write.
//
// HYDRATION IS `values`-ONLY — the codebase's stated pattern for server-fed
// forms (OpsBannerEditor): RHF re-applies `values` without wiping
// `control._fields`, and the component stays free of `set-state-in-effect`.
// The slug is component state; the query key carries it, so switching slugs
// refetches and the `values` update re-hydrates the same mounted form.

interface SectionForm {
  heading: string;
  paragraphsText: string;
}

interface LegalForm {
  version: string;
  effective_date: string;
  sections: SectionForm[];
}

function serverMessage(err: unknown): string | undefined {
  return (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
    ?.error?.message;
}

export function OpsLegalDocumentEditor() {
  const t = useTranslations('Ops.settings.legal');
  const tCommon = useTranslations('Common');

  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [slug, setSlug] = useState<LegalSlug>('privacy-policy');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const query = useLegalDocumentQuery(slug, hydrated && Boolean(token));
  const update = useLegalUpdateMutation();

  const schema = useMemo(
    () =>
      z.object({
        version: z.string().trim().min(1, t('validation.versionRequired')).max(20, t('validation.versionRequired')),
        effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.dateInvalid')),
        sections: z
          .array(
            z.object({
              heading: z.string().trim().min(1, t('validation.headingRequired')),
              paragraphsText: z
                .string()
                .refine(
                  (value) => value.split('\n').some((line) => line.trim().length > 0),
                  t('validation.paragraphRequired'),
                ),
            }),
          )
          .min(1),
      }),
    [t],
  );

  const row = query.data;
  const values = useMemo<LegalForm | undefined>(() => {
    if (!row) return undefined;
    return {
      version: row.version,
      effective_date: row.effective_date,
      sections: row.sections.map((section) => ({
        heading: section.heading,
        paragraphsText: section.paragraphs.join('\n'),
      })),
    };
  }, [row]);

  const form = useForm<LegalForm>({
    resolver: zodResolver(schema),
    defaultValues: { version: '', effective_date: '', sections: [] },
    values,
  });

  // Validation runs FIRST: on a bad form RHF never opens the dialog and
  // nothing reaches the API.
  const requestSave = form.handleSubmit(() => setConfirmOpen(true));

  async function confirmSave() {
    if (!row) return;
    const current = form.getValues();
    try {
      const result = await update.mutateAsync({
        slug,
        body: {
          version: current.version.trim(),
          effective_date: current.effective_date,
          // Whole-array replacement: ids and bullet lists come back from the
          // hydrated row untouched, so the operator edits copy and nothing else.
          sections: row.sections.map((section, index) => ({
            id: section.id,
            heading: current.sections[index]?.heading.trim() ?? section.heading,
            paragraphs: (current.sections[index]?.paragraphsText ?? '')
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean),
            ...(section.list?.length ? { list: section.list } : {}),
          })),
        },
      });
      setConfirmOpen(false);
      toast.success(t('savedToast', { version: result.version }));
    } catch (err) {
      setConfirmOpen(false);
      toast.error(serverMessage(err) ?? t('errorToast'));
    }
  }

  const slugOptions = LEGAL_SLUGS.map((value) => ({ value, label: t(`slugs.${value}`) }));

  return (
    <Card data-slot="ops-legal-editor" className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-body">{t('description')}</p>
      </div>

      <SelectField
        id="ops-legal-slug"
        label={t('slugLabel')}
        placeholder={t('slugLabel')}
        options={slugOptions}
        value={slug}
        onValueChange={(next) => setSlug(next as LegalSlug)}
        disabled={update.isPending}
        className="max-w-xs"
      />

      {query.isError ? (
        <Alert
          variant="error"
          title={t('loadErrorTitle')}
          action={
            <Button type="button" variant="outline" onClick={() => void query.refetch()}>
              {tCommon('retry')}
            </Button>
          }
        >
          {t('loadErrorDescription')}
        </Alert>
      ) : query.isPending || !row ? (
        <div data-state="loading" role="status" aria-live="polite" className="text-sm text-body">
          {tCommon('loading')}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell id="ops-legal-version" label={t('versionLabel')} errorText={form.formState.errors.version?.message}>
              <Controller
                control={form.control}
                name="version"
                render={({ field }) => (
                  <Input
                    id="ops-legal-version"
                    name={field.name}
                    ref={field.ref}
                    value={String(field.value ?? '')}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    data-slot="ops-legal-version"
                    disabled={update.isPending}
                  />
                )}
              />
            </FieldShell>
            <FieldShell
              id="ops-legal-effective-date"
              label={t('effectiveDateLabel')}
              errorText={form.formState.errors.effective_date?.message}
            >
              <Controller
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <Input
                    id="ops-legal-effective-date"
                    name={field.name}
                    ref={field.ref}
                    type="date"
                    value={String(field.value ?? '')}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    data-slot="ops-legal-effective-date"
                    disabled={update.isPending}
                  />
                )}
              />
            </FieldShell>
          </div>

          {row.sections.map((section, index) => (
            <div key={section.id} data-slot={`ops-legal-section-${index}`} className="flex flex-col gap-3 rounded-xl border p-4">
              <FieldShell
                id={`ops-legal-section-heading-${index}`}
                label={t('sectionHeading', { index: index + 1 })}
                errorText={form.formState.errors.sections?.[index]?.heading?.message}
              >
                <Controller
                  control={form.control}
                  name={`sections.${index}.heading` as const}
                  render={({ field }) => (
                    <Input
                      id={`ops-legal-section-heading-${index}`}
                      name={field.name}
                      ref={field.ref}
                      value={String(field.value ?? '')}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      data-slot={`ops-legal-section-heading-${index}`}
                      disabled={update.isPending}
                    />
                  )}
                />
              </FieldShell>
              <FieldShell
                id={`ops-legal-paragraphs-${index}`}
                label={t('sectionParagraphs', { index: index + 1 })}
                helperText={t('sectionParagraphsHelp')}
                errorText={form.formState.errors.sections?.[index]?.paragraphsText?.message}
              >
                <Controller
                  control={form.control}
                  name={`sections.${index}.paragraphsText` as const}
                  render={({ field }) => (
                    <Textarea
                      id={`ops-legal-paragraphs-${index}`}
                      name={field.name}
                      ref={field.ref}
                      value={String(field.value ?? '')}
                      rows={4}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      data-slot={`ops-legal-paragraphs-${index}`}
                      disabled={update.isPending}
                    />
                  )}
                />
              </FieldShell>
            </div>
          ))}

          <div>
            <Button
              type="button"
              data-slot="ops-legal-save"
              disabled={update.isPending}
              onClick={() => void requestSave()}
            >
              {t('save')}
            </Button>
          </div>
        </>
      )}

      <OpsConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('confirmTitle')}
        description={t('confirmBody', { slug: t(`slugs.${slug}`) })}
        confirmLabel={t('confirmAction')}
        cancelLabel={t('cancel')}
        tone="neutral"
        pending={update.isPending}
        onConfirm={() => void confirmSave()}
      />
    </Card>
  );
}
