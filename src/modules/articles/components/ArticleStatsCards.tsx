'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STAT_ITEMS } from '@/modules/articles/constants/article.constants';
import { useArticleStatsQuery } from '@/modules/articles/queries/use-article-stats.query';

export function ArticleStatsCards() {
  const { data, isLoading } = useArticleStatsQuery();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {STAT_ITEMS.map((item) => (
        <Card key={item.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{data?.[item.key] ?? 0}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
