import { strapi } from '@/lib/axios/strapi';

// C-RPT-03 (task 77, mvp spec 4.10): the teacher's markdown LLM export. The
// server gates the route (teacher | school_admin | ops) and scopes the class,
// so a forbidden class rejects here and the button shows its error state. The
// file downloads through an object URL; the filename comes from the server's
// Content-Disposition header, never hardcoded.
export async function downloadClassExportMarkdown(classDocumentId: string): Promise<void> {
  const res = await strapi.get<Blob>(`/api/schools/me/classes/${classDocumentId}/export.md`, {
    responseType: 'blob',
  });
  const disposition = res.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? 'class-diagnostic.md';

  const url = URL.createObjectURL(res.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
