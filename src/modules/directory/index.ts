/**
 * Task 02 — the generic directory kit (`@/modules/directory`), portal-neutral.
 *
 * One kit for search, filters, sort, pagination, row menus, selection and
 * bulk actions over any list that follows the directory contract shape (`q`,
 * filters, `sort`, `page`, `pageSize` -> `data` + `meta.pagination`), in
 * `server` mode (the consumer's query applies the params) or `client` mode
 * (`applyClientDirectoryMode` reduces a loaded array). Consuming surfaces call
 * useDirectoryState, spread its `params` into their query (server) or into
 * `applyClientDirectoryMode` (client), and render DirectoryTable. This barrel
 * is the module's only public entry.
 */
export { DirectoryTable, type DirectoryTableProps } from './components/DirectoryTable';
export { DirectoryBulkBar } from './components/DirectoryBulkBar';
export { DirectoryPagination } from './components/DirectoryPagination';
export { DirectoryRows } from './components/DirectoryRows';
export {
  DirectoryEmpty,
  DirectoryError,
  DirectoryLoading,
  DirectoryStaleBanner,
} from './components/DirectoryStates';
export { DirectoryToolbar } from './components/DirectoryToolbar';
export { DirectoryList, type DirectoryListLayout } from './components/DirectoryList';
export { useDirectoryState } from './hooks/use-directory-state';
export {
  useDirectorySelection,
  type DirectorySelectionOptions,
} from './hooks/use-directory-selection';
export {
  clampPage,
  defaultUrlState,
  isDefaultUrlState,
  parseDirectoryParams,
  queryParamsIdentity,
  sanitizeQuery,
  serializeDirectoryParams,
  toQueryParams,
} from './lib/directory-url';
export { applyClientDirectoryMode } from './lib/client-mode';
export {
  DIRECTORY_QUICK_ACTION_MAX,
  buildDirectoryRowGroups,
  quickActionsOf,
  resolveRowKey,
  type DirectoryRowApiInput,
  type DirectoryRowEntry,
  type DirectoryRowGroup,
} from './lib/directory-row-api';
export {
  DIRECTORY_ALL,
  DIRECTORY_DEFAULT_LABELS,
  DIRECTORY_PARAMS,
  DIRECTORY_PAGE_SIZE_DEFAULT,
  DIRECTORY_PAGE_SIZE_MAX,
  DIRECTORY_Q_MAX,
  DIRECTORY_SEARCH_DEBOUNCE_MS,
} from './constants/directory.constants';
export type {
  DirectoryBulkAction,
  DirectoryGroupDef,
  DirectoryLayout,
  DirectoryLayoutProps,
  DirectoryRowApi,
  DirectoryRowNavProps,
  DirectoryRowTargetProps,
  DirectoryClientConfig,
  DirectoryClientResult,
  DirectoryColumnDef,
  DirectoryFilterDef,
  DirectoryFilterValues,
  DirectoryLabels,
  DirectoryMeta,
  DirectoryMode,
  DirectoryOption,
  DirectoryQueryParams,
  DirectoryQueryStatus,
  DirectoryRowAction,
  DirectorySelectionApi,
  DirectorySortDef,
  DirectorySortValues,
  DirectoryStateApi,
  DirectoryUrlState,
  UseDirectoryStateOptions,
} from './types/directory.types';
