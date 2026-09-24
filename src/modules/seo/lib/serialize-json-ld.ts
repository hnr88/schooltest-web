const UNSAFE_CHARACTERS: Readonly<Record<string, string>> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * JSON for a `<script type="application/ld+json">` body. Escaping `<`, `>` and
 * `&` means no string value can close the tag (`</script>`) or open a comment
 * (`<!--`); U+2028/2029 are escaped for older JS parsers. The output is still
 * valid JSON that parses back to the identical object.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (char) => UNSAFE_CHARACTERS[char] ?? char);
}
