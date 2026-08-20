import type { RecoveryMonitor } from '@/modules/ops/schemas/recovery.schema';

export type RecoveryMonitorStudent = RecoveryMonitor['students'][number];

export type OnboardSchemaTranslator = (key: string) => string;

export type { FormWindowFormValues } from '@/modules/ops/schemas/form-window.schema';
export type { ImportCommitResult, ImportCreateRow, ImportRejectRow, ImportSkipRow } from '@/modules/ops/schemas/import.schema';
export type { RecoverySitting } from '@/modules/ops/schemas/recovery.schema';
export type { SectionTimers, SectionTimersFormValues } from '@/modules/ops/schemas/section-timers.schema';
