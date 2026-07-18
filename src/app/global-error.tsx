'use client';

import './globals.css';

// Replaces the root layout when it throws, so next-intl's provider is not
// available here — copy stays in plain English. Google Sans comes from the
// root layout's next/font wiring and falls back to the system stack here.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
        <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-9 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- global-error replaces the root layout; next/image is unavailable here */}
          <img src="/brand/logo-mark.png" alt="" className="h-13 w-auto opacity-80" />
          <h1 className="mt-4 text-base font-semibold">Something went wrong</h1>
          <p className="mt-1.5 max-w-75 text-sm text-muted-foreground">
            An unexpected error occurred while loading this page.
          </p>
          {error.digest ? (
            <p className="mt-2 text-xs text-muted-foreground">#{error.digest}</p>
          ) : null}
          <button
            onClick={() => unstable_retry()}
            className="mt-4.5 h-10 rounded-lg bg-primary px-4.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
