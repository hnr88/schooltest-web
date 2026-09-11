'use client';

/**
 * ops grid — the bulk bar as the grid card's opening row
 * (`Ops Portal.dc.html:142-154`): select-all checkbox, count label, the
 * actions right-aligned as flat 32px buttons and a Clear pill. With nothing
 * selected it still renders the select-all checkbox (the old THEAD's control)
 * and hides the action cluster, exactly as the design's toggled bar does.
 *
 * teacher/05 (U-14, U-21) partitioning is unchanged: each action receives only
 * its eligible rows/targets, and `onRun([], [])` still dispatches on an empty
 * eligible set.
 */
import { useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';

import type { OpsActionTarget } from '@/modules/ops/actions';
import { OPS_SELECTION_MAX } from '@/modules/ops/actions/constants/ops-action.constants';
import { partitionSelection } from '../lib/directory-eligibility';
import type { DirectoryBulkAction, DirectoryLabels, DirectorySelectionApi } from '../types/directory.types';

interface DirectoryBulkBarProps<Row> {
  selection: DirectorySelectionApi<Row>;
  bulkActions: readonly DirectoryBulkAction<Row>[];
  labels: DirectoryLabels;
}

export function DirectoryBulkBar<Row>({
  selection,
  bulkActions,
  labels,
}: DirectoryBulkBarProps<Row>) {
  const t = useTranslations('Ops.bulkBar');
  const noun = selection.count === 1 ? labels.selectedEntityNoun : `${labels.selectedEntityNoun}s`;
  const hasSelection = selection.count > 0;

  type SelectionPair = { row: Row; target: OpsActionTarget };
  const pairs: readonly SelectionPair[] = selection.selectedRows.map((row, index) => ({
    row,
    target: selection.targets[index],
  }));

  const mapped = bulkActions.map((action) => {
    const eligibleOf = action.eligible;
    const { eligible, skipped } = partitionSelection(
      pairs,
      eligibleOf === undefined ? {} : { eligible: (pair: SelectionPair) => eligibleOf(pair.row) },
    );
    return {
      id: action.label,
      label:
        eligible.length === selection.selectedRows.length
          ? action.label
          : `${action.label} (${eligible.length} of ${selection.selectedRows.length})`,
      destructive: action.destructive,
      // ops/28 (D-53) — forwarded verbatim as the native HTML disabled.
      disabled: action.disabled === true,
      onSelect: () =>
        action.onRun(
          eligible.map((pair) => pair.row),
          eligible.map((pair) => pair.target),
        ),
      skipSentence:
        skipped.length > 0 && action.skipLabel !== undefined
          ? action.skipLabel(skipped.length)
          : null,
    };
  });

  const skipSentences = mapped
    .map((action) => action.skipSentence)
    .filter((sentence): sentence is string => sentence !== null);

  return (
    <div
      className="flex flex-wrap items-center gap-3.5 border-b border-[#EEF1F6] px-6 pt-4 pb-3.5"
      data-slot="directory-bulk-bar"
    >
      <Checkbox
        aria-label={labels.selectAllLabel}
        checked={selection.headerState === 'all'}
        indeterminate={selection.headerState === 'some'}
        onCheckedChange={() => selection.toggleAllOnPage()}
        className="size-5 rounded-[6px] border-[1.5px] [&_svg]:size-3"
      />
      <span role="status" className="text-[13px] font-semibold text-foreground">
        {hasSelection ? t('selectedOnPage', { count: selection.count, noun }) : labels.selectAllLabel}
      </span>
      {hasSelection && selection.atCap ? (
        <span className="text-[13px] text-muted-foreground">{t('cappedAt', { max: OPS_SELECTION_MAX })}</span>
      ) : null}
      {hasSelection ? (
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {mapped.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled === true}
              onClick={action.onSelect}
              className={
                action.destructive === true
                  ? 'h-8 cursor-pointer rounded-lg bg-transparent px-3 text-[13px] font-semibold text-destructive hover:bg-[#F4F6FA] disabled:cursor-not-allowed disabled:opacity-50'
                  : 'h-8 cursor-pointer rounded-lg bg-transparent px-3 text-[13px] font-semibold text-foreground hover:bg-[#F4F6FA] disabled:cursor-not-allowed disabled:opacity-50'
              }
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={selection.clear}
            className="h-8 cursor-pointer rounded-full bg-transparent px-3 text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F6FA]"
          >
            {t('clear')}
          </button>
        </div>
      ) : null}
      {skipSentences.length > 0 ? (
        <p data-slot="directory-bulk-skip" className="w-full text-meta text-muted-foreground">
          {skipSentences.join(' ')}
        </p>
      ) : null}
    </div>
  );
}
