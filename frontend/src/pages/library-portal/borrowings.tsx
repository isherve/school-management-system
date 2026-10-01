import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookPlus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { libraryApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { LibraryModals, useLibraryModals } from '@/components/library/library-modals';
import { LibraryPortalNav } from '@/components/layout/library-portal-nav';

interface Borrowing {
  id: string;
  borrowedAt: string;
  dueDate: string;
  notes?: string;
  book: { title: string; author?: string };
  student: {
    user: { firstName: string; lastName: string; email?: string };
    class?: { name: string; section?: string };
  };
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

export function LibraryPortalBorrowingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const modals = useLibraryModals();

  const { data: borrowings, isLoading } = useQuery({
    queryKey: ['library-borrowings', true],
    queryFn: () => libraryApi.getBorrowings(true),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => libraryApi.returnBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-borrowings'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
    },
  });

  const rows = (borrowings || []) as Borrowing[];

  return (
    <div className="space-y-6">
      <LibraryPortalNav />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('libraryNav.borrowings')}</h1>
          <p className="text-muted-foreground">{t('library.studentsBorrowed')}</p>
        </div>
        <Button onClick={() => modals.openBorrow()}>
          <BookPlus className="h-4 w-4" /> {t('library.borrowBook')}
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        emptyMessage={t('library.noBorrowings')}
        data={rows}
        keyExtractor={(b) => b.id}
        columns={[
          {
            key: 'student',
            header: t('common.student'),
            render: (b) => (
              <div>
                <p className="font-medium">{b.student.user.firstName} {b.student.user.lastName}</p>
                <p className="text-xs text-muted-foreground">
                  {b.student.class ? `${b.student.class.name}${b.student.class.section ? ` ${b.student.class.section}` : ''}` : b.student.user.email}
                </p>
              </div>
            ),
          },
          {
            key: 'book',
            header: t('common.book'),
            render: (b) => (
              <div>
                <p>{b.book.title}</p>
                <p className="text-xs text-muted-foreground">{b.book.author}</p>
              </div>
            ),
          },
          { key: 'borrowed', header: t('common.borrowedAt'), render: (b) => formatDate(b.borrowedAt) },
          {
            key: 'due',
            header: t('common.returnDate'),
            render: (b) => isOverdue(b.dueDate) ? <StatusBadge status="OVERDUE" /> : formatDate(b.dueDate),
          },
          {
            key: 'notes',
            header: t('common.notes'),
            className: 'max-w-[180px]',
            render: (b) => <span className="truncate text-muted-foreground">{b.notes || '—'}</span>,
          },
          {
            key: 'actions',
            header: t('common.actions'),
            className: 'text-right',
            render: (b) => (
              <Button variant="outline" size="sm" onClick={() => returnMutation.mutate(b.id)} disabled={returnMutation.isPending}>
                <RotateCcw className="h-4 w-4" /> {t('common.return')}
              </Button>
            ),
          },
        ]}
      />

      <LibraryModals {...modals} />
    </div>
  );
}
