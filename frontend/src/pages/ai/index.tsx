import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, FileText, BookOpen, AlertTriangle, Plus, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { aiApi, type AiConversation } from '@/services/endpoints';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/stores';
import { STAFF_ROLES } from '@/lib/access';
import { cn } from '@/lib/utils';

function errorText(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (message) return message;
  }
  return fallback;
}

function providerLabel(provider: string | null | undefined, schoolData: string): string {
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'gemini') return 'Gemini';
  return schoolData;
}

export function AIPage() {
  const { t, locale } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const isStaff = Boolean(role && STAFF_ROLES.includes(role));
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [reportResult, setReportResult] = useState('');
  const [lessonPlan, setLessonPlan] = useState<Record<string, unknown> | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<Record<string, unknown> | null>(null);
  const [reportForm, setReportForm] = useState({ studentName: '', subject: '', marks: '', totalMarks: '100' });
  const [lessonForm, setLessonForm] = useState({ subject: '', topic: '', grade: '', duration: '45' });
  const [riskForm, setRiskForm] = useState({ attendanceRate: '', averageScore: '', recentTrend: 'stable' });

  const statusQuery = useQuery({ queryKey: ['ai-status'], queryFn: aiApi.status });
  const threadsQuery = useQuery({ queryKey: ['ai-threads'], queryFn: aiApi.listConversations });
  const threadQuery = useQuery({
    queryKey: ['ai-thread', activeId],
    queryFn: () => aiApi.getConversation(activeId!),
    enabled: Boolean(activeId),
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      let id = activeId;
      if (!id) {
        const created = await aiApi.createConversation(locale);
        id = created.id;
        setActiveId(id);
      }
      return aiApi.sendMessage(id, content, locale);
    },
    onSuccess: (conversation: AiConversation) => {
      setActiveId(conversation.id);
      queryClient.setQueryData(['ai-thread', conversation.id], conversation);
      queryClient.invalidateQueries({ queryKey: ['ai-threads'] });
      setDraft('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: (_data, id) => {
      if (activeId === id) setActiveId(null);
      queryClient.invalidateQueries({ queryKey: ['ai-threads'] });
      queryClient.removeQueries({ queryKey: ['ai-thread', id] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: aiApi.generateReportComment,
    onSuccess: (data) => setReportResult(data.comment),
  });
  const lessonMutation = useMutation({
    mutationFn: aiApi.generateLessonPlan,
    onSuccess: (data) => setLessonPlan(data),
  });
  const riskMutation = useMutation({
    mutationFn: aiApi.analyzeStudentRisk,
    onSuccess: (data) => setRiskAnalysis(data),
  });

  const messages = threadQuery.data?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sendMutation.isPending]);

  function submit(text?: string) {
    const content = (text ?? draft).trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate(content);
  }

  const live = statusQuery.data?.liveModelConfigured;
  const providerName = statusQuery.data?.mode === 'gemini'
    ? `Gemini${statusQuery.data.model ? ` (${statusQuery.data.model})` : ''}`
    : `OpenAI${statusQuery.data?.model ? ` (${statusQuery.data.model})` : ''}`;
  const suggestions = [
    t('ai.suggestions.attendance'),
    t('ai.suggestions.fees'),
    t('ai.suggestions.exams'),
    t('ai.suggestions.timetable'),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" /> {t('ai.title')}
        </h1>
        <p className="text-muted-foreground">{t('ai.subtitle')}</p>
      </div>

      <div className={cn(
        'rounded-md border px-4 py-3 text-sm',
        live ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'
      )}>
        {live ? t('ai.liveBanner', { provider: providerName }) : t('ai.fallbackBanner')}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{t('ai.threads')}</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setActiveId(null);
                  setDraft('');
                }}
              >
                <Plus className="h-4 w-4" /> {t('ai.newChat')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {threadsQuery.data?.length ? threadsQuery.data.map((thread) => (
              <div key={thread.id} className="flex items-start gap-1">
                <button
                  type="button"
                  onClick={() => setActiveId(thread.id)}
                  className={cn(
                    'min-w-0 flex-1 rounded-md px-2 py-2 text-left text-sm hover:bg-muted',
                    activeId === thread.id && 'bg-muted font-medium'
                  )}
                >
                  <span className="block truncate">{thread.title}</span>
                </button>
                <button
                  type="button"
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label={t('ai.deleteChat')}
                  onClick={() => deleteMutation.mutate(thread.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">{t('ai.noThreads')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-[28rem] flex-col">
          <CardContent className="flex flex-1 flex-col gap-4 pt-6">
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[32rem] pr-1">
              {messages.length === 0 && !sendMutation.isPending && (
                <p className="text-sm text-muted-foreground">{t('ai.empty')}</p>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'max-w-[95%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap',
                    message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <p className="mb-1 text-[11px] font-medium opacity-70">
                    {message.role === 'user' ? t('ai.you') : t('ai.assistant')}
                    {message.role === 'assistant' && ` · ${providerLabel(message.provider, t('ai.schoolData'))}`}
                  </p>
                  {message.content}
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{t('ai.thinking')}</div>
              )}
              <div ref={bottomRef} />
            </div>

            {sendMutation.isError && (
              <p className="text-sm text-destructive">{errorText(sendMutation.error, t('ai.error'))}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border px-3 py-1 text-left text-xs hover:bg-muted"
                  onClick={() => submit(suggestion)}
                  disabled={sendMutation.isPending}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                }}
                placeholder={t('ai.placeholder')}
                rows={2}
                className="min-h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button type="submit" disabled={sendMutation.isPending || !draft.trim()} aria-label={t('ai.send')}>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{t('ai.send')}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {isStaff && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t('ai.tools')}</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> {t('ai.reportTitle')}</CardTitle>
                <CardDescription>{t('ai.reportDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label={t('ai.studentName')} value={reportForm.studentName} onChange={(e) => setReportForm({ ...reportForm, studentName: e.target.value })} />
                  <Input label={t('ai.subject')} value={reportForm.subject} onChange={(e) => setReportForm({ ...reportForm, subject: e.target.value })} />
                  <Input label={t('ai.marks')} type="number" value={reportForm.marks} onChange={(e) => setReportForm({ ...reportForm, marks: e.target.value })} />
                  <Input label={t('ai.totalMarks')} type="number" value={reportForm.totalMarks} onChange={(e) => setReportForm({ ...reportForm, totalMarks: e.target.value })} />
                </div>
                <Button
                  onClick={() => reportMutation.mutate({
                    studentName: reportForm.studentName || 'Student',
                    subject: reportForm.subject || 'Subject',
                    marks: Number(reportForm.marks || 0),
                    totalMarks: Number(reportForm.totalMarks || 100),
                  })}
                  disabled={reportMutation.isPending}
                >
                  {t('ai.generateComment')}
                </Button>
                {reportResult && <div className="rounded-md bg-muted/50 p-4 text-sm">{reportResult}</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> {t('ai.lessonTitle')}</CardTitle>
                <CardDescription>{t('ai.lessonDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label={t('ai.subject')} value={lessonForm.subject} onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })} />
                  <Input label={t('ai.topic')} value={lessonForm.topic} onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })} />
                  <Input label={t('ai.grade')} value={lessonForm.grade} onChange={(e) => setLessonForm({ ...lessonForm, grade: e.target.value })} />
                  <Input label={t('ai.duration')} type="number" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} />
                </div>
                <Button
                  onClick={() => lessonMutation.mutate({
                    subject: lessonForm.subject,
                    topic: lessonForm.topic,
                    grade: lessonForm.grade,
                    duration: Number(lessonForm.duration || 45),
                  })}
                  disabled={lessonMutation.isPending}
                >
                  {t('ai.generatePlan')}
                </Button>
                {lessonPlan && (
                  <div className="space-y-2 rounded-md bg-muted/50 p-4 text-sm">
                    <p className="font-medium">{String(lessonPlan.title)}</p>
                    {(lessonPlan.objectives as string[])?.map((obj, i) => <p key={i}>• {obj}</p>)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> {t('ai.riskTitle')}</CardTitle>
                <CardDescription>{t('ai.riskDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input label={t('ai.attendancePct')} type="number" value={riskForm.attendanceRate} onChange={(e) => setRiskForm({ ...riskForm, attendanceRate: e.target.value })} />
                  <Input label={t('ai.avgScore')} type="number" value={riskForm.averageScore} onChange={(e) => setRiskForm({ ...riskForm, averageScore: e.target.value })} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t('ai.trend')}</label>
                    <select
                      value={riskForm.recentTrend}
                      onChange={(e) => setRiskForm({ ...riskForm, recentTrend: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="stable">{t('ai.stable')}</option>
                      <option value="declining">{t('ai.declining')}</option>
                      <option value="improving">{t('ai.improving')}</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={() => riskMutation.mutate({
                    attendanceRate: Number(riskForm.attendanceRate || 0),
                    averageScore: Number(riskForm.averageScore || 0),
                    recentTrend: riskForm.recentTrend,
                  })}
                  disabled={riskMutation.isPending}
                >
                  {t('ai.analyze')}
                </Button>
                {riskAnalysis && (
                  <div className="rounded-md bg-muted/50 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                        riskAnalysis.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        riskAnalysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {String(riskAnalysis.riskLevel).toUpperCase()} RISK (Score: {String(riskAnalysis.riskScore)})
                      </span>
                    </div>
                    <p className="mb-2 text-sm">Factors: {(riskAnalysis.factors as string[])?.join(', ')}</p>
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {(riskAnalysis.recommendations as string[])?.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
