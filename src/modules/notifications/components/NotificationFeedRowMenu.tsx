'use client';

import { MoreHorizontal } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconButton } from '@/modules/design-system';

import type { DirectoryRowAction } from '@/modules/directory';

// The kit's row ⋯ menu for a list-layout row — the `table` layout renders the
// kit's own menu inside DirectoryRows, and a `renderRow` surface owns this one.
// onClick, NOT onSelect: this is Base UI's Menu.Item, which has no onSelect prop
// (that is Radix's API) — the schools table's dead "Open school" was exactly
// this binding mistake.
function NotificationFeedRowMenu<Row>({
  actions,
  row,
  label,
}: {
  actions: readonly DirectoryRowAction<Row>[];
  row: Row;
  label: string;
}) {
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<IconButton icon={MoreHorizontal} label={label} size="sm" />}
      />
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            className={action.destructive ? 'text-destructive' : undefined}
            onClick={() => action.onSelect(row)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { NotificationFeedRowMenu };
