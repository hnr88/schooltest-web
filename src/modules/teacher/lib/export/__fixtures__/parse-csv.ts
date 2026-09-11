/** Reads RFC 4180 text back into records, so the specs check what a spreadsheet would read. */
export function parseCsv(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    const next = text.charAt(index + 1);
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\r' && next === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      index += 1;
    } else field += char;
  }
  record.push(field);
  records.push(record);
  return records;
}
