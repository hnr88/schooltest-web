/**
 * The ops directory kit's label bundle, filled from the Audit console's own
 * catalog. The kit ships English defaults and lets the adopting surface own the
 * translations (the Ops.schools pattern); only the pager, loading and error
 * labels are actually rendered by the pieces this console reuses.
 */
import { DIRECTORY_DEFAULT_LABELS, type DirectoryLabels } from '@/modules/ops/directory';

export interface AuditLabelCopy {
  paginationLabel: string;
  previous: string;
  next: string;
  pageCount: (values: { page: number; pageCount: number; total: number }) => string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  loadingLabel: string;
}

export function auditDirectoryLabels(copy: AuditLabelCopy): DirectoryLabels {
  return { ...DIRECTORY_DEFAULT_LABELS, ...copy };
}
