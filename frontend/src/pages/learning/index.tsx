import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, FileText, Plus, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { PortalShortcuts } from '@/components/shared/portal-shortcuts';
import { SubmissionDownloadLink } from '@/components/shared/assignment-actions';
import { parseAttachment } from '@/lib/file-url';
import { modulesApi, academicsApi } from '@/services/endpoints';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAuthStore, useToastStore } from '@/stores';

export function LearningPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const role = useAuthStore((s) => s.user?.role);
  const isTeacher = role === 'TEACHER' || role === 'CLASS_TEACHER' || ['PRINCIPAL', 'VICE_PRINCIPAL', 'SCHOOL_OWNER', 'SUPER_ADMIN'].includes(role || '');
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(searchParams.get('action') === 'create');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ classId: '', subjectId: '', title: '', description: '', dueDate: '', totalMarks: '20' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [gradeForm, setGradeForm] = useState<Record<string, { marks: string; feedback: string }>>({});

  useEffect(() => {
    if (searchParams.get('action') === 'create') setCreateOpen(true);
  }, [searchParams]);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['learning-assignments'],
    queryFn: modulesApi.learning.getAssignments,
  });
  const { data: classes } = useQuery({
    queryKey: ['academics-classes'],
    queryFn: academicsApi.getClasses,
    enabled: isTeacher && createOpen,
  });
  const { data: subjects } = useQuery({
    queryKey: ['academics-subjects'],
    queryFn: academicsApi.getSubjects,
    enabled: isTeacher && createOpen,
  });
  const { data: detail } = useQuery({
    queryKey: ['learning-assignment', selectedId],
    queryFn: () => modulesApi.learning.getAssignment(selectedId!),
    enabled: !!selectedId && isTeacher,
  });

  const createMutation = useMutation({
    mutationFn: () => modulesApi.learning.createAssignment(form, pdfFile || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-assignments'] });
      setCreateOpen(false);
      setSearchParams({});
      setForm({ classId: '', subjectId: '', title: '', description: '', dueDate: '', totalMarks: '20' });
      setPdfFile(null);
      pushToast(t('learning.assignmentPublished'), 'success');
    },
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, marks, feedback }: { id: string; marks?: number; feedback?: string }) =>
      modulesApi.learning.gradeSubmission(id, { marks, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-assignment', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['learning-assignments'] });
      pushToast(t('learning.gradeSaved'), 'success');
    },
  });

  const closeCreate = () => {
    setCreateOpen(false);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('learning.title')}</h1>
          <p className="text-muted-foreground">{t('learning.subtitle')}</p>
        </div>
        {isTeacher && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('learning.createAssignment')}
          </Button>
        )}
      </div>

      {isTeacher && <PortalShortcuts role="TEACHER" />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('learning.assignmentsList')}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>
            ) : (
              <div className="space-y-3">
                {assignments?.map((a: {
                  id: string; title: string; description?: string; dueDate: string; totalMarks: number;
                  class: { name: string }; subject: { name: string }; attachments?: unknown;
                  _count: { submissions: number };
                }) => {
                  const material = parseAttachment(a.attachments);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => isTeacher && setSelectedId(a.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedId === a.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{a.title}</p>
                          <p className="text-sm text-muted-foreground">{a.subject.name} · {a.class.name}</p>
                          {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>}
                          {material && (
                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" /> {material.fileName}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm flex items-center gap-1 justify-end">
                            <Calendar className="h-3 w-3" /> {formatDate(a.dueDate)}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                            <Users className="h-3 w-3" /> {a._count.submissions} {t('learning.submissions')}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                }) || <p className="text-muted-foreground text-center py-8">{t('learning.noAssignments')}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {isTeacher && (
          <Card>
            <CardHeader>
              <CardTitle>
                {detail ? detail.title : t('learning.selectAssignment')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedId ? (
                <p className="text-muted-foreground text-center py-8">{t('learning.selectAssignmentHint')}</p>
              ) : !detail ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              ) : (
                <div className="space-y-3">
                  {parseAttachment(detail.attachments) && (
                    <SubmissionDownloadLink
                      fileUrl={parseAttachment(detail.attachments)!.fileUrl}
                      label={t('learning.downloadMaterial')}
                    />
                  )}
                  {detail.submissions?.length ? detail.submissions.map((s: {
                    id: string; marks?: number | null; feedback?: string | null; fileUrl?: string | null;
                    submittedAt: string;
                    student: { user: { firstName: string; lastName: string } };
                  }) => {
                    const gf = gradeForm[s.id] || { marks: s.marks != null ? String(s.marks) : '', feedback: s.feedback || '' };
                    return (
                      <div key={s.id} className="p-3 rounded-lg border border-border space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-medium text-sm">
                              {s.student.user.firstName} {s.student.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(s.submittedAt)}</p>
                          </div>
                          {s.fileUrl && <SubmissionDownloadLink fileUrl={s.fileUrl} />}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            placeholder={t('learning.marks')}
                            value={gf.marks}
                            onChange={(e) => setGradeForm((prev) => ({ ...prev, [s.id]: { ...gf, marks: e.target.value } }))}
                          />
                          <Input
                            placeholder={t('learning.feedbackPlaceholder')}
                            value={gf.feedback}
                            onChange={(e) => setGradeForm((prev) => ({ ...prev, [s.id]: { ...gf, feedback: e.target.value } }))}
                          />
                        </div>
                        <Button
                          size="sm"
                          disabled={gradeMutation.isPending}
                          onClick={() => gradeMutation.mutate({
                            id: s.id,
                            marks: gf.marks ? Number(gf.marks) : undefined,
                            feedback: gf.feedback || undefined,
                          })}
                        >
                          {t('learning.saveGrade')}
                        </Button>
                      </div>
                    );
                  }) : (
                    <p className="text-muted-foreground text-center py-4">{t('learning.noSubmissions')}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal open={createOpen} onClose={closeCreate} title={t('learning.createAssignment')} className="max-w-xl">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <div>
            <label className="text-sm font-medium">{t('learning.assignmentTitle')}</label>
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t('learning.class')}</label>
              <select
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              >
                <option value="">{t('timetable.selectClass')}</option>
                {classes?.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('timetable.subject')}</label>
              <select
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              >
                <option value="">—</option>
                {subjects?.map((s: { id: string; name: string }) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t('learning.description')}</label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t('portals.studentPortal.dueDate')}</label>
              <Input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">{t('learning.totalMarks')}</label>
              <Input type="number" required min={1} value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t('learning.uploadMaterialPdf')}</label>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
            <div className="flex gap-2 mt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <FileText className="h-4 w-4" />
                {pdfFile ? pdfFile.name : t('learning.choosePdf')}
              </Button>
              {pdfFile && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPdfFile(null)}>
                  {t('common.clear')}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('learning.materialHint')}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeCreate}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('learning.publishAssignment')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
