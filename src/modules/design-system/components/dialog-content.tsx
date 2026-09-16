'use client';

import type { ComponentProps } from 'react';

import { AlertDialogContent as AlertDialogContentPrimitive } from '@/components/ui/alert-dialog';
import { DialogContent as DialogContentPrimitive } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  ALERT_DIALOG_SIZE_CLASS,
  DIALOG_HEIGHT_CLASS,
  DIALOG_SIZE_CLASSES,
} from '@/modules/design-system/constants/dialog-size.constants';
import type { DialogSize } from '@/modules/design-system/types/primitives.types';

/**
 * journeys-and-bugs BUG-002 — the canonical modal chrome, layered from the
 * wrapper (the vendored primitive stays untouched): radius 24px, generous 24px
 * padding. Width follows the shared sizing rule (`dialog-size.constants.ts`):
 * the dialog sizes to its content under the cap of its `size`.
 */
function DialogContent({
  className,
  size = 'form',
  ...props
}: ComponentProps<typeof DialogContentPrimitive> & { size?: DialogSize }) {
  return (
    <DialogContentPrimitive
      data-slot="dialog-content"
      className={cn('rounded-3xl p-6', DIALOG_HEIGHT_CLASS, DIALOG_SIZE_CLASSES[size], className)}
      {...props}
    />
  );
}

/** The alert dialog on the same sizing rule, always a confirm. */
function AlertDialogContent({ className, ...props }: ComponentProps<typeof AlertDialogContentPrimitive>) {
  return (
    <AlertDialogContentPrimitive
      className={cn(DIALOG_HEIGHT_CLASS, ALERT_DIALOG_SIZE_CLASS, className)}
      {...props}
    />
  );
}

export { AlertDialogContent, DialogContent };
