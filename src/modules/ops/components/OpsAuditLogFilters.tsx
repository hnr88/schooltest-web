'use client';

import { useTranslations } from 'next-intl';

import { Button, Input, Label } from '@/modules/design-system';
import {
  AUDIT_TEXT_FILTERS,
  type AuditLogControls,
} from '@/modules/ops/hooks/use-audit-log-controls';

// C-OPSA-01 — the ledger's filter bar. Both controls are SERVER parameters
// (case-insensitive contains), submitted on the form rather than per keystroke:
// the ledger is an operator search, not a type-ahead, and one request per
// intent is the honest read. Clearing is offered only when something is on.
export function OpsAuditLogFilters({ controls }: { controls: AuditLogControls }) {
  const t = useTranslations('Ops.audit.filters');

  return (
    <form
      data-slot="ops-audit-filters"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        // ONE write for both controls — see setFilters' note on clobbering.
        controls.setFilters(
          Object.fromEntries(
            AUDIT_TEXT_FILTERS.map((key) => [key, String(form.get(key) ?? '')]),
          ),
        );
      }}
    >
      {AUDIT_TEXT_FILTERS.map((key) => (
        <div key={key} className="flex min-w-48 flex-col gap-1">
          <Label htmlFor={`audit-filter-${key}`}>{t(key)}</Label>
          <Input
            id={`audit-filter-${key}`}
            name={key}
            defaultValue={controls.args[key] ?? ''}
            placeholder={t(`${key}Placeholder`)}
            autoComplete="off"
          />
        </div>
      ))}
      <Button type="submit" size="sm" data-slot="ops-audit-apply">
        {t('apply')}
      </Button>
      {controls.hasActiveFilters ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-slot="ops-audit-clear"
          onClick={controls.clear}
        >
          {t('clear')}
        </Button>
      ) : null}
    </form>
  );
}
