'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import {
  Alert,
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { OpsPipelineQueueRow } from '@/modules/ops/components/OpsPipelineQueueRow';
import { usePipelineHealthQuery } from '@/modules/ops/queries/use-pipeline-health.query';

// Ops pipeline-health screen (task 69, C-OPS-03, mvp-updates 4.2): the four
// BullMQ queues with live counts (auto-refetch every 10 s), the R scoring
// badge, and a retry control per queue for failed jobs.
export function OpsPipelineHealth() {
  const t = useTranslations('Ops.pipeline');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const healthQuery = usePipelineHealthQuery(hydrated && Boolean(token));

  if (healthQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (healthQuery.isError) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={healthQuery.isFetching}
              onClick={() => healthQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      </main>
    );
  }

  const health = healthQuery.data;

  return (
    <main
      data-slot="ops-pipeline"
      data-surface="ops-pipeline"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/ops/schools"
          className="w-fit text-sm text-body underline-offset-4 hover:underline"
        >
          {t('backToSchools')}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-body">{t('rLabel')}</span>
          <Badge
            data-surface="ops-pipeline-r-status"
            variant={health.r_scoring === 'up' ? 'success' : 'error'}
          >
            {health.r_scoring === 'up' ? t('rUp') : t('rDown')}
          </Badge>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnQueue')}</TableHead>
              <TableHead>{t('columnWaiting')}</TableHead>
              <TableHead>{t('columnActive')}</TableHead>
              <TableHead>{t('columnFailed')}</TableHead>
              <TableHead>{t('columnCompleted')}</TableHead>
              <TableHead>{t('columnRetry')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {health.queues.map((queue) => (
              <OpsPipelineQueueRow key={queue.name} queue={queue} />
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
