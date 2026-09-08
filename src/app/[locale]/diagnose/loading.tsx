// Task 09: route-level loading chrome for /eald/diagnose, shaped like its
// centred hero (eyebrow, two-line heading, body) plus the contained photo
// card. Bare pulse blocks, same convention as the root loading.
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-white to-background pb-8 pt-16 sm:pb-12 sm:pt-20">
        <div className="mx-auto w-full max-w-eald px-6 text-center">
          <div className="mx-auto h-3 w-48 animate-pulse rounded-sm bg-muted" />
          <div className="mx-auto mt-4 h-10 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto mt-3 h-10 w-2/3 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto mt-5 h-4 w-1/2 animate-pulse rounded-sm bg-muted" />
        </div>
        <div className="mx-auto mt-12 w-full max-w-hero px-6">
          <div className="min-h-64 w-full animate-pulse rounded-4xl bg-muted sm:min-h-80 lg:min-h-115" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-eald px-6 py-16">
        <div className="h-64 w-full animate-pulse rounded-4xl bg-muted" />
      </div>
    </div>
  );
}
