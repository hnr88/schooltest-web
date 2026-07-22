'use client';

import { useRecordCrumb } from '@/modules/shell/hooks/use-record-crumb';
import type { RecordCrumbProps } from '@/modules/shell/types/shell.types';

// Declarative form of useRecordCrumb for pages that only need to name the record
// they are showing. Renders nothing — the crumb is drawn by AppTopbar, so the app
// keeps EXACTLY ONE breadcrumb and it ends at the record:
//   <RecordCrumb label={child.full_name} />
// Marked 'use client', but the props are serializable, so a Server Component may
// render it directly.
function RecordCrumb({ label }: RecordCrumbProps) {
  useRecordCrumb(label);
  return null;
}

export { RecordCrumb };
