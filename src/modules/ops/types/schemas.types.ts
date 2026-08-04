import type { RecoveryMonitor } from '@/modules/ops/schemas/recovery.schema';

export type RecoveryMonitorStudent = RecoveryMonitor['students'][number];

export type OnboardSchemaTranslator = (key: string) => string;
