/**
 * Task 04 — the generic ops directory kit (`@/modules/ops/directory`).
 *
 * One kit for search, filters, sort, pagination, row menus, selection and
 * bulk actions over any server-filtered list that follows the ops contract
 * shape (`q`, filters, `sort`, `page`, `pageSize` -> `data` + `meta.pagination`).
 * Consuming surface tasks (07, 13, 18, 22, 25) call useOpsDirectoryState,
 * spread its `params` into their query, and render OpsDirectoryTable. This
 * barrel is the module's only public entry.
 */
export { OpsDirectoryTable, type OpsDirectoryTableProps } from './components/OpsDirectoryTable';
export { OpsDirectoryBulkBar } from './components/OpsDirectoryBulkBar';
export { OpsDirectoryPagination } from './components/OpsDirectoryPagination';
export { OpsDirectoryRows } from './components/OpsDirectoryRows';
export {
  OpsDirectoryEmpty,
  OpsDirectoryError,
  OpsDirectoryLoading,
  OpsDirectoryStaleBanner,
} from './components/OpsDirectoryStates';
export { OpsDirectoryToolbar } from './components/OpsDirectoryToolbar';
export { useOpsDirectoryState } from './hooks/use-ops-directory-state';
export { useOpsDirectorySelection } from './hooks/use-ops-directory-selection';
export {
  clampPage,
  defaultUrlState,
  isDefaultUrlState,
  parseDirectoryParams,
  queryParamsIdentity,
  sanitizeQuery,
  serializeDirectoryParams,
  toQueryParams,
} from './lib/ops-directory-url';
export {
  DIRECTORY_ALL,
  DIRECTORY_DEFAULT_LABELS,
  DIRECTORY_PARAMS,
  DIRECTORY_PAGE_SIZE_DEFAULT,
  DIRECTORY_PAGE_SIZE_MAX,
  DIRECTORY_Q_MAX,
  DIRECTORY_SEARCH_DEBOUNCE_MS,
} from './constants/ops-directory.constants';
export type {
  DirectoryBulkAction,
  DirectoryColumnDef,
  DirectoryFilterDef,
  DirectoryFilterValues,
  DirectoryLabels,
  DirectoryMeta,
  DirectoryOption,
  DirectoryQueryParams,
  DirectoryQueryStatus,
  DirectoryRowAction,
  DirectorySortDef,
  DirectorySortValues,
  DirectoryStateApi,
  DirectoryUrlState,
  OpsDirectorySelectionApi,
  UseDirectoryStateOptions,
} from './types/ops-directory.types';
