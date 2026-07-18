'use client';

import { useState } from 'react';
import { Copy, Mail, Pencil, Trash2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioItem,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/modules/design-system/components/menu';

import { Button } from '@/modules/design-system/components/button';

interface DropdownDemoProps {
  triggerLabel: string;
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
          <DropdownMenuItem>
            <Pencil aria-hidden="true" />
            {editLabel}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy aria-hidden="true" />
            {duplicateLabel}
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Mail aria-hidden="true" />
              {shareLabel}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>{copyLinkLabel}</DropdownMenuItem>
              <DropdownMenuItem>{copyLabel}</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem variant="destructive">
            <Trash2 aria-hidden="true" />
            {deleteLabel}
          </DropdownMenuItem>
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
