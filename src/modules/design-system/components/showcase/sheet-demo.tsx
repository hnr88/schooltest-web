'use client';

import { XIcon } from 'lucide-react';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/modules/design-system/components/button';

interface SheetDemoProps {
  triggerLabel: string;
  title: string;
  body: string;
  closeLabel: string;
}

function SheetDemo({ triggerLabel, title, body, closeLabel }: SheetDemoProps) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>{triggerLabel}</SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{body}</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose
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
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { SheetDemo, type SheetDemoProps };
