/**
 * The list and detail surfaces both use the API's resolved cover URL as the
 * crest source. Empty strings are treated like a missing media relation so
 * MediaCover can render its neutral tile without making a broken request.
 */
export function getSchoolCrestSource(coverImageUrl: string | null | undefined): string | null {
  const source = coverImageUrl?.trim();
  return source === undefined || source === '' ? null : source;
}
