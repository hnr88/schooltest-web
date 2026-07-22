import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/modules/design-system/components/button';
import { StatusBadge } from '@/modules/design-system/components/status-badge';
import { SHOWCASE_TABLE_ROWS } from '@/modules/design-system/constants/showcase-table.constants';

async function DataTable() {
  const t = await getTranslations('DesignSystem');
  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableCaption>{t('tableCaption')}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tableTest')}</TableHead>
            <TableHead>{t('tableDate')}</TableHead>
            <TableHead>{t('tableQuestions')}</TableHead>
            <TableHead>{t('tableAvg')}</TableHead>
            <TableHead>{t('tableStatus')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SHOWCASE_TABLE_ROWS.map((row) => (
            <TableRow key={row.nameKey}>
              <TableCell className="font-medium">{t(row.nameKey)}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell>{row.questions}</TableCell>
              <TableCell>{row.avg}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} label={t(row.labelKey)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} />
            <TableCell>76</TableCell>
            <TableCell>8.6</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('tableShowing')}</p>
        <Pagination className="mx-0 w-auto" aria-label={t('paginationNavAria')}>
          <PaginationContent>
            <PaginationItem>
              <Button href="#" variant="ghost" aria-label={t('paginationPreviousAria')}>
                <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
                {t('paginationPrevious')}
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button href="#" variant="outline" size="icon" aria-current="page">
                1
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button href="#" variant="ghost" size="icon">
                2
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button href="#" variant="ghost" size="icon">
                3
              </Button>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <Button href="#" variant="ghost" aria-label={t('paginationNextAria')}>
                {t('paginationNext')}
                <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export { DataTable };
