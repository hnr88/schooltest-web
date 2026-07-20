export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-12">
      <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
