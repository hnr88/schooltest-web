// D5 — Google OAuth end-to-end wiring (credentials + /auth/google/callback page)
// lands in task 14. Until this flips true, the sign-in card renders the Google
// button per the DS card as a plain anchor to the api connect route
// (C-AUTH-GOOGLE), which stays env-gated server-side and answers a typed 400
// while the provider has no credentials.
export const GOOGLE_ENABLED = false;
