import { DIRECTORY_ALL } from '@/modules/directory';
import type {
  DirectoryClientConfig,
  DirectoryFilterDef,
  DirectorySortDef,
} from '@/modules/directory';

import type { RosterChild } from '@/modules/teach/types/roster.types';

import { rosterDisplayName } from '@/modules/teach/lib/roster-table.helpers';

// ops/33 — the roster's directory configuration, so RosterTable stays a
// renderer. Everything here is the kit's `client` mode contract (D-KIT-MODE):
// the C-CHD-01 endpoint serves no list params, so search, the status filter
// and the sorts reduce the loaded array. "Most-recent result" (the task file's
// sort sketch) does not exist on C-CHD-01 — the design's score sorts are
// likewise unservable on this endpoint — so name is the only honest sort.
export function rosterFilters(labels: {
  label: string;
  all: string;
  active: string;
  archived: string;
}): readonly DirectoryFilterDef[] {
  return [
    {
      key: 'status',
      label: labels.label,
      options: [
        { value: DIRECTORY_ALL, label: labels.all },
        { value: 'active', label: labels.active },
        { value: 'archived', label: labels.archived },
      ],
    },
  ];
}

export function rosterSorts(labels: { asc: string; desc: string }): readonly DirectorySortDef[] {
  return [
    { value: 'name:asc', label: labels.asc },
    { value: 'name:desc', label: labels.desc },
  ];
}

const byName = (a: RosterChild, b: RosterChild): number =>
  rosterDisplayName(a).localeCompare(rosterDisplayName(b)) ||
  a.documentId.localeCompare(b.documentId);

export const rosterClientConfig: DirectoryClientConfig<RosterChild> = {
  searchText: (row) => [rosterDisplayName(row), row.email ?? ''].filter(Boolean),
  filterPredicates: {
    status: (row, value) => row.status === value,
  },
  comparators: {
    'name:asc': byName,
    'name:desc': (a, b) => byName(b, a),
  },
};
