import { Link } from '@/i18n/navigation';
import { cmsPagePath } from '@/modules/cms/lib/cms-paths';
import type { CmsPageSummary } from '@/modules/cms/types/cms.types';

function ArticleCard({ article, dateLabel }: { article: CmsPageSummary; dateLabel: string | null }) {
  return (
    <article className="flex h-full flex-col rounded-card border border-border p-5">
      <h2 className="text-h4 font-semibold text-foreground">
        <Link href={cmsPagePath(article)} className="hover:text-primary hover:underline">
          {article.title}
        </Link>
      </h2>
      {article.summary ? <p className="mt-2 text-body-md leading-relaxed text-body">{article.summary}</p> : null}
      <p className="mt-auto pt-4 text-body-sm text-muted-foreground">
        {[article.author?.name, dateLabel].filter(Boolean).join(' · ')}
      </p>
    </article>
  );
}

export { ArticleCard };
