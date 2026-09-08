// Task 09: route-level loading chrome for the home route, shaped like the
// page it fronts — the full-bleed hero band (breadcrumb, eyebrow, two heading
// lines, body, CTA row), the four-cell stat strip, the field-testing row and
// one content section. Bare pulse blocks, same convention as the old generic
// root skeleton this file replaces.
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy-950">
        <div className="mx-auto w-full max-w-eald px-6 py-24">
          <div className="mb-5 h-3 w-28 animate-pulse rounded-sm bg-navy-muted/40" />
          <div className="max-w-2xl">
            <div className="h-3 w-52 animate-pulse rounded-sm bg-teal-500/40" />
            <div className="mt-4 h-10 w-4/5 animate-pulse rounded-md bg-white/15" />
            <div className="mt-3 h-10 w-3/5 animate-pulse rounded-md bg-white/15" />
            <div className="mt-5 h-4 w-11/12 animate-pulse rounded-sm bg-navy-soft/40" />
            <div className="mt-8 flex gap-3">
              <div className="h-12 w-44 animate-pulse rounded-lg bg-white/15" />
              <div className="h-12 w-44 animate-pulse rounded-lg bg-white/10" />
            </div>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto grid w-full max-w-eald grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((cell) => (
              <div key={cell} className="py-5 lg:px-6 lg:first:pl-6">
                <div className="h-2.5 w-20 animate-pulse rounded-sm bg-navy-muted/40" />
                <div className="mt-2 h-6 w-14 animate-pulse rounded-sm bg-white/15" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-b border-border py-6">
        <div className="mx-auto flex w-full max-w-eald items-center gap-10 px-6">
          <div className="h-3 w-24 shrink-0 animate-pulse rounded-sm bg-muted" />
          <div className="h-6 w-56 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-eald px-6 py-16">
        <div className="h-64 w-full animate-pulse rounded-4xl bg-muted" />
      </div>
    </div>
  );
}
