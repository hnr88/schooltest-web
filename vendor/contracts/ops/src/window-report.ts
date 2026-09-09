/**
 * C-OPS-PORTAL-055/056 — the window report and its PDF export (backlog task
 * 29). ONE contract for both consumers: the JSON report the ops UI renders and
 * the PDF the export controller draws through pdfkit.
 *
 * IDENTITY: the report is a DERIVED view of one window, not a stored entity —
 * its `documentId` IS the window's documentId, and the pair
 * `school_documentId` + `window_documentId` is what the caller authorized.
 * `generated_at` is the server instant the derivation ran.
 *
 * Whole-window totals (`eligible`, `sat`, `excluded_invalidated`) are computed
 * ONCE per generation from the shared official-attempt derivation
 * (api/form-window/lib/window-official-results) and are INDEPENDENT of row
 * pagination: paginating `results` must never change a total. Pending scores
 * live in `pending` — a student who has not scored is never presented as zero.
 */
import { z } from 'zod';

import { documentIdSchema, type OpsOperation } from './core';

const COUNT_MAX = 2_147_483_647;
export const REPORT_PAGE_MAX = 100_000;
export const REPORT_PAGE_SIZE_DEFAULT = 25;
export const REPORT_PAGE_SIZE_MAX = 200;

const timestampSchema = z.iso.datetime({ offset: true });

export const reportResultRowSchema = z.strictObject({
  student_documentId: z.string().min(1),
  result_documentId: z.string().min(1),
  cefr_level: z.string().max(10).nullable(),
  /** Null means the score is PENDING — it is never presented as zero. */
  percentage: z.number().min(0).max(100).nullable(),
});
export type ReportResultRow = z.infer<typeof reportResultRowSchema>;

export const reportPaginationSchema = z.strictObject({
  page: z.number().int().min(1).max(REPORT_PAGE_MAX),
  pageSize: z.number().int().min(1).max(REPORT_PAGE_SIZE_MAX),
  pageCount: z.number().int().min(0).max(COUNT_MAX),
  total: z.number().int().min(0).max(COUNT_MAX),
});

export const windowReportSchema = z.strictObject({
  /** The report belongs to its window — the window's documentId. */
  documentId: z.string().min(1),
  school_documentId: z.string().min(1),
  window_documentId: z.string().min(1),
  generated_at: timestampSchema,
  eligible: z.number().int().min(0).max(COUNT_MAX),
  sat: z.number().int().min(0).max(COUNT_MAX),
  results: z.array(reportResultRowSchema).max(REPORT_PAGE_SIZE_MAX),
  excluded_invalidated: z.number().int().min(0).max(COUNT_MAX),
  pagination: reportPaginationSchema,
});
export type WindowReport = z.infer<typeof windowReportSchema>;

export const windowReportQuerySchema = z.strictObject({
  page: z.number().int().min(1).max(REPORT_PAGE_MAX).optional(),
  pageSize: z.number().int().min(1).max(REPORT_PAGE_SIZE_MAX).optional(),
});
export type WindowReportQuery = z.infer<typeof windowReportQuerySchema>;

export const windowReportResponseSchema = z.strictObject({ data: windowReportSchema });
export type WindowReportResponse = z.infer<typeof windowReportResponseSchema>;

/** The PDF and the report take no body; unknown keys are rejected, not dropped. */
export const emptyReportBody = z.strictObject({});

export function windowReportPath(schoolDocumentId: string, windowDocumentId: string, query: WindowReportQuery = {}): string {
  const pairs: [string, string][] = [];
  if (query.page !== undefined) pairs.push(['page', String(query.page)]);
  if (query.pageSize !== undefined) pairs.push(['pageSize', String(query.pageSize)]);
  const search = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  const base = `/api/ops/schools/${encodeURIComponent(schoolDocumentId)}/result-windows/${encodeURIComponent(windowDocumentId)}/report`;
  return search === '' ? base : `${base}?${search}`;
}

/** C-OPS-PORTAL-055 — GET /api/ops/schools/{documentId}/result-windows/{windowDocumentId}/report */
export const WindowReportOperation: OpsOperation<
  typeof windowReportQuerySchema,
  typeof windowReportResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-055',
  method: 'GET',
  path: '/api/ops/schools/{documentId}/result-windows/{windowDocumentId}/report',
  request: windowReportQuerySchema,
  response: windowReportResponseSchema,
  success: 200,
  errors: [400, 401, 403, 404, 429, 500],
});

/** C-OPS-PORTAL-056 — GET .../report.pdf (200 = the PDF bytes; never a 2xx JSON). */
export const WindowPdfOperation: OpsOperation<typeof emptyReportBody, typeof emptyReportBody> =
  Object.freeze({
    contractId: 'C-OPS-PORTAL-056',
    method: 'GET',
    path: '/api/ops/schools/{documentId}/result-windows/{windowDocumentId}/report.pdf',
    request: emptyReportBody,
    // The response is a BINARY attachment, not the JSON envelope — the
    // operation pins method/path/statuses only; the body streams raw.
    response: emptyReportBody,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
  });
