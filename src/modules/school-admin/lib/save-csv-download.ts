// C-RPT-05 (task 78): persist the fetched CSV text as a file download through
// an object URL (the task 77 markdown-download pattern). The filename is fixed
// by the server's export contract (school-results.csv).
export function saveCsvDownload(csv: string, filename = 'school-results.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
