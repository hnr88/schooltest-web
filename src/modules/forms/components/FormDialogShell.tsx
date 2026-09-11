'use client';

import { useState } from 'react';

import { Dialog } from '@/modules/design-system';
import { OpsConfirmDialog } from '@/modules/ops';

import type { FormDialogShellProps } from '@/modules/forms/types/forms.types';

// U-20 — the dirty-close guard, a SHELL and not a hook (R-18): it owns the
// dialog's controlled `onOpenChange`, so a close while `isDirty` opens the
// discard confirm instead of dropping the input. `isDirty` is the caller's
// live `formState.isDirty`, read on every close — never snapshotted, because
// react-hook-form resets it on `reset()`. The confirm is the portal's ONE
// confirm (U-24), rendered as a SIBLING overlay: nested inside the dialog it
// would be unreachable once the dialog starts closing.
export function FormDialogShell({
  open,
  onOpenChange,
  isDirty,
  discard,
  children,
}: FormDialogShellProps) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const requestOpenChange = (next: boolean) => {
    if (next || !isDirty) {
      onOpenChange(next);
      return;
    }
    setConfirmingDiscard(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={requestOpenChange}>
        {children}
      </Dialog>
      <OpsConfirmDialog
        open={confirmingDiscard}
        onOpenChange={setConfirmingDiscard}
        title={discard.title}
        description={discard.description}
        confirmLabel={discard.confirmLabel}
        cancelLabel={discard.cancelLabel}
        onConfirm={() => {
          setConfirmingDiscard(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
