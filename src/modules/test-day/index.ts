// The test-day console (tasks 63-65, 90-139) is RETIRED (Teacher Portal v2, R1
// PART B): the class detail's Live sessions tab (`teacher/components/live/*`)
// runs the sitting now. What is left here is the SITTING API surface that tab
// reads and writes — the class's sittings, its monitor, its activity trail, and
// the room / per-student / settings commands.
export { useClassSittingsQuery } from './queries/use-class-sittings.query';
export { useSittingSettingsMutation } from './queries/use-sitting-settings.mutation';
export type { ClassSitting, SittingMonitor, MonitorStudent } from './types/test-day.types';
export { useSittingActivityQuery } from './queries/use-sitting-activity.query';
export { useLogIncidentMutation } from './queries/use-log-incident.mutation';
export { useRoomControlMutation } from './queries/use-room-control.mutation';
export { useStudentControlMutation } from './queries/use-student-control.mutation';
export { useSittingMonitorQuery } from './queries/use-sitting-monitor.query';
export { useMarkAbsentMutation } from './queries/use-mark-absent.mutation';
export { sittingMonitorSchema } from './schemas/test-day.schema';
