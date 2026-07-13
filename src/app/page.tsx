export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <main className="flex max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Schooltest</h1>
        <p className="text-lg text-muted-foreground">
          Next.js 16 frontend for the Schooltest platform.
        </p>
      </main>
    </div>
  );
}
