'use client';

/**
 * Task 04 — the bulk bar: shown only while a selection exists, listing the
 * consumer's bulk actions plus the way out. The actions receive the selected
 * keys and decide their own side effects; the bar never interprets them.
 */
import { X } from 'lucide-react';

import { Button } from '@/modules/design-system';

import type { DirectoryBulkAction, DirectoryLabels } from '../types/ops-directory.types';

interface OpsDirectoryBulkBarProps {
  selectedKeys: readonly string[];
  bulkActions: readonly DirectoryBulkAction[];
  onClear: () => void;
  labels: DirectoryLabels;
}

export function OpsDirectoryBulkBar({
  selectedKeys,
  bulkActions,
  onClear,
  labels,
}: OpsDirectoryBulkBarProps) {
  return (
    <div
      data-slot="ops-directory-bulk-bar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2"
    >
      <p className="text-sm font-medium" role="status">
        {labels.selectedCount(selectedKeys.length)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {bulkActions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant={action.destructive ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => action.onRun(selectedKeys)}
          >
            {action.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={labels.clearSelection}
          onClick={onClear}
        >
          <X aria-hidden="true" className="size-4" />
          {labels.clearSelection}
        </Button>
      </div>
    </div>
  );
}
