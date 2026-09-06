import { strapi } from '@/lib/axios/strapi';
import { filenameFromDisposition, OpsDownloadError } from '@/modules/ops/actions';

const FALLBACK_FILENAME = 'import-errors.csv';

/**
 * Download the server's `row,reason` report for the csv currently loaded.
 *
 * It goes through the shared Axios boundary (so the token rides the
 * Authorization header, never a query string) rather than the kit's
 * `downloadOpsFile`, because this one endpoint is a POST: it carries the csv.
 * The MIME check, the JSON-error parse and the object-URL revoke are the same
 * discipline the kit applies, for the same reason — a 500 must not land on
 * disk as a .csv the operator then reads as data.
 *
 * The browser saves the bytes the server returned. It does not re-derive the
 * rows: the report is the server's account of what IT rejected, and a
 * client-side rebuild could describe rows the server never saw.
 */
export async function downloadImportErrorReport(
  schoolDocumentId: string,
  csv: string,
  classDocumentId: string,
): Promise<string> {
  const res = await strapi.post<Blob>(
    `/api/ops/schools/${schoolDocumentId}/import-students/error-report.csv`,
    { csv, class_documentId: classDocumentId },
    { responseType: 'blob', opsPortalVersioned: true },
  );

  if (res.data.type.includes('json')) {
    throw new OpsDownloadError(res.status, null);
  }
  if (!res.data.type.startsWith('text/csv')) {
    throw new OpsDownloadError(res.status, null);
  }

  const filename = filenameFromDisposition(
    res.headers['content-disposition'] as string | undefined,
    FALLBACK_FILENAME,
  );
  const objectUrl = URL.createObjectURL(res.data);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
  return filename;
}
