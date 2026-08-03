import type { Metadata } from 'next';

import { NOINDEX_ROBOTS } from '@/modules/seo';

import { ArticlesList, ArticleStatsCards, CreateArticleForm } from '@/modules/articles';

// Not a public product page (.qa/DECISIONS.md D-27): robots.txt disallows it,
// and this declaration keeps it out of the index under EVERY locale prefix,
// which a bare robots Disallow line cannot express.
export const metadata: Metadata = { robots: NOINDEX_ROBOTS };

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
