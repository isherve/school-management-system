import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { examApi, academicsApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';

export function ExamsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', classId: '', subjectId: '', type: 'MID_TERM', totalMarks: '100', passMarks: '50',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => examApi.getAll({ limit: '20' }),
  });

  const { data: classes } = useQuery({ queryKey: ['academics-classes'], queryFn: academicsApi.getClasses, enabled: showCreate });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: academicsApi.getSubjects, enabled: showCreate });

  const createMutation = useMutation({
    mutationFn: () => examApi.create({
      ...form,
      totalMarks: Number(form.totalMarks),
      passMarks: Number(form.passMarks),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setShowCreate(false);
    },
  });

  const exams = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('exams.title')}</h1>
          <p className="text-muted-foreground">{t('exams.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create Exam</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Exams</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : exams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No exams yet</p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam: {
                id: string; name: string; type: string; status: string; totalMarks: number;
                class: { name: string }; subject: { name: string }; _count: { results: number };
              }) => (
                <div key={exam.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{exam.name}</p>
                    <p className="text-sm text-muted-foreground">{exam.subject.name} · {exam.class.name} · {exam.type.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={exam.status} />
                    <span className="text-sm text-muted-foreground">{exam._count.results} results</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Exam">
        <div className="space-y-4">
          <Input label="Exam Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Class</label>
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select...</option>
                {classes?.map((c: { id: string; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select...</option>
                {subjects?.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Marks" type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
            <Input label="Pass Marks" type="number" value={form.passMarks} onChange={(e) => setForm({ ...form, passMarks: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.name || !form.classId || !form.subjectId}>
              {createMutation.isPending ? 'Creating...' : 'Create Exam'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
