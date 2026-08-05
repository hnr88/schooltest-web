// Server refusals are surfaced VERBATIM rather than as a generic failure: the
// C-TCH-02/03 guards ("you cannot remove your own account", "…the last active
// school administrator"), the C-INV-01 409 and the C-TCH-04 duplicate-email 400
// are the only way the admin learns why nothing happened.
/** The API's own refusal message, when it sent one — never a swallowed error. */
export function serverMessage(error: unknown): string | null {
  const message = (error as { response?: { data?: { error?: { message?: unknown } } } })?.response
    ?.data?.error?.message;
  return typeof message === 'string' && message.trim().length > 0 ? message : null;
}
