// Task 09: route-level loading chrome for /eald/track, shaped like its hero
// (eyebrow, heading, body over a wide media band). Bare pulse blocks, same
// convention as the root loading.
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-white to-background pb-8 pt-16 sm:pb-12 sm:pt-20">
        <div className="mx-auto w-full max-w-eald px-6 text-center">
          <div className="mx-auto h-3 w-40 animate-pulse rounded-sm bg-muted" />
          <div className="mx-auto mt-4 h-10 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="mx-auto mt-5 h-4 w-5/12 animate-pulse rounded-sm bg-muted" />
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
