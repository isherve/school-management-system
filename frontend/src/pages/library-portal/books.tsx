import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, BookPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { libraryApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';
import { LibraryModals, useLibraryModals } from '@/components/library/library-modals';
import { LibraryPortalNav } from '@/components/layout/library-portal-nav';

interface Book {
  id: string;
  title: string;
  author?: string;
  category?: string;
  description?: string;
  isbn?: string;
  location?: string;
  available: number;
  quantity: number;
}

export function LibraryPortalBooksPage() {
  const { t } = useTranslation();
  const modals = useLibraryModals();

  const { data: booksData, isLoading } = useQuery({
    queryKey: ['library-books'],
    queryFn: () => libraryApi.getBooks({ limit: '100' }),
  });

  const books: Book[] = booksData?.data || [];

  return (
    <div className="space-y-6">
      <LibraryPortalNav />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('libraryNav.books')}</h1>
          <p className="text-muted-foreground">{t('library.catalog')}</p>
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

      <DataTable
        isLoading={isLoading}
        emptyMessage={t('library.noBooks')}
        data={books}
        keyExtractor={(b) => b.id}
        columns={[
          { key: 'title', header: t('common.title'), render: (b) => <span className="font-medium">{b.title}</span> },
          { key: 'author', header: t('common.author'), render: (b) => b.author || '—' },
          { key: 'category', header: t('common.category'), render: (b) => b.category || '—' },
          { key: 'isbn', header: t('library.isbn'), render: (b) => b.isbn || '—' },
          { key: 'location', header: t('library.shelf'), render: (b) => b.location || '—' },
          {
            key: 'stock',
            header: `${t('common.available')}/${t('common.quantity')}`,
            render: (b) => `${b.available}/${b.quantity}`,
          },
          {
            key: 'desc',
            header: t('common.description'),
            className: 'max-w-[200px]',
            render: (b) => <span className="line-clamp-2 text-muted-foreground">{b.description || '—'}</span>,
          },
          {
            key: 'actions',
            header: t('common.actions'),
            className: 'text-right',
            render: (b) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => modals.setEditBook({ ...b })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {b.available > 0 && (
                  <Button variant="outline" size="sm" onClick={() => modals.openBorrow(b.id)}>
                    {t('common.borrow')}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <LibraryModals {...modals} />
    </div>
  );
}
