'use client';

import { useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/modules/design-system';
import { OPS_SELECTION_MAX } from '@/modules/ops/actions/constants/ops-action.constants';

export interface OpsBulkBarAction {
  id: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface OpsBulkBarSelectAll {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: () => void;
  ariaLabel: string;
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
  /** In-card variant: renders the select-all box and the row even at 0 selected. */
  selectAll?: OpsBulkBarSelectAll;
  /** Label shown beside the checkbox while nothing is selected. */
  idleLabel?: string;
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
  selectAll,
  idleLabel,
}: OpsBulkBarProps) {
  const t = useTranslations('Ops.bulkBar');
  if (count === 0 && selectAll === undefined) return null;
  const noun = count === 1 ? entityLabel : `${entityLabel}s`;
  const label = count > 0 ? t('selectedOnPage', { count, noun }) : (idleLabel ?? '');
  return (
    <div
      {...(count > 0 ? { role: 'region', 'aria-label': t('ariaSelected', { count, noun }) } : {})}
      className="flex flex-wrap items-center gap-3.5 border-b border-[#EEF1F6] py-1 pb-3.5"
    >
      {selectAll ? (
        <Checkbox
          aria-label={selectAll.ariaLabel}
          className="size-5 flex-none rounded-md"
          checked={selectAll.checked}
          indeterminate={selectAll.indeterminate}
          onCheckedChange={selectAll.onCheckedChange}
        />
      ) : null}
      {label ? <span className="text-[13px] font-semibold text-foreground">{label}</span> : null}
      {atCap ? (
        <span className="text-[12.5px] text-muted-foreground">{t('cappedAt', { max: OPS_SELECTION_MAX })}</span>
      ) : null}
      {count > 0 ? (
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant="ghost"
              className={
                action.destructive === true
                  ? 'h-8 rounded-lg px-3 text-[13px] font-semibold text-destructive hover:bg-[#F4F6FA]'
                  : 'h-8 rounded-lg px-3 text-[13px] font-semibold text-foreground hover:bg-[#F4F6FA]'
              }
              disabled={busy || action.disabled === true}
              onClick={action.onSelect}
            >
              {action.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-full px-3 text-[13px] font-semibold text-[#7C8698]"
            disabled={busy}
            onClick={onClear}
          >
            {t('clear')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
