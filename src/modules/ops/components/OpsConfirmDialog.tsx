'use client';

import { AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@/modules/design-system';

export interface OpsConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'neutral' | 'destructive';
  pending?: boolean;
  onConfirm: () => void;
}

// The ops overlay set's generic confirmation (design "Invitation, class,
// assignment, import, confirmation, and toast overlays" — the generic
// warning/destructive dialog). Built on the AlertDialog primitive so BOTH
// tones dismiss only through their explicit buttons — an alert dialog does not
// close on a backdrop click — and while pending BOTH buttons disable, so an
// in-flight action can neither be double-fired nor lose its confirmation
// state. The destructive tone differs from the neutral one semantically, not
// just in colour: it carries the warning icon and the destructive button
// variant, and is for copy that names the irreversible consequence.
export function OpsConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'neutral',
  pending = false,
  onConfirm,
}: OpsConfirmDialogProps) {
  const destructive = tone === 'destructive';
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {destructive ? (
              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
            ) : null}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            className="h-11 px-4"
            loading={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
