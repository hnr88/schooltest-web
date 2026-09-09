import { describe, expect, test } from 'vitest';

import * as neutral from '@/modules/directory';
import * as shim from '@/modules/ops/directory';

// Task 02 — the back-compat shim: every Ops-prefixed name must BE the neutral
// export (identity, not a wrapper), so the existing ops importers behave
// unchanged while the kit lives at `@/modules/directory`. Type-only aliases
// (OpsDirectoryTableProps, OpsDirectorySelectionApi) are erased at runtime and
// are covered by `pnpm typecheck` on the shim's importers instead.
describe('ops/directory shim parity', () => {
  test('every Ops-prefixed runtime alias is the neutral export', () => {
    expect(shim.OpsDirectoryTable).toBe(neutral.DirectoryTable);
    expect(shim.OpsDirectoryBulkBar).toBe(neutral.DirectoryBulkBar);
    expect(shim.OpsDirectoryPagination).toBe(neutral.DirectoryPagination);
    expect(shim.OpsDirectoryRows).toBe(neutral.DirectoryRows);
    expect(shim.OpsDirectoryEmpty).toBe(neutral.DirectoryEmpty);
    expect(shim.OpsDirectoryError).toBe(neutral.DirectoryError);
    expect(shim.OpsDirectoryLoading).toBe(neutral.DirectoryLoading);
    expect(shim.OpsDirectoryStaleBanner).toBe(neutral.DirectoryStaleBanner);
    expect(shim.OpsDirectoryToolbar).toBe(neutral.DirectoryToolbar);
    expect(shim.useOpsDirectoryState).toBe(neutral.useDirectoryState);
    expect(shim.useOpsDirectorySelection).toBe(neutral.useDirectorySelection);
  });

  test('the pass-through exports resolve identically on both paths', () => {
    expect(shim.applyClientDirectoryMode).toBe(neutral.applyClientDirectoryMode);
    expect(shim.DIRECTORY_DEFAULT_LABELS).toBe(neutral.DIRECTORY_DEFAULT_LABELS);
    expect(shim.toQueryParams).toBe(neutral.toQueryParams);
  });
});
