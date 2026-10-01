import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { studentApi, academicsApi } from '@/services/endpoints';
import { PageHeader } from '@/components/shared/page-header';
import { useTranslation } from '@/i18n';
import { getInitials } from '@/lib/utils';

export function StudentsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: 'Admin@123', classId: '',
    parentEmail: '', parentRelationship: 'Parent',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: () => studentApi.getAll({ page: String(page), limit: '10', search }),
  });

  const { data: classes } = useQuery({
    queryKey: ['academics-classes'],
    queryFn: academicsApi.getClasses,
    enabled: showAdd,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const { parentEmail, parentRelationship, ...rest } = form;
      return studentApi.create({
        ...rest,
        ...(parentEmail.trim()
          ? {
              guardians: [{
                parentEmail: parentEmail.trim(),
                relationship: parentRelationship,
                isPrimary: true,
              }],
            }
          : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAdd(false);
      setForm({
        firstName: '', lastName: '', email: '', password: 'Admin@123', classId: '',
        parentEmail: '', parentRelationship: 'Parent',
      });
    },
  });

  const students = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader titleKey="students.title" subtitleKey="students.subtitle" />
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> {t('students.addStudent')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle>All Students ({meta?.total || 0})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Student</th>
                    <th className="text-left py-3 px-2 font-medium">Admission No.</th>
                    <th className="text-left py-3 px-2 font-medium">Class</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: {
                    id: string;
                    admissionNumber: string;
                    isActive: boolean;
                    user: { firstName: string; lastName: string; email: string };
                    class?: { name: string; section?: string };
                  }) => (
                    <tr key={student.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {getInitials(student.user.firstName, student.user.lastName)}
                          </div>
                          <div>
                            <p className="font-medium">{student.user.firstName} {student.user.lastName}</p>
                            <p className="text-xs text-muted-foreground">{student.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs">{student.admissionNumber}</td>
                      <td className="py-3 px-2">
                        {student.class ? `${student.class.name} ${student.class.section || ''}` : 'Unassigned'}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={student.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!meta.hasPrev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Student">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Class</label>
            <select
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select class...</option>
              {classes?.map((c: { id: string; name: string; section?: string }) => (
                <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>
              ))}
            </select>
          </div>
          <Input
            label={t('students.parentEmail')}
            type="email"
            value={form.parentEmail}
            onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
          />
          <p className="text-xs text-muted-foreground -mt-2">{t('students.parentEmailHint')}</p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('students.parentRelationship')}</label>
            <select
              value={form.parentRelationship}
              onChange={(e) => setForm({ ...form, parentRelationship: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="Parent">Parent</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Guardian">Guardian</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.email || !form.firstName}>
              {createMutation.isPending ? 'Saving...' : 'Add Student'}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
