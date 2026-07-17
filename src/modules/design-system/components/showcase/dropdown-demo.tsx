'use client';

import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/modules/design-system/components/button';

interface DropdownDemoProps {
  triggerLabel: string;
  groupLabel: string;
  editLabel: string;
  duplicateLabel: string;
  shareLabel: string;
  copyLinkLabel: string;
  copyLabel: string;
  deleteLabel: string;
  checkboxLabel: string;
  radioGroupLabel: string;
  radioMcqLabel: string;
  radioOpenLabel: string;
}

function DropdownDemo({
  triggerLabel,
  groupLabel,
  editLabel,
  duplicateLabel,
  shareLabel,
  copyLinkLabel,
  copyLabel,
  deleteLabel,
  checkboxLabel,
  radioGroupLabel,
  radioMcqLabel,
  radioOpenLabel,
}: DropdownDemoProps) {
  const [isChecked, setIsChecked] = useState(true);
  const [questionType, setQuestionType] = useState('mcq');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {triggerLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{groupLabel}</DropdownMenuLabel>
          <DropdownMenuItem>{editLabel}</DropdownMenuItem>
          <DropdownMenuItem>
            {duplicateLabel}
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{shareLabel}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>{copyLinkLabel}</DropdownMenuItem>
              <DropdownMenuItem>{copyLabel}</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem variant="destructive">{deleteLabel}</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem checked={isChecked} onCheckedChange={setIsChecked}>
            {checkboxLabel}
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{radioGroupLabel}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={questionType} onValueChange={setQuestionType}>
            <DropdownMenuRadioItem value="mcq">{radioMcqLabel}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="open">{radioOpenLabel}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DropdownDemo, type DropdownDemoProps };
