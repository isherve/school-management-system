import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { libraryApi, studentApi } from '@/services/endpoints';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';

interface Book {
  id: string;
  title: string;
  author?: string;
  available: number;
}

interface LibraryModalsProps {
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  showBorrow: boolean;
  setShowBorrow: (v: boolean) => void;
  editBook: {
    id: string; title: string; author?: string; category?: string;
    description?: string; quantity: number; isbn?: string; location?: string;
  } | null;
  setEditBook: (v: LibraryModalsProps['editBook']) => void;
  prefillBookId?: string;
}

const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
};

export function LibraryModals({
  showAdd, setShowAdd, showBorrow, setShowBorrow, editBook, setEditBook, prefillBookId,
}: LibraryModalsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', author: '', category: '', quantity: '1', description: '', isbn: '', location: '',
  });
  const [borrowForm, setBorrowForm] = useState({
    bookId: prefillBookId || '', studentId: '', dueDate: defaultDueDate(), notes: '',
  });

  const { data: booksData } = useQuery({
    queryKey: ['library-books'],
    queryFn: () => libraryApi.getBooks({ limit: '100' }),
    enabled: showBorrow,
  });
  const { data: studentsData } = useQuery({
    queryKey: ['library-students'],
    queryFn: () => studentApi.getAll({ limit: '100' }),
    enabled: showBorrow,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['library-books'] });
    queryClient.invalidateQueries({ queryKey: ['library-borrowings'] });
    queryClient.invalidateQueries({ queryKey: ['library-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: () => libraryApi.createBook({ ...form, quantity: Number(form.quantity) }),
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
      setForm({ title: '', author: '', category: '', quantity: '1', description: '', isbn: '', location: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => libraryApi.updateBook(editBook!.id, {
      title: editBook!.title,
      author: editBook!.author,
      category: editBook!.category,
      description: editBook!.description,
      quantity: editBook!.quantity,
      isbn: editBook!.isbn,
      location: editBook!.location,
    }),
    onSuccess: () => { invalidate(); setEditBook(null); },
  });

  const borrowMutation = useMutation({
    mutationFn: () => libraryApi.borrow({
      ...borrowForm,
      bookId: borrowForm.bookId || prefillBookId || '',
    }),
    onSuccess: () => {
      invalidate();
      setShowBorrow(false);
      setBorrowForm({ bookId: '', studentId: '', dueDate: defaultDueDate(), notes: '' });
    },
  });

  const books: Book[] = booksData?.data || [];
  const students = studentsData?.data || [];

  return (
    <>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('library.addBook')}>
        <div className="space-y-4">
          <Input label={t('common.title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label={t('common.author')} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          <Input label={t('common.category')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label={t('library.isbn')} value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
          <Input label={t('library.shelf')} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label={t('common.quantity')} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <div>
            <label className="text-sm font-medium mb-1 block">{t('common.description')}</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('library.descPlaceholder')} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => createMutation.mutate()} disabled={!form.title || createMutation.isPending}>
              {createMutation.isPending ? t('common.saving') : t('library.addBook')}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editBook} onClose={() => setEditBook(null)} title={t('library.editBook')}>
        {editBook && (
          <div className="space-y-4">
            <Input label={t('common.title')} value={editBook.title} onChange={(e) => setEditBook({ ...editBook, title: e.target.value })} />
            <Input label={t('common.author')} value={editBook.author || ''} onChange={(e) => setEditBook({ ...editBook, author: e.target.value })} />
            <Input label={t('common.quantity')} type="number" value={String(editBook.quantity)} onChange={(e) => setEditBook({ ...editBook, quantity: Number(e.target.value) })} />
            <div>
              <label className="text-sm font-medium mb-1 block">{t('common.description')}</label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                value={editBook.description || ''} onChange={(e) => setEditBook({ ...editBook, description: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('common.saving') : t('admin.saveChanges')}
              </Button>
              <Button variant="outline" onClick={() => setEditBook(null)}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showBorrow} onClose={() => setShowBorrow(false)} title={t('library.borrowBook')}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('common.book')}</label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={borrowForm.bookId || prefillBookId || ''}
              onChange={(e) => setBorrowForm({ ...borrowForm, bookId: e.target.value })}>
              <option value="">{t('library.selectBook')}</option>
              {books.filter((b) => b.available > 0).map((b) => (
                <option key={b.id} value={b.id}>{b.title} ({b.available})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('common.student')}</label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={borrowForm.studentId} onChange={(e) => setBorrowForm({ ...borrowForm, studentId: e.target.value })}>
              <option value="">{t('library.selectStudent')}</option>
              {students.map((s: { id: string; user: { firstName: string; lastName: string }; admissionNumber?: string }) => (
                <option key={s.id} value={s.id}>{s.user.firstName} {s.user.lastName} {s.admissionNumber ? `(${s.admissionNumber})` : ''}</option>
              ))}
            </select>
          </div>
          <Input label={t('common.returnDate')} type="date" value={borrowForm.dueDate}
            onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })} />
          <div>
            <label className="text-sm font-medium mb-1 block">{t('common.notes')}</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
              value={borrowForm.notes} onChange={(e) => setBorrowForm({ ...borrowForm, notes: e.target.value })}
              placeholder={t('library.notesPlaceholder')} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => borrowMutation.mutate()}
              disabled={!borrowForm.bookId || !borrowForm.studentId || !borrowForm.dueDate || borrowMutation.isPending}>
              {borrowMutation.isPending ? t('library.processing') : t('library.recordBorrowing')}
            </Button>
            <Button variant="outline" onClick={() => setShowBorrow(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function useLibraryModals() {
  const [showAdd, setShowAdd] = useState(false);
  const [showBorrow, setShowBorrow] = useState(false);
  const [editBook, setEditBook] = useState<LibraryModalsProps['editBook']>(null);
  const [prefillBookId, setPrefillBookId] = useState<string | undefined>();

  const openBorrow = (bookId?: string) => {
    if (bookId) setPrefillBookId(bookId);
    setShowBorrow(true);
  };

  return { showAdd, setShowAdd, showBorrow, setShowBorrow, editBook, setEditBook, prefillBookId, openBorrow };
}
