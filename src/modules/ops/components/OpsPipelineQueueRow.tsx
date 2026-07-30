'use client';

import { useTranslations } from 'next-intl';

import { Button, Input, TableCell, TableRow } from '@/modules/design-system';
import { usePipelineRetryForm } from '@/modules/ops/hooks/use-pipeline-retry-form';
import type { PipelineQueue } from '@/modules/ops/schemas/pipeline.schema';

interface OpsPipelineQueueRowProps {
  queue: PipelineQueue;
}

// One queue row of the C-OPS-03 panel (task 69): live BullMQ counts plus the
// failed-job retry control. The health payload carries no job ids, so the
// control accepts a manual job id (the contract's accepted shape).
export function OpsPipelineQueueRow({ queue }: OpsPipelineQueueRowProps) {
  const t = useTranslations('Ops.pipeline');
  const { jobId, setJobId, submit, pending } = usePipelineRetryForm(queue.name);

  return (
    <TableRow data-surface={`ops-pipeline-queue-${queue.name}`}>
      <TableCell className="font-medium text-foreground">{queue.name}</TableCell>
      <TableCell>{queue.waiting}</TableCell>
      <TableCell>{queue.active}</TableCell>
      <TableCell>{queue.failed}</TableCell>
      <TableCell>{queue.completed}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            aria-label={t('retryLabel', { queue: queue.name })}
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
            placeholder={t('retryPlaceholder')}
            className="h-11 w-48"
            disabled={queue.failed === 0}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 px-3"
            loading={pending}
            disabled={queue.failed === 0 || jobId.trim() === ''}
            onClick={() => void submit()}
          >
            {t('retryButton')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
