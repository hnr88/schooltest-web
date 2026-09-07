'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { FlagRow } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import { Card, Switch } from '@/modules/design-system';
import { DIRECTORY_DEFAULT_LABELS, OpsDirectoryError, OpsDirectoryLoading } from '@/modules/ops/directory';
import { useFlagToggleMutation } from '@/modules/ops/queries/use-flag-toggle.mutation';
import { useOpsFlagsQuery } from '@/modules/ops/queries/use-ops-flags.query';

// C-OPSF-01/02 — the feature-flag registry with a live per-key toggle.
//
// Rendered from the SERVER's registry, never a local list: the API's
// KNOWN_FLAG_KEYS is closed and authoritative, so a flag added there appears
// here without a web change, and a key this console invented would be a 400.
//
// The switch sends the TARGET value explicitly and stays disabled while its own
// row is in flight, so a double-click cannot queue two opposite writes. Only
// the row being toggled disables — one slow request should not freeze the rest
// of the registry.
export function OpsFlagsRegistry() {
  const t = useTranslations('Ops.flags');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const query = useOpsFlagsQuery(hydrated && Boolean(token));
  const toggle = useFlagToggleMutation();

  const labels = {
    ...DIRECTORY_DEFAULT_LABELS,
    errorTitle: t('registry.error.title'),
    errorDescription: t('registry.error.description'),
    retry: t('registry.error.retry'),
    loadingLabel: t('registry.loadingLabel'),
  };

  const handleToggle = async (row: FlagRow, next: boolean) => {
    try {
      const result = await toggle.mutateAsync({ key: row.key, enabled: next });
      toast.success(
        result.enabled ? t('registry.enabledToast', { key: result.key }) : t('registry.disabledToast', { key: result.key }),
      );
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message;
      toast.error(message ?? t('registry.errorToast'));
    }
  };

  return (
    <section data-slot="ops-flags-registry" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{t('registry.title')}</h2>
        <p className="text-sm text-body">{t('registry.description')}</p>
      </div>

      {query.isPending ? <OpsDirectoryLoading labels={labels} /> : null}
      {query.isError ? (
        <OpsDirectoryError labels={labels} onRetry={query.refetch} retrying={query.isFetching} />
      ) : null}

      {query.data ? (
        <div className="flex flex-col gap-3">
          {query.data.data.length === 0 ? (
            <p data-slot="ops-flags-empty" className="py-6 text-center text-sm text-muted-foreground">
              {t('registry.empty')}
            </p>
          ) : (
            query.data.data.map((row) => {
              const pending = toggle.isPending && toggle.variables?.key === row.key;
              return (
                <Card
                  key={row.key}
                  data-slot="ops-flag-row"
                  data-flag-key={row.key}
                  data-flag-enabled={row.enabled ? 'true' : 'false'}
                  className="flex items-start justify-between gap-4 p-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm font-medium text-foreground">{row.key}</span>
                    <span className="text-sm text-body">{row.description}</span>
                  </div>
                  <Switch
                    aria-label={t('registry.toggleLabel', { key: row.key })}
                    data-slot="ops-flag-switch"
                    checked={row.enabled}
                    disabled={pending}
                    onCheckedChange={(next) => void handleToggle(row, next)}
                  />
                </Card>
              );
            })
          )}
        </div>
      ) : null}
    </section>
  );
}
