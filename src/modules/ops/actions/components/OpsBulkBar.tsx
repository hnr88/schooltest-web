'use client';

import { Button } from '@/modules/design-system';
import { OPS_SELECTION_MAX } from '@/modules/ops/actions/constants/ops-action.constants';

export interface OpsBulkBarAction {
  id: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface OpsBulkBarProps {
  count: number;
  /** True once the page-scoped cap stopped the selection growing. */
  atCap: boolean;
  /** Noun for the selected rows, e.g. 'school'. Pluralised with a trailing s. */
  entityLabel: string;
  actions: readonly OpsBulkBarAction[];
  busy?: boolean;
  onClear: () => void;
}

/**
 * The selection bar. It states the count it will actually act on, and says out
 * loud that a selection is this page only — the operator must never be able to
 * read "12 selected" as "the 12 in view plus everything behind the filter".
 */
export function OpsBulkBar({
  count,
  atCap,
  entityLabel,
  actions,
  busy = false,
  onClear,
}: OpsBulkBarProps) {
  if (count === 0) return null;
  const noun = count === 1 ? entityLabel : `${entityLabel}s`;
  return (
    <div
      role="region"
      aria-label={`${count} ${noun} selected`}
      className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3"
    >
      <p className="text-sm font-semibold">
        {count} {noun} selected on this page
      </p>
      {atCap ? (
        <p className="text-sm text-muted-foreground">
          Selection is capped at {OPS_SELECTION_MAX}.
        </p>
      ) : null}
      <div className="ms-auto flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant={action.destructive === true ? 'destructive' : 'outline'}
            disabled={busy || action.disabled === true}
            onClick={action.onSelect}
          >
            {action.label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onClear}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
