'use client';

import { useTranslations } from 'next-intl';

import {
  Alert,
  MissingDependencyNotice,
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
  Skeleton,
} from '@/modules/design-system';
import { StudentImportFields } from '@/modules/student-import/components/StudentImportFields';
import { StudentImportRejectList } from '@/modules/student-import/components/StudentImportRejectList';
import type { StudentImportFlowState } from '@/modules/student-import/hooks/use-student-import-flow';
import type { StudentImportClassesState } from '@/modules/student-import/types/components.types';

export interface StudentImportDialogBaseProps {
  /** The host's import copy namespace — both hosts ship the same key names. */
  messageNamespace: string;
  state: StudentImportFlowState;
  onClose: () => void;
  /**
   * The class picker's dependency state. Omit when the destination class is
   * fixed (class detail), which also keeps the class selector from rendering;
   * `'pending'` / `'error'` render their own arms instead of the form; an
   * empty array means the school has no classes, so the import is refused
   * with a pointer at class creation rather than a zero-option select.
   */
  classes?: StudentImportClassesState;
  /** Set together with a fixed class: the description names the destination. */
  fixedClassName?: string;
  /** Where the empty-classes CTA sends the admin (school-admin classes page). */
  createClassesHref?: string;
}

/**
 * THE one import dialog. The Students page and the class detail render this
 * same component — one parse, one preview→commit engine, one reject list, one
 * set of refusal messages — so the surfaces cannot drift. The class picker
 * renders only when `classes` is passed; a fixed-class host passes
 * `fixedClassName` so the description names the destination instead.
 */
export function StudentImportDialogBase({
  messageNamespace,
  state,
  onClose,
  classes,
  fixedClassName,
  createClassesHref,
}: StudentImportDialogBaseProps) {
  const t = useTranslations(messageNamespace);

  const options = Array.isArray(classes) ? classes : undefined;
  // The picker's dependency is checked BEFORE the form renders: a school with
  // no classes cannot import anywhere, so the dialog refuses and directs
  // instead of offering an empty dropdown.
  const noClasses = options !== undefined && options.length === 0;
  // The submit action exists only when there is a destination — a dead
  // always-disabled CTA on the guard arms would be its own lie.
  const canAct = fixedClassName !== undefined || (options !== undefined && options.length > 0);

  let body: React.ReactNode;
  if (classes === 'pending') {
    body = (
      <div className="flex flex-col gap-3" data-slot="student-import-pending">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  } else if (classes === 'error') {
    body = (
      <Alert variant="error" title={t('classLoadErrorTitle')}>
        {t('classLoadErrorDescription')}
      </Alert>
    );
  } else if (noClasses) {
    body = (
      <MissingDependencyNotice
        kind="classes"
        {...(createClassesHref !== undefined ? { ctaHref: createClassesHref } : {})}
      />
    );
  } else {
    body = (
      <>
        <StudentImportFields
          onChange={state.setParsed}
          {...(options
            ? { classes: options, classId: state.classId, onClassChange: state.setClassId }
            : {})}
        />
        <p className="text-meta text-body">{t('readyCount', { count: state.parsed.rows.length })}</p>
        {/* The count line is gone: the list below names the same rows AND says
            which line each one is, so the two together only said it twice. */}
        <StudentImportRejectList parseErrors={state.parsed.errors} serverRejects={state.rejects} />
      </>
    );
  }

  return (
    <OpsDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <OpsDialogContent className="sm:max-w-[560px]">
        <OpsDialogHeader
          title={t('title')}
          sub={
            // The how-to sub would contradict the guard under it — on the
            // no-classes arm the header carries the refusal alone.
            noClasses ? undefined : t('description', fixedClassName ? { name: fixedClassName } : undefined)
          }
        />
        <OpsDialogBody>{body}</OpsDialogBody>
        <OpsDialogFooter>
          <OpsDialogCancel type="button" onClick={onClose} disabled={state.pending}>
            {t('cancel')}
          </OpsDialogCancel>
          {canAct ? (
            <OpsDialogCta
              type="button"
              loading={state.pending}
              disabled={!state.canSubmit}
              onClick={() => void state.submit()}
            >
              {state.pending ? t('submitting') : t('submit')}
            </OpsDialogCta>
          ) : null}
        </OpsDialogFooter>
      </OpsDialogContent>
    </OpsDialog>
  );
}
