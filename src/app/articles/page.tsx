import { ArticlesList, ArticleStatsCards, CreateArticleForm } from '@/modules/articles';

export default function ArticlesPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Articles</h1>
        <p className="text-sm text-muted-foreground">
          Example module wired end-to-end to the Strapi <code>article</code> API.
        </p>
      </header>

      <ArticleStatsCards />

      <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ArticlesList />
        <CreateArticleForm />
      </section>
    </main>
  );
}
