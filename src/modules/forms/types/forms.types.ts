import type { FormEventHandler, ReactNode } from 'react';

// SHARED-LAYER.md §F-shell — the prop contracts for U-18 and U-20.

export interface FormShellProps {
  /** `data-testid={`${id}-root-error`}` on the alert paragraph. */
  id: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  rootError?: string | null;
  submitting?: boolean;
  className?: string;
  children: ReactNode;
}

export interface FormDialogShellDiscard {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
}

export interface FormDialogShellProps {
  open: boolean;
  /** Gated on `isDirty`: a dirty close opens the discard confirm instead. */
  onOpenChange: (next: boolean) => void;
  /** Read from the caller's `formState.isDirty` on every render — never snapshotted. */
  isDirty: boolean;
  discard: FormDialogShellDiscard;
  children: ReactNode;
}
