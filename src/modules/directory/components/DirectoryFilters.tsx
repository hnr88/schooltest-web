'use client';

/**
 * school-admin/02 — §L-filters' ONE filter renderer (U-07): every
 * `DirectoryFilterKind` dispatches from one def array, so adding a kind is a
 * row in `lib/directory-filter-kinds.ts` plus an arm here and no consumer
 * change. `kind` omitted IS the select arm — the same SelectField, id and
 * `DIRECTORY_ALL` value the toolbar's loop rendered, so existing consumers
 * render unchanged.
 *
 * R-15 — every string arrives by prop; this component reads no catalogue.
 * D-02 — `counts` renders on `kind: 'counted'` ONLY and comes from `meta`
 * through the def; the component takes no rows and never counts.
 * U-45 — with `options` pending the optioned arms render disabled with the
 * sentinel shown; the value passes through untouched, never coerced.
 */
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  ChoicePillGroup,
  FieldShell,
  FilterChipGroup,
  Input,
  SelectField,
} from '@/modules/design-system';

import { DIRECTORY_ALL } from '../constants/directory.constants';
import {
  directoryFilterKindOf,
  directoryFilterParamOf,
  directoryFilterRangeOf,
  directoryFilterValueOf,
  DIRECTORY_TOGGLE_ON,
  type AnyDirectoryFilterDef,
} from '../lib/directory-filter-kinds';
import type { DirectoryLabels, DirectoryOption } from '../types/directory.types';

export interface DirectoryFiltersProps<Row> {
  filters: readonly AnyDirectoryFilterDef<Row>[];
  /** The live URL value for a key — the state's string form (sentinel when unfiltered). */
  value: (key: string) => string;
  /** The ONE write path — the state hook's setFilter (elision + page reset live there). */
  onValueChange: (key: string, next: string) => void;
  labels: DirectoryLabels;
  /** Select ids stay `${idPrefix}-filter-${def.key}` — the toolbar's contract. */
  idPrefix: string;
  /** BUG-004 (ops design): selects as 40px pill selects, labels visually hidden. */
  pill?: boolean;
}

interface ArmProps<Row> {
  def: AnyDirectoryFilterDef<Row>;
  raw: string;
  write: (next: string) => void;
  id: string;
  labels: DirectoryLabels;
}

/** The pending (U-45) sentinel-only option list: disabled, with "All" shown. */
function pendingOptions(labels: DirectoryLabels, fallback: string): readonly DirectoryOption[] {
  return [{ value: DIRECTORY_ALL, label: labels.chipAllLabel ?? fallback }];
}

