import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, ClipboardCheck, FileText, Wallet, ArrowLeft, Calendar, Video,
  Library, Bus, Megaphone, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { PortalShortcuts } from '@/components/shared/portal-shortcuts';
import { SubmissionDownloadLink } from '@/components/shared/assignment-actions';
import { parseAttachment } from '@/lib/file-url';
import { parentApi, communicationApi } from '@/services/endpoints';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useTranslation, useFormatDate } from '@/i18n';

type View = 'attendance' | 'results' | 'fees' | 'timetable' | 'assignments' | 'library' | 'transport' | 'announcements' | null;

const VIEW_LABELS: Record<Exclude<View, null>, string> = {
  attendance: 'parent.attendance',
  results: 'parent.results',
  fees: 'parent.fees',
  timetable: 'parent.timetable',
  assignments: 'parent.assignments',
  library: 'parent.library',
  transport: 'parent.transport',
  announcements: 'parent.announcements',
};

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const VALID_VIEWS: Exclude<View, null>[] = [
  'attendance', 'results', 'fees', 'timetable', 'assignments', 'library', 'transport', 'announcements',
];

export function ParentPortalPage() {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const currency = useAppStore((s) => s.currency);
  const fmt = (n: number) => formatCurrency(n, currency);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [view, setView] = useState<View>(null);

  const { data: children, isLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: parentApi.getChildren,
  });

  useEffect(() => {
    const v = searchParams.get('view') as Exclude<View, null> | null;
    if (v && VALID_VIEWS.includes(v)) {
      setView(v);
      if (children?.length === 1) {
        setSelectedChild(children[0].id);
      }
    } else if (!v) {
      setView(null);
      if (!searchParams.get('view')) setSelectedChild(null);
    }
  }, [searchParams, children]);

  const enabled = !!selectedChild;

  const { data: attendance } = useQuery({
    queryKey: ['parent-attendance', selectedChild],
    queryFn: () => parentApi.getAttendance(selectedChild!),
    enabled: enabled && view === 'attendance',
  });

  const { data: results } = useQuery({
    queryKey: ['parent-results', selectedChild],
    queryFn: () => parentApi.getResults(selectedChild!),
    enabled: enabled && view === 'results',
  });

  const { data: fees } = useQuery({
    queryKey: ['parent-fees', selectedChild],
    queryFn: () => parentApi.getFees(selectedChild!),
    enabled: enabled && view === 'fees',
  });

  const { data: timetable } = useQuery({
    queryKey: ['parent-timetable', selectedChild],
    queryFn: () => parentApi.getTimetable(selectedChild!),
    enabled: enabled && view === 'timetable',
  });

  const { data: assignments } = useQuery({
    queryKey: ['parent-assignments', selectedChild],
    queryFn: () => parentApi.getAssignments(selectedChild!),
    enabled: enabled && view === 'assignments',
  });

  const { data: library } = useQuery({
    queryKey: ['parent-library', selectedChild],
    queryFn: () => parentApi.getLibrary(selectedChild!),
    enabled: enabled && view === 'library',
  });

  const { data: transport } = useQuery({
    queryKey: ['parent-transport', selectedChild],
    queryFn: () => parentApi.getTransport(selectedChild!),
    enabled: enabled && view === 'transport',
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: communicationApi.getAnnouncements,
    enabled: view === 'announcements',
  });

  const child = children?.find((c: { id: string }) => c.id === selectedChild);

  const openChildView = (childId: string, v: Exclude<View, null>) => {
    setSelectedChild(childId);
    setView(v);
    setSearchParams({ view: v }, { replace: true });
  };

  const goBack = () => {
    setView(null);
    setSelectedChild(null);
    setSearchParams({}, { replace: true });
  };

  const pendingView = searchParams.get('view') as Exclude<View, null> | null;

  const childActions = [
    { view: 'attendance' as View, icon: ClipboardCheck, labelKey: 'parent.attendance' },
    { view: 'results' as View, icon: FileText, labelKey: 'parent.results' },
    { view: 'fees' as View, icon: Wallet, labelKey: 'parent.fees' },
    { view: 'timetable' as View, icon: Calendar, labelKey: 'parent.timetable' },
    { view: 'assignments' as View, icon: Video, labelKey: 'parent.assignments' },
    { view: 'library' as View, icon: Library, labelKey: 'parent.library' },
    { view: 'transport' as View, icon: Bus, labelKey: 'parent.transport' },
  ];

  if (view === 'announcements') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" /> {t('parent.back')}
        </Button>
        <h2 className="text-xl font-bold">{t('parent.announcements')}</h2>
        <div className="space-y-3">
          {announcements?.map((a: { id: string; title: string; content: string; createdAt: string }) => (
            <Card key={a.id}><CardContent className="pt-6">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
              <p className="text-xs text-muted-foreground mt-2">{formatDate(a.createdAt)}</p>
            </CardContent></Card>
          )) || <p className="text-muted-foreground text-center py-8">{t('parent.noAnnouncements')}</p>}
        </div>
      </div>
    );
  }

  if (selectedChild && view) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" /> {t('parent.back')}
        </Button>
        <h2 className="text-xl font-bold">
          {child?.user?.firstName} {child?.user?.lastName} — {t(VIEW_LABELS[view])}
        </h2>

        {view === 'attendance' && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              {attendance?.length ? attendance.map((a: { id: string; date: string; status: string }) => (
                <div key={a.id} className="flex justify-between p-3 rounded-lg border border-border">
                  <span>{formatDate(a.date)}</span>
                  <StatusBadge status={a.status} />
                </div>
              )) : <p className="text-muted-foreground text-center py-4">{t('parent.noAttendance')}</p>}
            </CardContent>
          </Card>
        )}

        {view === 'results' && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              {results?.length ? results.map((r: { id: string; marksObtained: number; grade?: string; exam: { name: string; subject: { name: string }; totalMarks: number } }) => (
                <div key={r.id} className="flex justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">{r.exam.subject.name}</p>
                    <p className="text-sm text-muted-foreground">{r.exam.name}</p>
                  </div>
                  <span className="font-semibold">{r.marksObtained}/{Number(r.exam.totalMarks)} ({r.grade || '—'})</span>
                </div>
              )) : <p className="text-muted-foreground text-center py-4">{t('parent.noResults')}</p>}
            </CardContent>
          </Card>
        )}

        {view === 'fees' && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              {fees?.length ? fees.map((f: { id: string; invoiceNumber: string; totalAmount: number; balance: number; status: string }) => (
                <div key={f.id} className="flex justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium font-mono text-sm">{f.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{t('parent.balance')}: {fmt(Number(f.balance))}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmt(Number(f.totalAmount))}</p>
                    <StatusBadge status={f.status} />
                  </div>
                </div>
              )) : <p className="text-muted-foreground text-center py-4">{t('parent.noFees')}</p>}
            </CardContent>
          </Card>
        )}

        {view === 'timetable' && (
          <div className="grid gap-4">
            {DAY_KEYS.map((dayKey, dayIndex) => {
              const slots = (timetable || []).filter((s: { dayOfWeek: number }) => s.dayOfWeek === dayIndex);
              if (!slots.length) return null;
              return (
                <Card key={dayKey}>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> {t(`days.${dayKey}`)}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {slots.map((s: { id: string; startTime: string; endTime: string; subject?: { name: string }; teacher?: { name: string }; room?: string }) => (
                      <div key={s.id} className="flex justify-between p-2 rounded border border-border text-sm">
                        <div>
                          <p className="font-medium">{s.subject?.name}</p>
                          <p className="text-xs text-muted-foreground">{s.teacher?.name}</p>
                        </div>
                        <span className="text-muted-foreground">{s.startTime}–{s.endTime}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
            {!timetable?.length && <Card><CardContent className="py-8 text-center text-muted-foreground">{t('parent.noTimetable')}</CardContent></Card>}
          </div>
        )}

        {view === 'assignments' && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              {assignments?.map((a: {
                id: string; title: string; dueDate: string; attachments?: unknown;
                subject?: { name: string };
                submissions?: { marks?: number; feedback?: string; fileUrl?: string }[];
              }) => {
                const sub = a.submissions?.[0];
                const material = parseAttachment(a.attachments);
                return (
                  <div key={a.id} className="p-3 rounded-lg border border-border">
                    <div className="flex justify-between">
                      <p className="font-medium">{a.title}</p>
                      <span className="text-sm">{sub?.marks != null ? `${sub.marks} pts` : sub ? t('portals.studentPortal.submitted') : t('portals.studentPortal.notSubmitted')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{a.subject?.name} · {formatDate(a.dueDate)}</p>
                    {sub?.feedback && <p className="text-xs mt-2 text-muted-foreground">{sub.feedback}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {material && (
                        <SubmissionDownloadLink fileUrl={material.fileUrl} label={t('learning.downloadMaterial')} />
                      )}
                      {sub?.fileUrl && (
                        <SubmissionDownloadLink fileUrl={sub.fileUrl} label={t('learning.viewSubmission')} />
                      )}
                    </div>
                  </div>
                );
              }) || <p className="text-muted-foreground text-center py-4">{t('parent.noAssignments')}</p>}
            </CardContent>
          </Card>
        )}

        {view === 'library' && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              {library?.map((b: { id: string; dueDate: string; book: { title: string } }) => (
                <div key={b.id} className="flex justify-between p-3 rounded-lg border border-border">
                  <p className="font-medium">{b.book.title}</p>
                  <span className="text-sm text-muted-foreground">{t('portals.studentPortal.returnBy')} {formatDate(b.dueDate)}</span>
                </div>
              )) || <p className="text-muted-foreground text-center py-4">{t('parent.noLibrary')}</p>}
            </CardContent>
          </Card>
        )}

        {view === 'transport' && (
          <Card>
            <CardContent className="pt-6">
              {transport ? (
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">{t('portals.studentPortal.vehicle')}:</span> {transport.vehicle?.registration}</p>
                  <p><span className="text-muted-foreground">{t('portals.studentPortal.pickupPoint')}:</span> {transport.pickupPoint || '—'}</p>
                  {transport.vehicle?.routes?.map((r: { name: string }) => (
                    <p key={r.name}><span className="text-muted-foreground">{t('portals.studentPortal.route')}:</span> {r.name}</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">{t('parent.noTransport')}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalShortcuts role="PARENT" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('parent.title')}</h1>
          <p className="text-muted-foreground">{t('parent.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => { setSearchParams({ view: 'announcements' }, { replace: true }); setView('announcements'); }}>
          <Megaphone className="h-4 w-4" /> {t('parent.announcements')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : !children?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('parent.noChildren')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {pendingView && VALID_VIEWS.includes(pendingView) && !selectedChild && (
            <Card className="md:col-span-2 border-primary/30 bg-primary/5">
              <CardContent className="py-4 text-sm text-muted-foreground">
                {t('parent.subtitle')} — {t(VIEW_LABELS[pendingView])}: {t('common.student')}
              </CardContent>
            </Card>
          )}
          {children.map((childItem: {
            id: string; admissionNumber: string;
            user: { firstName: string; lastName: string };
            class?: { name: string; section?: string };
          }) => (
            <Card key={childItem.id}>
              <CardHeader>
                <CardTitle>{childItem.user.firstName} {childItem.user.lastName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {childItem.admissionNumber} · {childItem.class ? `${childItem.class.name} ${childItem.class.section || ''}` : t('parent.unassigned')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {childActions.map(({ view: v, icon: Icon, labelKey }) => (
                    <button
                      key={v}
                      onClick={() => openChildView(childItem.id, v!)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium text-center">{t(labelKey)}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
