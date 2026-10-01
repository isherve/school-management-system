import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, BookMarked, AlertCircle, Library, Plus, Pencil, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { libraryApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { LibraryModals, useLibraryModals } from '@/components/library/library-modals';

interface Book {
  id: string;
  title: string;
  author?: string;
  category?: string;
  description?: string;
  available: number;
  quantity: number;
  isbn?: string;
  location?: string;
}

interface Borrowing {
  id: string;
  dueDate: string;
  returnedAt?: string | null;
  borrowedAt: string;
  notes?: string;
  book: { title: string };
  student: { user: { firstName: string; lastName: string }; class?: { name: string; section?: string } };
}

export function LibraryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const modals = useLibraryModals();

  const { data: stats } = useQuery({ queryKey: ['library-stats'], queryFn: libraryApi.getStats });
  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ['library-books'],
    queryFn: () => libraryApi.getBooks({ limit: '100' }),
  });
  const { data: borrowings, isLoading: borrowLoading } = useQuery({
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

  const books: Book[] = booksData?.data || [];
  const rows = (borrowings || []) as Borrowing[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('library.title')}</h1>
          <p className="text-muted-foreground">{t('library.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/portals/library">
            <Button variant="outline"><ExternalLink className="h-4 w-4" /> {t('library.openPortal')}</Button>
          </Link>
          <Button variant="outline" onClick={() => modals.openBorrow()}>{t('library.borrowBook')}</Button>
          <Button onClick={() => modals.setShowAdd(true)}><Plus className="h-4 w-4" /> {t('library.addBook')}</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('library.totalBooks')} value={stats?.totalBooks || 0} icon={Library} />
        <StatCard title={t('library.available')} value={stats?.available || 0} icon={BookOpen} />
        <StatCard title={t('library.borrowed')} value={stats?.borrowed || 0} icon={BookMarked} />
        <StatCard title={t('library.overdue')} value={stats?.overdue || 0} icon={AlertCircle} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">{t('library.catalog')}</h2>
        <DataTable
          isLoading={booksLoading}
          emptyMessage={t('library.noBooks')}
          data={books}
          keyExtractor={(b) => b.id}
          columns={[
            { key: 'title', header: t('common.title'), render: (b) => <span className="font-medium">{b.title}</span> },
            { key: 'author', header: t('common.author'), render: (b) => b.author || '—' },
            { key: 'category', header: t('common.category'), render: (b) => b.category || '—' },
            { key: 'stock', header: `${t('common.available')}/${t('common.quantity')}`, render: (b) => `${b.available}/${b.quantity}` },
            { key: 'desc', header: t('common.description'), className: 'max-w-[220px]', render: (b) => <span className="line-clamp-2 text-muted-foreground text-xs">{b.description || '—'}</span> },
            {
              key: 'actions', header: t('common.actions'), className: 'text-right',
              render: (b) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => modals.setEditBook({ ...b })}><Pencil className="h-4 w-4" /></Button>
                  {b.available > 0 && <Button variant="outline" size="sm" onClick={() => modals.openBorrow(b.id)}>{t('common.borrow')}</Button>}
                </div>
              ),
            },
          ]}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">{t('library.studentsBorrowed')}</h2>
        <DataTable
          isLoading={borrowLoading}
          emptyMessage={t('library.noBorrowings')}
          data={rows}
          keyExtractor={(b) => b.id}
          columns={[
            {
              key: 'student', header: t('common.student'),
              render: (b) => (
                <div>
                  <p className="font-medium">{b.student.user.firstName} {b.student.user.lastName}</p>
                  {b.student.class && <p className="text-xs text-muted-foreground">{b.student.class.name}</p>}
                </div>
              ),
            },
            { key: 'book', header: t('common.book'), render: (b) => b.book.title },
            { key: 'borrowed', header: t('common.borrowedAt'), render: (b) => formatDate(b.borrowedAt) },
            {
              key: 'due', header: t('common.returnDate'),
              render: (b) => !b.returnedAt && new Date(b.dueDate) < new Date()
                ? <StatusBadge status="OVERDUE" /> : formatDate(b.dueDate),
            },
            { key: 'notes', header: t('common.notes'), render: (b) => b.notes || '—' },
            {
              key: 'actions', header: t('common.actions'), className: 'text-right',
              render: (b) => (
                <Button variant="outline" size="sm" onClick={() => returnMutation.mutate(b.id)} disabled={returnMutation.isPending}>
                  {t('common.return')}
                </Button>
              ),
            },
          ]}
        />
      </div>

      <LibraryModals {...modals} />
    </div>
  );
}
