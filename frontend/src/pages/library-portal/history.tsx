import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/shared/data-table';
import { libraryApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { LibraryPortalNav } from '@/components/layout/library-portal-nav';

interface Borrowing {
  id: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fine?: number;
  notes?: string;
  book: { title: string; author?: string };
  student: {
    user: { firstName: string; lastName: string };
    class?: { name: string; section?: string };
  };
}

export function LibraryPortalHistoryPage() {
  const { t } = useTranslation();

  const { data: borrowings, isLoading } = useQuery({
    queryKey: ['library-borrowings', false],
    queryFn: () => libraryApi.getBorrowings(false),
  });

  const rows = ((borrowings || []) as Borrowing[]).filter((b) => b.returnedAt);

  return (
    <div className="space-y-6">
      <LibraryPortalNav />
      <div>
        <h1 className="text-2xl font-bold">{t('libraryNav.history')}</h1>
        <p className="text-muted-foreground">{t('library.returnHistory')}</p>
      </div>

      <DataTable
        isLoading={isLoading}
        emptyMessage={t('library.noHistory')}
        data={rows}
        keyExtractor={(b) => b.id}
        columns={[
          {
            key: 'student',
            header: t('common.student'),
            render: (b) => `${b.student.user.firstName} ${b.student.user.lastName}`,
          },
          { key: 'book', header: t('common.book'), render: (b) => b.book.title },
          { key: 'borrowed', header: t('common.borrowedAt'), render: (b) => formatDate(b.borrowedAt) },
          { key: 'due', header: t('common.dueDate'), render: (b) => formatDate(b.dueDate) },
          { key: 'returned', header: t('common.returnedAt'), render: (b) => b.returnedAt ? formatDate(b.returnedAt) : '—' },
          {
            key: 'fine',
            header: t('common.fine'),
            render: (b) => b.fine ? `${b.fine} RWF` : '—',
          },
          {
            key: 'notes',
            header: t('common.notes'),
            render: (b) => b.notes || '—',
          },
        ]}
      />
    </div>
  );
}
