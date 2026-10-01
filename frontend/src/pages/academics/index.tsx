import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Building2, GraduationCap, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { academicsApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';

type Tab = 'departments' | 'classes' | 'subjects';

export function AcademicsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('classes');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: overview } = useQuery({ queryKey: ['academics-overview'], queryFn: academicsApi.getOverview });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: academicsApi.getDepartments, enabled: tab === 'departments' });
  const { data: classes } = useQuery({ queryKey: ['academics-classes'], queryFn: academicsApi.getClasses, enabled: tab === 'classes' });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: academicsApi.getSubjects, enabled: tab === 'subjects' });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (tab === 'departments') return academicsApi.createDepartment(form);
      if (tab === 'classes') return academicsApi.createClass(form);
      return academicsApi.createSubject(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowForm(false);
      setForm({});
    },
  });

  const tabs = [
    { id: 'departments' as Tab, label: 'Departments', icon: Building2 },
    { id: 'classes' as Tab, label: 'Classes', icon: GraduationCap },
    { id: 'subjects' as Tab, label: 'Subjects', icon: BookOpen },
  ];

  const list = tab === 'departments' ? departments : tab === 'classes' ? classes : subjects;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('academics.title')}</h1>
          <p className="text-muted-foreground">{t('academics.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Add New</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Departments" value={overview?.departments || 0} icon={Building2} />
        <StatCard title="Classes" value={overview?.classes || 0} icon={GraduationCap} />
        <StatCard title="Subjects" value={overview?.subjects || 0} icon={BookOpen} />
        <StatCard title="Students" value={overview?.students || 0} icon={Users} />
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === tabItem.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tabItem.icon className="h-4 w-4" /> {tabItem.label}
          </button>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add {tab.slice(0, -1)}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 max-w-lg">
            <Input label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {(tab === 'departments' || tab === 'subjects') && (
              <Input label="Code" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            )}
            {tab === 'classes' && (
              <Input label="Section" value={form.section || ''} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Save</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list?.map((item: { id: string; name: string; code?: string; section?: string; _count?: { students?: number; subjects?: number } }) => (
              <div key={item.id} className="p-4 rounded-lg border border-border hover:shadow-sm">
                <p className="font-medium">{item.name} {item.section || ''}</p>
                {item.code && <p className="text-sm text-muted-foreground">{item.code}</p>}
                {item._count?.students !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">{item._count.students} students</p>
                )}
                {item._count?.subjects !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">{item._count.subjects} subjects</p>
                )}
              </div>
            )) || <p className="text-muted-foreground col-span-full text-center py-8">No items yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
