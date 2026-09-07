'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { DIRECTORY_DEFAULT_LABELS, OpsDirectoryError, OpsDirectoryLoading } from '@/modules/ops/directory';
import { useCommsTemplatesQuery } from '@/modules/ops/queries/use-comms-templates.query';

// C-OPSM-05 — the notification event registry, read-only.
//
// Named "templates" by the route, but these are the app's dispatch EVENTS: the
// server builds each row from EVENT_META, so there is no body to edit and no
// write route to offer. The one operationally important bit is whether an event
// actually sends mail, which the server states in `description` ("sends email"
// vs "in-app only") — surfaced here as a badge so it is readable at a glance
// rather than buried in a sentence.
//
// No pagination: the route returns the whole registry in one shot (no
// meta.pagination on the wire), so adding a pager would be inventing one.
const COLUMNS = ['key', 'subject', 'delivery'] as const;

const SENDS_EMAIL = 'sends email';

export function OpsCommsTemplates() {
  const t = useTranslations('Ops.comms');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const query = useCommsTemplatesQuery(hydrated && Boolean(token));

  const labels = {
    ...DIRECTORY_DEFAULT_LABELS,
    errorTitle: t('templates.error.title'),
    errorDescription: t('templates.error.description'),
    retry: t('templates.error.retry'),
    loadingLabel: t('templates.loadingLabel'),
  };

  return (
    <section data-slot="ops-comms-templates" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{t('templates.title')}</h2>
        <p className="text-sm text-body">{t('templates.description')}</p>
      </div>

      {query.isPending ? <OpsDirectoryLoading labels={labels} /> : null}
      {query.isError ? (
        <OpsDirectoryError labels={labels} onRetry={query.refetch} retrying={query.isFetching} />
      ) : null}

      {query.data ? (
        <Table data-slot="ops-comms-templates-table">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHead key={column}>{t(`templates.columns.${column}`)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  data-slot="ops-comms-templates-empty"
                  className="py-10 text-center text-muted-foreground"
                >
                  {t('templates.empty')}
                </TableCell>
              </TableRow>
            ) : (
              query.data.data.map((row) => {
                const sendsEmail = row.description.includes(SENDS_EMAIL);
                return (
                  <TableRow key={row.key} data-slot="ops-comms-template-row" data-template-key={row.key}>
                    <TableCell data-field="key" className="font-mono text-xs">
                      {row.key}
                    </TableCell>
                    <TableCell data-field="subject">{row.subject}</TableCell>
                    <TableCell data-field="delivery">
                      <Badge variant={sendsEmail ? 'default' : 'secondary'}>
                        {sendsEmail ? t('templates.sendsEmail') : t('templates.inAppOnly')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
