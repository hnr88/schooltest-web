import { z } from 'zod';

// C-OPS-03 (task 69, st-mvp-pivot): the ops pipeline-health payload — BullMQ
// counts for the four registered queues plus the R scoring probe. The health
// payload carries no job ids, so the retry control takes a manual job id.

export const pipelineQueueSchema = z.object({
  name: z.string(),
  waiting: z.number(),
  active: z.number(),
  failed: z.number(),
  completed: z.number(),
});

export type PipelineQueue = z.infer<typeof pipelineQueueSchema>;

export const pipelineHealthSchema = z.object({
  queues: z.array(pipelineQueueSchema),
  r_scoring: z.enum(['up', 'down']),
});

export type PipelineHealth = z.infer<typeof pipelineHealthSchema>;

// C-OPS-03 retry response (`{ data: { retried: true } }`).
export const pipelineRetryResultSchema = z.object({
  retried: z.literal(true),
});
