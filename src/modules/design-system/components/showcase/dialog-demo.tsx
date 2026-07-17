'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { XIcon } from 'lucide-react';

import { Button } from '@/modules/design-system/components/button';

interface DialogDemoProps {
  triggerLabel: string;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  closeLabel: string;
}

function DialogDemo({
  triggerLabel,
  title,
  body,
  cancelLabel,
  confirmLabel,
  closeLabel,
}: DialogDemoProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>{triggerLabel}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={closeLabel}
              className="absolute top-4 right-4"
            />
          }
        >
          <XIcon aria-hidden="true" />
        </DialogClose>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="outline" />}>{cancelLabel}</DialogClose>
          <DialogClose render={<Button variant="destructive" />}>{confirmLabel}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DialogDemo, type DialogDemoProps };
