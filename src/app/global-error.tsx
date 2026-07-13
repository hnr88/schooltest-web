'use client';

// Replaces the root layout when it throws, so next-intl's provider is not
// available here — copy stays in plain English and styling avoids theme tokens.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        {error.digest ? <p className="text-xs opacity-60">#{error.digest}</p> : null}
        <button onClick={() => unstable_retry()} className="rounded-md border px-4 py-2 text-sm">
          Try again
        </button>
      </body>
    </html>
  );
}
