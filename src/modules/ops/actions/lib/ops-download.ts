import { errorEnvelopeSchema, type ErrorEnvelope } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { OPS_DOWNLOAD_FALLBACK_FILENAME } from '@/modules/ops/actions/constants/ops-action.constants';

/** Thrown when a download responded with a JSON error body instead of a file. */
export class OpsDownloadError extends Error {
  constructor(
    readonly status: number,
    readonly envelope: ErrorEnvelope | null,
  ) {
    super(envelope?.error.message ?? 'the download failed');
    this.name = 'OpsDownloadError';
  }
}

/** Strip path separators and control characters: a server name is still input. */
function safeFilename(raw: string, fallback: string): string {
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]/g, '_')
    .trim();
  return cleaned === '' || cleaned === '.' || cleaned === '..' ? fallback : cleaned;
}

/**
 * `filename*=UTF-8''a%20b.csv` wins over `filename="a b.csv"`, per RFC 6266:
 * the extended form is the one that survives a non-ASCII name.
 */
export function filenameFromDisposition(header: string | undefined, fallback: string): string {
  const extended = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (extended !== undefined) {
    try {
      return safeFilename(decodeURIComponent(extended), fallback);
    } catch {
      /* a malformed encoding falls through to the quoted form below */
    }
  }
  const quoted = header?.match(/filename="([^"]*)"/)?.[1];
  return quoted === undefined ? fallback : safeFilename(quoted, fallback);
}

/** A JSON body on a download route is an error report, never a file to save. */
async function envelopeOfBlob(blob: Blob): Promise<ErrorEnvelope | null> {
  if (!blob.type.includes('json')) return null;
  try {
    const parsed = errorEnvelopeSchema.safeParse(JSON.parse(await blob.text()));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export interface OpsDownloadRequest {
  url: string;
  /** Repeated-form params (`documentIds=a&documentIds=b`), never a token. */
  params?: URLSearchParams;
  /** Expected media type, e.g. 'text/csv'. A mismatch is treated as an error. */
  expectedType: string;
  fallbackFilename?: string;
  versioned?: boolean;
}

export interface OpsDownloadedFile {
  filename: string;
  bytes: number;
}

/**
 * Fetch one file through the shared Axios boundary and hand it to the browser.
 *
 * Authentication rides on the interceptor's Authorization header, so no token
 * ever reaches a query string. A JSON body is parsed and thrown rather than
 * saved: the failure mode this guards is a 500 landing on disk as a .csv the
 * operator then reads as data.
 */
export async function downloadOpsFile(request: OpsDownloadRequest): Promise<OpsDownloadedFile> {
  const fallback = request.fallbackFilename ?? OPS_DOWNLOAD_FALLBACK_FILENAME;
  const res = await strapi.get<Blob>(request.url, {
    responseType: 'blob',
    params: request.params,
    opsPortalVersioned: request.versioned === true,
  });

  const envelope = await envelopeOfBlob(res.data);
  if (envelope !== null) throw new OpsDownloadError(res.status, envelope);
  if (!res.data.type.startsWith(request.expectedType)) {
    throw new OpsDownloadError(res.status, null);
  }

  const filename = filenameFromDisposition(
    res.headers['content-disposition'] as string | undefined,
    fallback,
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
  return { filename, bytes: res.data.size };
}

/**
 * Several files, one at a time, returning the list actually saved.
 *
 * Sequential on purpose: browsers block a burst of programmatic downloads, and
 * bundling into an archive would add a dependency to solve a problem a visible
 * file list solves honestly. The first failure stops the run, so the caller
 * reports what was saved rather than assuming the rest.
 */
export async function downloadOpsFiles(
  requests: readonly OpsDownloadRequest[],
): Promise<OpsDownloadedFile[]> {
  const saved: OpsDownloadedFile[] = [];
  for (const request of requests) saved.push(await downloadOpsFile(request));
  return saved;
}
