'use client';

import { useTranslations } from 'next-intl';

import {
  OpsDialog,
  OpsDialogBody,
  OpsDialogCancel,
  OpsDialogContent,
  OpsDialogCta,
  OpsDialogFooter,
  OpsDialogHeader,
} from '@/modules/design-system';
import { StudentImportFields } from '@/modules/student-import/components/StudentImportFields';
import { StudentImportRejectList } from '@/modules/student-import/components/StudentImportRejectList';
import type { StudentImportFlowState } from '@/modules/student-import/hooks/use-student-import-flow';

export interface StudentImportDialogBaseProps {
  /** The host's import copy namespace — both hosts ship the same key names. */
  messageNamespace: string;
  state: StudentImportFlowState;
  onClose: () => void;
  /**
   * Picker options; omit when the destination class is fixed (class detail),
   * which also keeps the class selector from rendering.
   */
  classes?: ReadonlyArray<{ documentId: string; name: string }>;
  /** Set together with a fixed class: the description names the destination. */
  fixedClassName?: string;
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
}: StudentImportDialogBaseProps) {
  const t = useTranslations(messageNamespace);

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
          sub={t('description', fixedClassName ? { name: fixedClassName } : undefined)}
        />
        <OpsDialogBody>
          <StudentImportFields
            onChange={state.setParsed}
            {...(classes ? { classes, classId: state.classId, onClassChange: state.setClassId } : {})}
          />
          <p className="text-meta text-body">
            {t('readyCount', { count: state.parsed.rows.length })}
          </p>
          {/* The count line is gone: the list below names the same rows AND says
              which line each one is, so the two together only said it twice. */}
          <StudentImportRejectList
            parseErrors={state.parsed.errors}
            serverRejects={state.rejects}
          />
        </OpsDialogBody>
        <OpsDialogFooter>
          <OpsDialogCancel type="button" onClick={onClose} disabled={state.pending}>
            {t('cancel')}
          </OpsDialogCancel>
          <OpsDialogCta
            type="button"
            loading={state.pending}
            disabled={!state.canSubmit}
            onClick={() => void state.submit()}
          >
            {state.pending ? t('submitting') : t('submit')}
          </OpsDialogCta>
        </OpsDialogFooter>
      </OpsDialogContent>
    </OpsDialog>
  );
}
