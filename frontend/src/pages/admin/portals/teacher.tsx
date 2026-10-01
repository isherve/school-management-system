import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, ClipboardList, Video, Calendar, Users, Bell, FileText, GraduationCap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/stat-card';
import { PortalShortcuts } from '@/components/shared/portal-shortcuts';
import { parseAttachment } from '@/lib/file-url';
import {
  examApi, modulesApi, communicationApi, studentApi, teacherApi,
} from '@/services/endpoints';
import { useTranslation } from '@/i18n';

const LINKS = [
  { path: '/attendance', icon: ClipboardList, labelKey: 'nav.attendance' },
  { path: '/exams', icon: BookOpen, labelKey: 'nav.examinations' },
  { path: '/learning', icon: Video, labelKey: 'nav.onlineLearning' },
  { path: '/timetable', icon: Calendar, labelKey: 'nav.timetable' },
  { path: '/students', icon: Users, labelKey: 'nav.students' },
];

export function TeacherPortalPage() {
  const { t } = useTranslation();

  const { data: exams } = useQuery({ queryKey: ['exams'], queryFn: () => examApi.getAll({ limit: '5' }) });
  const { data: assignments } = useQuery({ queryKey: ['learning-assignments'], queryFn: modulesApi.learning.getAssignments });
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => communicationApi.getNotifications(true),
  });
  const { data: studentStats } = useQuery({ queryKey: ['student-stats'], queryFn: studentApi.getStats });
  const { data: teacherStats } = useQuery({ queryKey: ['teacher-stats'], queryFn: teacherApi.getStats });

  const examList = exams?.data || exams || [];
  const recentExams = Array.isArray(examList) ? examList.slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('portals.teacher')}</h1>
        <p className="text-muted-foreground">{t('portals.teacherDesc')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('portals.teacherPortal.totalStudents')} value={studentStats?.total || studentStats?.active || 0} icon={GraduationCap} />
        <StatCard title={t('portals.activeAssignments')} value={assignments?.length || 0} icon={Video} />
        <StatCard title={t('portals.teacherPortal.upcomingExams')} value={recentExams.length} icon={FileText} />
        <StatCard title={t('portals.teacherPortal.unreadAlerts')} value={notifications?.length || 0} icon={Bell} />
      </div>

      <PortalShortcuts role="TEACHER" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('portals.teacherPortal.upcomingExams')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentExams.map((e: { id: string; name: string; subject?: { name: string }; isPublished?: boolean }) => (
              <div key={e.id} className="flex justify-between p-2 rounded border border-border text-sm">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.subject?.name}</p>
                </div>
                <span className="text-xs">{e.isPublished ? t('status.PUBLISHED') : t('status.DRAFT')}</span>
              </div>
            )) || <p className="text-muted-foreground text-center py-4">{t('exams.title')}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t('portals.recentAssignments')}</CardTitle>
            <Link to="/learning?action=create">
              <Button variant="outline" size="sm">{t('learning.createAssignment')}</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {assignments?.slice(0, 5).map((a: {
              id: string; title: string; dueDate: string; attachments?: unknown;
              class?: { name: string }; subject?: { name: string };
            }) => {
              const material = parseAttachment(a.attachments);
              return (
                <Link key={a.id} to="/learning" className="block">
                  <div className="flex justify-between p-2 rounded border border-border text-sm hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.subject?.name} · {a.class?.name}</p>
                      {material && <p className="text-xs text-primary mt-0.5">{material.fileName}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(a.dueDate).toLocaleDateString()}</span>
                  </div>
                </Link>
              );
            }) || <p className="text-muted-foreground text-center py-4">{t('portals.noAssignments')}</p>}
            <Link to="/learning">
              <Button variant="ghost" size="sm" className="w-full mt-2">{t('shortcuts.manageAssignments')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">{t('portals.teacherPortal.quickLinks')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map(({ path, icon: Icon, labelKey }) => (
            <Link key={path} to={path}>
              <Card className="hover:border-primary/40 hover:shadow-sm transition-all h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 text-primary" />
                    {t(labelKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm">{t('portals.openModule')}</Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {teacherStats && (
        <p className="text-xs text-muted-foreground">{t('teachers.allTeachers')}: {teacherStats.total ?? teacherStats.active ?? '—'}</p>
      )}
    </div>
  );
}
