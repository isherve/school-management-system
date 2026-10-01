import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { teacherApi } from '@/services/endpoints';
import { getInitials } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export function TeachersPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: 'Admin@123', qualification: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherApi.getAll({ limit: '20' }),
  });

  const createMutation = useMutation({
    mutationFn: () => teacherApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', email: '', password: 'Admin@123', qualification: '' });
    },
  });

  const teachers = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('teachers.title')}</h1>
          <p className="text-muted-foreground">{t('teachers.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Teacher</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Teaching Staff</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher: {
                id: string; employeeId: string; qualification?: string;
                user: { firstName: string; lastName: string; email: string };
                department?: { name: string };
              }) => (
                <div key={teacher.id} className="rounded-lg border border-border p-4 hover:shadow-sm transition-shadow bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {getInitials(teacher.user.firstName, teacher.user.lastName)}
                    </div>
                    <div>
                      <p className="font-medium">{teacher.user.firstName} {teacher.user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{teacher.employeeId}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{teacher.department?.name || 'No department'}</p>
                  <p className="text-sm">{teacher.qualification || 'N/A'}</p>
                </div>
              ))}
              {teachers.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No teachers yet</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Teacher">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          <div className="flex gap-2 pt-2">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.email}>
              {createMutation.isPending ? 'Saving...' : 'Add Teacher'}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
