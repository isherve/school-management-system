import { useQuery } from '@tanstack/react-query';
import { BookOpen, BookMarked, AlertCircle, Library, Plus, BookPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { libraryApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { LibraryModals, useLibraryModals } from '@/components/library/library-modals';
import { LibraryPortalNav } from '@/components/layout/library-portal-nav';

interface Borrowing {
  id: string;
  dueDate: string;
  returnedAt?: string | null;
  book: { title: string };
  student: { user: { firstName: string; lastName: string } };
}

export function LibraryPortalDashboard() {
  const { t } = useTranslation();
  const modals = useLibraryModals();

  const { data: stats } = useQuery({ queryKey: ['library-stats'], queryFn: libraryApi.getStats });
  const { data: borrowings, isLoading } = useQuery({
    queryKey: ['library-borrowings', true],
    queryFn: () => libraryApi.getBorrowings(true),
  });

  const recent = (borrowings || []).slice(0, 8) as Borrowing[];

  return (
    <div className="space-y-6">
      <LibraryPortalNav />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('library.portalTitle')}</h1>
          <p className="text-muted-foreground">{t('library.portalSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => modals.openBorrow()}>
            <BookPlus className="h-4 w-4" /> {t('library.borrowBook')}
          </Button>
          <Button onClick={() => modals.setShowAdd(true)}>
            <Plus className="h-4 w-4" /> {t('library.addBook')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('library.totalBooks')} value={stats?.totalBooks || 0} icon={Library} />
        <StatCard title={t('library.available')} value={stats?.available || 0} icon={BookOpen} />
        <StatCard title={t('library.borrowed')} value={stats?.borrowed || 0} icon={BookMarked} />
        <StatCard title={t('library.overdue')} value={stats?.overdue || 0} icon={AlertCircle} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('library.recentActivity')}</CardTitle>
          <Link to="/admin/portals/library/borrowings">
            <Button variant="outline" size="sm">{t('common.all')}</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <DataTable
            isLoading={isLoading}
            emptyMessage={t('library.noBorrowings')}
            data={recent}
            keyExtractor={(b) => b.id}
            columns={[
              {
                key: 'student',
                header: t('common.student'),
                render: (b) => `${b.student.user.firstName} ${b.student.user.lastName}`,
              },
              { key: 'book', header: t('common.book'), render: (b) => b.book.title },
              {
                key: 'due',
                header: t('common.returnDate'),
                render: (b) => {
                  const overdue = !b.returnedAt && new Date(b.dueDate) < new Date();
                  return overdue ? <StatusBadge status="OVERDUE" /> : formatDate(b.dueDate);
                },
              },
            ]}
          />
        </CardContent>
      </Card>

      <LibraryModals {...modals} />
    </div>
  );
}
