/** Which single-use link the screen claims — the two emails' web fallbacks. */
export type MagicLinkVariant = 'student' | 'teacher';

/** The display slice a successful claim renders (never the token or jwt). */
export interface MagicLinkSuccessView {
  /** Student first name, or the teacher's username — headline companion. */
  name: string | null;
  /** Class and school line (student only), when the API has them on file. */
  detail: string | null;
}

export interface MagicLinkVerifyScreenProps {
  variant: MagicLinkVariant;
  /** The raw single-use token from the emailed link's query string. */
  token: string;
}
