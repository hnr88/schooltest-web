'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticlesQuery } from '@/modules/articles/queries/use-articles.query';
import { useArticlesFiltersStore } from '@/modules/articles/stores/use-articles-filters.store';

export function ArticlesList() {
  const search = useArticlesFiltersStore((s) => s.search);
  const page = useArticlesFiltersStore((s) => s.page);
  const setSearch = useArticlesFiltersStore((s) => s.setSearch);
  const setPage = useArticlesFiltersStore((s) => s.setPage);

  const { data, isLoading, isPlaceholderData } = useArticlesQuery({ search, page });

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search articles…"
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.items.map((article) => (
            <Card key={article.documentId}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{article.title}</CardTitle>
                  {article.featured ? <Badge>Featured</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="capitalize">{article.category}</span>
                <span>{article.views} views</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No articles found.</p>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {data?.page ?? page} of {data?.pageCount ?? 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={isPlaceholderData || (data ? page >= data.pageCount : true)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
