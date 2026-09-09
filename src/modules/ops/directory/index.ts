/**
 * Task 02 — back-compat shim. The kit moved to the portal-neutral
 * `@/modules/directory`; this barrel re-exports it under the original
 * `Ops…` names so the existing ops importers compile and behave unchanged.
 * Nothing but re-exports lives here.
 */
export * from '@/modules/directory';
export {
  DirectoryTable as OpsDirectoryTable,
  type DirectoryTableProps as OpsDirectoryTableProps,
  DirectoryBulkBar as OpsDirectoryBulkBar,
  DirectoryPagination as OpsDirectoryPagination,
  DirectoryRows as OpsDirectoryRows,
  DirectoryEmpty as OpsDirectoryEmpty,
  DirectoryError as OpsDirectoryError,
  DirectoryLoading as OpsDirectoryLoading,
  DirectoryStaleBanner as OpsDirectoryStaleBanner,
  DirectoryToolbar as OpsDirectoryToolbar,
  useDirectoryState as useOpsDirectoryState,
  useDirectorySelection as useOpsDirectorySelection,
} from '@/modules/directory';
export type { DirectorySelectionApi as OpsDirectorySelectionApi } from '@/modules/directory';

/**
 * teacher/01 — the layout axis. These names never had an `Ops…` form, but the
 * shim aliases every NEW export as well as the old ones: a missing alias is a
 * compile error inside one of the seven importers this task may not touch.
 */
export { DirectoryList as OpsDirectoryList } from '@/modules/directory';
export type {
  DirectoryGroupDef as OpsDirectoryGroupDef,
  DirectoryLayout as OpsDirectoryLayout,
  DirectoryLayoutProps as OpsDirectoryLayoutProps,
  DirectoryListLayout as OpsDirectoryListLayout,
  DirectoryRowApi as OpsDirectoryRowApi,
  DirectoryRowGroup as OpsDirectoryRowGroup,
  DirectoryRowNavProps as OpsDirectoryRowNavProps,
  DirectoryRowTargetProps as OpsDirectoryRowTargetProps,
} from '@/modules/directory';
