'use client';

import { useCallback, useState } from 'react';

import { restFailureOf } from '@/lib/axios/strapi';
import { typedNameMatches } from '@/modules/ops/actions/lib/ops-typed-name';

export interface OpsConfirmActionOptions {
  /** Present for the typed-name variant; the operator must retype it exactly. */
  requiredName?: string;
  /** Runs on confirm. Resolves only once the write is proven applied. */
  onConfirm: () => Promise<void>;
}

/**
 * The confirm dialog's state machine, kept out of the component so the dialog
 * stays render-only.
 *
 * `dispatched` is the load-bearing flag: once a mutation is in the air, closing
 * the dialog stops SHOWING it and nothing more. A dialog cannot recall a
 * request, so a close must never be reported to the operator as a cancellation.
 * The typed draft survives every error, including a server error, because
 * clearing it would make the operator retype a school name to retry.
 */
export function useOpsConfirmAction({ requiredName, onConfirm }: OpsConfirmActionOptions) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nameSatisfied = requiredName === undefined || typedNameMatches(typedName, requiredName);
  const canConfirm = nameSatisfied && !pending;

  const openDialog = useCallback(() => {
    setErrorMessage(null);
    setDispatched(false);
    setOpen(true);
  }, []);

  /** Closing never clears the draft, and never claims to undo a dispatch. */
  const closeDialog = useCallback(() => {
    setOpen(false);
    setPending(false);
  }, []);

  const confirm = useCallback(async () => {
    if (!canConfirm) return;
    setPending(true);
    setErrorMessage(null);
    setDispatched(true);
    try {
      await onConfirm();
      setOpen(false);
      setTypedName('');
    } catch (error) {
      const failure = restFailureOf(error);
      setErrorMessage(
        failure?.kind === 'transport'
          ? 'The connection dropped before this could be confirmed. Refresh to see the current state before trying again.'
          : ((failure && 'envelope' in failure ? failure.envelope?.error.message : null) ??
            'The change could not be saved.'),
      );
    } finally {
      setPending(false);
    }
  }, [canConfirm, onConfirm]);

  return {
    open,
    pending,
    /** True once a write has been sent — a close is not a cancellation. */
    dispatched,
    typedName,
    setTypedName,
    nameSatisfied,
    canConfirm,
    errorMessage,
    openDialog,
    closeDialog,
    confirm,
  };
}
