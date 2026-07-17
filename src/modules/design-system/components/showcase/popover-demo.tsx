'use client';

import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Button } from '@/modules/design-system/components/button';

interface PopoverDemoProps {
  triggerLabel: string;
  title: string;
  body: string;
  copyLabel: string;
  inputAriaLabel: string;
  linkUrl: string;
}

function PopoverDemo({
  triggerLabel,
  title,
  body,
  copyLabel,
  inputAriaLabel,
  linkUrl,
}: PopoverDemoProps) {
  function handleCopy() {
    void navigator.clipboard.writeText(linkUrl).catch(() => undefined);
  }
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>{triggerLabel}</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverDescription>{body}</PopoverDescription>
        </PopoverHeader>
        <div className="flex items-center gap-2">
          <Input readOnly defaultValue={linkUrl} aria-label={inputAriaLabel} />
          <Button size="sm" onClick={handleCopy}>
            {copyLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { PopoverDemo, type PopoverDemoProps };