function SelectArm<Row>({ def, raw, write, id, labels, pill }: ArmProps<Row> & { pill?: boolean }) {
  const pending = def.options === undefined;
  return (
    <SelectField
      id={id}
      label={def.label}
      placeholder={def.label}
      options={(def.options ?? pendingOptions(labels, def.label)).map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      value={pending ? DIRECTORY_ALL : raw}
      onValueChange={write}
      disabled={pending}
      hideLabel={pill}
      triggerClassName={
        pill
          ? 'h-10 min-h-10 w-auto data-[size=default]:h-10 rounded-full border-[1.5px] px-3.5 text-[13.5px] font-medium'
          : undefined
      }
    />
  );
}

/** The `counted` absorb (OpsSchoolsPills): pill + whole-dataset count from `meta`. */
function PillRow({
  options,
  counts,
  raw,
  write,
  ariaLabel,
  disabled = false,
}: {
  options: readonly DirectoryOption[];
  counts: Readonly<Record<string, number>> | undefined;
  raw: string;
  write: (next: string) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="directory-filter-pills"
      className="flex flex-wrap items-center gap-2"
    >
      {options.map((option) => {
        const active = !disabled && option.value === raw;
        const count = counts?.[option.value];
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            data-slot={`directory-filter-pill-${option.value}`}
            onClick={() => write(option.value)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:border-primary'
            }`}
          >
            {option.label}
            {count === undefined ? null : (
              <span className={active ? 'ml-2 opacity-80' : 'ml-2 text-muted-foreground'}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ChipsArm<Row>(props: ArmProps<Row>) {
  const { def, raw, write, labels } = props;
  if (def.options === undefined) {
    return (
      <PillRow
        options={pendingOptions(labels, def.label)}
        counts={undefined}
        raw={raw}
        write={write}
        ariaLabel={def.label}
        disabled
      />
    );
  }
  return (
    <FilterChipGroup
      ariaLabel={def.label}
      value={raw}
      onValueChange={write}
      options={def.options.map((option) => ({
        value: option.value,
        label:
          option.value === DIRECTORY_ALL && option.label.trim() === ''
            ? (labels.chipAllLabel ?? option.label)
            : option.label,
      }))}
    />
  );
}

function CountedArm<Row>({ def, raw, write, labels }: ArmProps<Row>) {
  return (
    <PillRow
      options={def.options ?? pendingOptions(labels, def.label)}
      counts={def.counts}
      raw={raw}
      write={write}
      ariaLabel={def.label}
      disabled={def.options === undefined}
    />
  );
}

/** The `toggle` absorb (ChildrenToolbar): one boolean as an aria-pressed chip. */
function ToggleArm<Row>({ def, raw, write, id }: ArmProps<Row>) {
  const on = raw === DIRECTORY_TOGGLE_ON;
  return (
    <button
      type="button"
      id={id}
      aria-pressed={on}
      data-slot="directory-filter-toggle"
      onClick={() => write(on ? DIRECTORY_ALL : DIRECTORY_TOGGLE_ON)}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-body-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none pointer-coarse:min-h-11',
        on
          ? 'border-primary bg-blue-50 text-secondary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground',
      )}
    >
      {on ? <Check aria-hidden="true" className="size-4 text-primary" /> : null}
      {def.label}
    </button>
  );
}

/** The `multi` absorb (SchoolFilterControls): ChoicePillGroup in multiple mode. */
function MultiArm<Row>({ def, raw, write, labels }: ArmProps<Row>) {
  const selected = directoryFilterValueOf(def, raw);
  const values = Array.isArray(selected) ? selected : [];
  const pending = def.options === undefined;
  const options = pending
    ? pendingOptions(labels, def.label).map((option) => ({ ...option, disabled: true }))
    : def.options
        .filter((option) => option.value !== DIRECTORY_ALL)
        .map((option) => ({ value: option.value, label: option.label }));
  return (
    <ChoicePillGroup
      mode="multiple"
      size="md"
      className="gap-x-2.5 gap-y-5"
      ariaLabel={def.label}
      options={options}
      value={values}
      onValueChange={(next) => write(directoryFilterParamOf(def, next))}
    />
  );
}

/** The `text` absorb (the audit ledger): one labelled CONTAINS field. */
function TextArm<Row>({ def, raw, write, id }: ArmProps<Row>) {
  return (
    <FieldShell id={id} label={def.label} className="w-48">
      <Input
        id={id}
        type="search"
        autoComplete="off"
        placeholder={def.label}
        value={raw}
        onChange={(event) => write(event.target.value)}
      />
    </FieldShell>
  );
}

/** The `dateRange`/`numberRange` absorb: TWO fields, never a slider. */
function RangeArm<Row>({ def, raw, write, id, labels, number }: ArmProps<Row> & { number: boolean }) {
  const from = directoryFilterRangeOf(directoryFilterValueOf(def, raw));
  const commit = (side: 'from' | 'to', next: string) =>
    write(
      directoryFilterParamOf(
        def,
        side === 'from' ? { ...from, from: next } : { ...from, to: next },
      ),
    );
  const type = number ? 'number' : 'date';
  return (
    <div
      role="group"
      aria-label={def.label}
      data-slot={`directory-filter-${number ? 'number-range' : 'date-range'}`}
      className="flex items-end gap-2"
    >
      <FieldShell id={`${id}-from`} label={labels.filterFrom ?? def.label} className="w-36">
        <Input
          id={`${id}-from`}
          type={type}
          value={from.from ?? ''}
          onChange={(event) => commit('from', event.target.value)}
        />
      </FieldShell>
      <FieldShell id={`${id}-to`} label={labels.filterTo ?? def.label} className="w-36">
        <Input
          id={`${id}-to`}
          type={type}
          value={from.to ?? ''}
          onChange={(event) => commit('to', event.target.value)}
        />
      </FieldShell>
    </div>
  );
}

export function DirectoryFilters<Row>({
  filters,
  value,
  onValueChange,
  labels,
  idPrefix,
  pill = false,
}: DirectoryFiltersProps<Row>) {
  return (
    <>
      {filters
        .filter((def) => def.hidden !== true)
        .map((def) => {
          const id = `${idPrefix}-filter-${def.key}`;
          const raw = value(def.key);
          const write = (next: string) => onValueChange(def.key, next);
          const arm = { def, raw, write, id, labels } satisfies ArmProps<Row>;
          switch (directoryFilterKindOf(def)) {
            case 'select':
              return <SelectArm key={def.key} {...arm} pill={pill} />;
            case 'chips':
              return <ChipsArm key={def.key} {...arm} />;
            case 'counted':
              return <CountedArm key={def.key} {...arm} />;
            case 'toggle':
              return <ToggleArm key={def.key} {...arm} />;
            case 'multi':
              return <MultiArm key={def.key} {...arm} />;
            case 'text':
              return <TextArm key={def.key} {...arm} />;
            case 'dateRange':
              return <RangeArm key={def.key} {...arm} number={false} />;
            case 'numberRange':
              return <RangeArm key={def.key} {...arm} number />;
          }
        })}
    </>
  );
}
