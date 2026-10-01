import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap, Calendar, Video, Bell, ClipboardCheck, FileText, Wallet,
  Bus, Home, Megaphone, Clock, Library,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { PortalShortcuts } from '@/components/shared/portal-shortcuts';
import { AssignmentActions } from '@/components/shared/assignment-actions';
import {
  studentPortalApi, communicationApi, dashboardApi,
} from '@/services/endpoints';
import { useAuthStore, useAppStore } from '@/stores';
import { useTranslation, useFormatDate } from '@/i18n';
import { formatCurrency } from '@/lib/utils';

type Tab = 'overview' | 'results' | 'attendance' | 'fees' | 'assignments' | 'timetable' | 'library' | 'transport' | 'announcements';

const VALID_TABS: Tab[] = ['overview', 'results', 'attendance', 'fees', 'assignments', 'timetable', 'library', 'transport', 'announcements'];

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export function StudentPortalPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const currency = useAppStore((s) => s.currency);
  const fmt = (n: number) => formatCurrency(n, currency);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );

  useEffect(() => {
    const next = searchParams.get('tab') as Tab | null;
    if (next && VALID_TABS.includes(next)) setTab(next);
    else if (!next) setTab('overview');
  }, [searchParams]);

  const changeTab = (id: Tab) => {
    setTab(id);
    if (id === 'overview') setSearchParams({}, { replace: true });
    else setSearchParams({ tab: id }, { replace: true });
  };

  const { data: profile } = useQuery({ queryKey: ['student-profile'], queryFn: studentPortalApi.getProfile });
  const { data: results } = useQuery({ queryKey: ['student-results'], queryFn: studentPortalApi.getResults, enabled: tab === 'results' || tab === 'overview' });
  const { data: attendance } = useQuery({ queryKey: ['student-attendance'], queryFn: studentPortalApi.getAttendance, enabled: tab === 'attendance' || tab === 'overview' });
  const { data: fees } = useQuery({ queryKey: ['student-fees'], queryFn: studentPortalApi.getFees, enabled: tab === 'fees' || tab === 'overview' });
  const { data: assignments } = useQuery({ queryKey: ['student-assignments'], queryFn: studentPortalApi.getAssignments, enabled: tab === 'assignments' || tab === 'overview' });
  const { data: timetable } = useQuery({ queryKey: ['student-timetable'], queryFn: studentPortalApi.getTimetable, enabled: tab === 'timetable' || tab === 'overview' });
  const { data: library } = useQuery({ queryKey: ['student-library'], queryFn: studentPortalApi.getLibrary, enabled: tab === 'library' });
  const { data: transport } = useQuery({ queryKey: ['student-transport'], queryFn: studentPortalApi.getTransport, enabled: tab === 'transport' });
  const { data: hostel } = useQuery({ queryKey: ['student-hostel'], queryFn: studentPortalApi.getHostel, enabled: tab === 'transport' });
  const { data: announcements } = useQuery({ queryKey: ['announcements'], queryFn: communicationApi.getAnnouncements, enabled: tab === 'announcements' || tab === 'overview' });
  const { data: events } = useQuery({ queryKey: ['events'], queryFn: dashboardApi.getEvents, enabled: tab === 'overview' });
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communicationApi.getNotifications(true),
  });

  const tabs: { id: Tab; label: string; icon: typeof GraduationCap }[] = [
    { id: 'overview', label: t('portals.studentPortal.overview'), icon: GraduationCap },
    { id: 'results', label: t('portals.studentPortal.examResults'), icon: FileText },
    { id: 'attendance', label: t('portals.studentPortal.myAttendance'), icon: ClipboardCheck },
    { id: 'fees', label: t('portals.studentPortal.myFees'), icon: Wallet },
    { id: 'assignments', label: t('portals.studentPortal.myAssignments'), icon: Video },
    { id: 'timetable', label: t('portals.studentPortal.myTimetable'), icon: Calendar },
    { id: 'library', label: t('portals.studentPortal.myLibrary'), icon: Library },
    { id: 'transport', label: t('portals.studentPortal.myTransport'), icon: Bus },
    { id: 'announcements', label: t('portals.studentPortal.announcements'), icon: Megaphone },
  ];

  const classLabel = profile?.class
    ? `${profile.class.name}${profile.class.section ? ` ${profile.class.section}` : ''}`
    : t('parent.unassigned');

  const todayIndex = new Date().getDay();
  const todaySlots = (timetable || []).filter((s: { dayOfWeek: number }) => s.dayOfWeek === todayIndex);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('portals.student')}</h1>
        <p className="text-muted-foreground">{t('portals.studentWelcome', { name: user?.firstName || '' })}</p>
        {profile && (
          <p className="text-sm text-muted-foreground mt-1">
            {profile.admissionNumber} · {classLabel}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('portals.studentPortal.attendanceRate')} value={`${profile?.stats?.attendanceRate ?? 0}%`} icon={ClipboardCheck} />
        <StatCard title={t('portals.studentPortal.averageScore')} value={profile?.stats?.averageScore != null ? `${profile.stats.averageScore}%` : '—'} icon={FileText} />
        <StatCard title={t('portals.studentPortal.pendingWork')} value={profile?.stats?.pendingAssignments ?? 0} icon={Video} />
        <StatCard title={t('portals.notifications')} value={notifications?.length ?? 0} icon={Bell} />
      </div>

      <PortalShortcuts role="STUDENT" />

      <div className="flex gap-2 overflow-x-auto border-b border-border pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => changeTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('portals.studentPortal.examResults')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {results?.slice(0, 5).map((r: { id: string; marksObtained: number; grade?: string; exam: { name: string; subject: { name: string }; totalMarks: number } }) => (
                <div key={r.id} className="flex justify-between p-2 rounded border border-border text-sm">
                  <div>
                    <p className="font-medium">{r.exam.subject.name}</p>
                    <p className="text-xs text-muted-foreground">{r.exam.name}</p>
                  </div>
                  <span className="font-semibold">{r.marksObtained}/{Number(r.exam.totalMarks)} ({r.grade || '—'})</span>
                </div>
              )) || <p className="text-muted-foreground text-center py-4">{t('portals.studentPortal.noResults')}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> {t(`days.${DAY_KEYS[todayIndex]}`)}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {todaySlots.length ? todaySlots.map((s: { id: string; startTime: string; endTime: string; subject?: { name: string }; room?: string }) => (
                <div key={s.id} className="flex justify-between p-2 rounded border border-border text-sm">
                  <span className="font-medium">{s.subject?.name || '—'}</span>
                  <span className="text-muted-foreground">{s.startTime}–{s.endTime} {s.room ? `· ${s.room}` : ''}</span>
                </div>
              )) : <p className="text-muted-foreground text-center py-4">{t('timetable.empty')}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('portals.studentPortal.myAssignments')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {assignments?.slice(0, 4).map((a: { id: string; title: string; dueDate: string; subject?: { name: string }; submissions?: { marks?: number; feedback?: string }[] }) => {
                const sub = a.submissions?.[0];
                return (
                  <div key={a.id} className="flex justify-between p-2 rounded border border-border text-sm">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.subject?.name} · {t('portals.studentPortal.dueDate')}: {formatDate(a.dueDate)}</p>
                    </div>
                    <span className="text-xs">{sub?.marks != null ? `${sub.marks} pts` : sub ? t('portals.studentPortal.submitted') : t('portals.studentPortal.notSubmitted')}</span>
                  </div>
                );
              }) || <p className="text-muted-foreground text-center py-4">{t('portals.noAssignments')}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t('portals.studentPortal.schoolEvents')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {events?.slice(0, 4).map((e: { id: string; title: string; startDate: string }) => (
                <div key={e.id} className="flex justify-between p-2 rounded border border-border text-sm">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-muted-foreground">{formatDate(e.startDate)}</span>
                </div>
              )) || <p className="text-muted-foreground text-center py-4">{t('dashboard.noEvents')}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'results' && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 px-2">{t('timetable.subject')}</th>
                    <th className="py-2 px-2">{t('exams.title')}</th>
                    <th className="py-2 px-2">{t('portals.studentPortal.marks')}</th>
                    <th className="py-2 px-2">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {results?.map((r: { id: string; marksObtained: number; grade?: string; exam: { name: string; subject: { name: string }; totalMarks: number } }) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 px-2 font-medium">{r.exam.subject.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{r.exam.name}</td>
                      <td className="py-2 px-2">{r.marksObtained} / {Number(r.exam.totalMarks)} ({r.grade || '—'})</td>
                      <td className="py-2 px-2"><StatusBadge status="PUBLISHED" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!results?.length && <p className="text-muted-foreground text-center py-8">{t('portals.studentPortal.noResults')}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'attendance' && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            {attendance?.map((a: { id: string; date: string; status: string }) => (
              <div key={a.id} className="flex justify-between p-3 rounded-lg border border-border">
                <span>{formatDate(a.date)}</span>
                <StatusBadge status={a.status} />
              </div>
            )) || <p className="text-muted-foreground text-center py-8">{t('parent.noAttendance')}</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'fees' && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            {fees?.map((f: { id: string; invoiceNumber: string; totalAmount: number; balance: number; status: string }) => (
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
            )) || <p className="text-muted-foreground text-center py-8">{t('portals.studentPortal.noFees')}</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'assignments' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('portals.studentPortal.myAssignments')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('learning.studentAssignmentsHint')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments?.map((a: {
              id: string; title: string; description?: string; dueDate: string; totalMarks: number;
              attachments?: unknown;
              subject?: { name: string };
              submissions?: { marks?: number; feedback?: string; submittedAt: string; fileUrl?: string }[];
            }) => {
              const sub = a.submissions?.[0];
              return (
                <div key={a.id} className="p-4 rounded-lg border border-border">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.subject?.name} · {t('portals.studentPortal.dueDate')}: {formatDate(a.dueDate)}</p>
                    </div>
                    <span className="text-sm font-semibold">{sub?.marks != null ? `${sub.marks}/${Number(a.totalMarks)}` : '—'}</span>
                  </div>
                  {a.description && <p className="text-sm mt-2 text-muted-foreground">{a.description}</p>}
                  {sub?.feedback && <p className="text-xs mt-2 p-2 bg-muted rounded">{t('portals.studentPortal.feedback')}: {sub.feedback}</p>}
                  <p className="text-xs mt-2 text-muted-foreground">
                    {sub ? `${t('portals.studentPortal.submitted')} ${formatDate(sub.submittedAt)}` : t('portals.studentPortal.notSubmitted')}
                  </p>
                  <AssignmentActions
                    assignmentId={a.id}
                    attachments={a.attachments}
                    submission={sub}
                    mode="student"
                  />
                </div>
              );
            }) || <p className="text-muted-foreground text-center py-8">{t('portals.noAssignments')}</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'timetable' && (
        <div className="grid gap-4">
          {DAY_KEYS.map((dayKey, dayIndex) => {
            const slots = (timetable || []).filter((s: { dayOfWeek: number }) => s.dayOfWeek === dayIndex);
            if (!slots.length) return null;
            return (
              <Card key={dayKey}>
                <CardHeader><CardTitle className="text-base">{t(`days.${dayKey}`)}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {slots.map((s: { id: string; startTime: string; endTime: string; subject?: { name: string }; teacher?: { name: string }; room?: string }) => (
                    <div key={s.id} className="flex justify-between p-2 rounded border border-border text-sm">
                      <div>
                        <p className="font-medium">{s.subject?.name}</p>
                        <p className="text-xs text-muted-foreground">{s.teacher?.name}</p>
                      </div>
                      <span className="text-muted-foreground">{s.startTime}–{s.endTime} · {s.room || '—'}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
          {!timetable?.length && <Card><CardContent className="py-8 text-center text-muted-foreground">{t('timetable.empty')}</CardContent></Card>}
        </div>
      )}

      {tab === 'library' && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            {library?.map((b: { id: string; dueDate: string; borrowedAt: string; book: { title: string; author?: string } }) => (
              <div key={b.id} className="flex justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium">{b.book.title}</p>
                  <p className="text-xs text-muted-foreground">{b.book.author} · {t('portals.studentPortal.borrowed')} {formatDate(b.borrowedAt)}</p>
                </div>
                <span className="text-sm text-muted-foreground">{t('portals.studentPortal.returnBy')} {formatDate(b.dueDate)}</span>
              </div>
            )) || <p className="text-muted-foreground text-center py-8">{t('portals.studentPortal.noLibrary')}</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'transport' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bus className="h-5 w-5" /> {t('portals.studentPortal.myTransport')}</CardTitle></CardHeader>
            <CardContent>
              {transport ? (
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">{t('portals.studentPortal.vehicle')}:</span> {transport.vehicle?.registration} ({transport.vehicle?.make} {transport.vehicle?.model})</p>
                  <p><span className="text-muted-foreground">{t('portals.studentPortal.pickupPoint')}:</span> {transport.pickupPoint || '—'}</p>
                  {transport.vehicle?.routes?.map((r: { name: string; startPoint: string; endPoint: string }) => (
                    <p key={r.name}><span className="text-muted-foreground">{t('portals.studentPortal.route')}:</span> {r.name} ({r.startPoint} → {r.endPoint})</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">{t('portals.studentPortal.noTransport')}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> {t('portals.studentPortal.myHostel')}</CardTitle></CardHeader>
            <CardContent>
              {hostel ? (
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">{t('portals.studentPortal.room')}:</span> {hostel.room?.name}</p>
                  <p><span className="text-muted-foreground">{t('portals.studentPortal.bed')}:</span> {hostel.bedNumber || '—'}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">{t('portals.studentPortal.noHostel')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'announcements' && (
        <div className="space-y-3">
          {announcements?.map((a: { id: string; title: string; content: string; createdAt: string; author: { firstName: string; lastName: string } }) => (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{a.author.firstName} {a.author.lastName} · {formatDate(a.createdAt)}</p>
              </CardContent>
            </Card>
          )) || <p className="text-muted-foreground text-center py-8">{t('communication.noAnnouncements')}</p>}
        </div>
      )}
    </div>
  );
}
