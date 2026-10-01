import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  Calendar,
  Bell,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { dashboardApi, communicationApi } from '@/services/endpoints';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useTranslation } from '@/i18n';

const COLORS = ['#1e3a5f', '#059669', '#d97706', '#dc2626', '#6366f1'];

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const currency = useAppStore((s) => s.currency);
  const fmt = (n: number) => formatCurrency(n, currency);

  const [showEventModal, setShowEventModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editEvent, setEditEvent] = useState<{
    id: string; title: string; description?: string; startDate: string; location?: string;
  } | null>(null);
  const [editAnnouncement, setEditAnnouncement] = useState<{
    id: string; title: string; content: string;
  } | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', description: '', startDate: '', location: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: dashboardApi.getCharts,
  });

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const createEventMutation = useMutation({
    mutationFn: () => dashboardApi.createEvent(eventForm),
    onSuccess: () => { invalidateDashboard(); setShowEventModal(false); setEventForm({ title: '', description: '', startDate: '', location: '' }); },
  });

  const updateEventMutation = useMutation({
    mutationFn: () => dashboardApi.updateEvent(editEvent!.id, {
      title: editEvent!.title,
      description: editEvent!.description,
      startDate: editEvent!.startDate,
      location: editEvent!.location,
    }),
    onSuccess: () => { invalidateDashboard(); setEditEvent(null); },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => dashboardApi.deleteEvent(id),
    onSuccess: invalidateDashboard,
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: () => communicationApi.createAnnouncement(announcementForm),
    onSuccess: () => { invalidateDashboard(); setShowAnnouncementModal(false); setAnnouncementForm({ title: '', content: '' }); },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: () => communicationApi.updateAnnouncement(editAnnouncement!.id, {
      title: editAnnouncement!.title,
      content: editAnnouncement!.content,
    }),
    onSuccess: () => { invalidateDashboard(); setEditAnnouncement(null); },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id: string) => communicationApi.deleteAnnouncement(id),
    onSuccess: invalidateDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  const attendanceData = charts?.attendance?.map((a: { status: string; _count: number | { _all?: number } }) => ({
    name: a.status,
    value: typeof a._count === 'number' ? a._count : (a._count?._all ?? 0),
  })) || [];

  const studentsByClass = charts?.studentsByClass || [];

  const toDateInput = (iso: string) => iso ? new Date(iso).toISOString().slice(0, 16) : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title={t('dashboard.totalStudents')} value={stats?.students?.total || 0} icon={Users} description={t('dashboard.activeStudents')} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title={t('dashboard.totalTeachers')} value={stats?.teachers?.total || 0} icon={GraduationCap} description={t('dashboard.activeTeachers')} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard
            title={t('dashboard.todayAttendance')}
            value={`${stats?.attendance?.rate || 0}%`}
            icon={ClipboardCheck}
            description={t('dashboard.presentOf', { present: stats?.attendance?.present || 0, total: stats?.attendance?.total || 0 })}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard
            title={t('dashboard.revenueCollected')}
            value={fmt(stats?.finance?.revenue || 0)}
            icon={DollarSign}
            description={`${t('dashboard.outstanding')}: ${fmt(stats?.finance?.outstanding || 0)}`}
          />
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> {t('dashboard.studentsByClass')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentsByClass}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('dashboard.attendanceOverview')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {attendanceData.map((_: unknown, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> {t('dashboard.upcomingEvents')}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowEventModal(true)}>
                <Plus className="h-4 w-4" /> {t('dashboard.addEvent')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.upcomingEvents?.length ? (
              <div className="space-y-3">
                {stats.upcomingEvents.map((event: {
                  id: string; title: string; description?: string; startDate: string; location?: string;
                }) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 group">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{event.title}</p>
                      {event.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>}
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground">{formatDate(event.startDate)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => setEditEvent({
                          ...event,
                          startDate: toDateInput(event.startDate),
                        })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => deleteEventMutation.mutate(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('dashboard.noEvents')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> {t('dashboard.announcements')}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAnnouncementModal(true)}>
                <Plus className="h-4 w-4" /> {t('dashboard.addAnnouncement')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.announcements?.length ? (
              <div className="space-y-3">
                {stats.announcements.map((a: { id: string; title: string; content: string }) => (
                  <div key={a.id} className="p-3 rounded-md bg-muted/50 group">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium text-sm">{a.title}</p>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="sm" onClick={() => setEditAnnouncement({ ...a })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAnnouncementMutation.mutate(a.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('dashboard.noAnnouncements')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={showEventModal} onClose={() => setShowEventModal(false)} title={t('dashboard.addEvent')}>
        <div className="space-y-4">
          <Input label={t('common.title')} value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
          <Input label={t('common.location')} value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
          <Input label={t('dashboard.startDate')} type="datetime-local" value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} />
          <div>
            <label className="text-sm font-medium mb-1 block">{t('common.description')}</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => createEventMutation.mutate()} disabled={!eventForm.title || !eventForm.startDate || createEventMutation.isPending}>
              {createEventMutation.isPending ? t('common.saving') : t('dashboard.createEvent')}
            </Button>
            <Button variant="outline" onClick={() => setShowEventModal(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editEvent} onClose={() => setEditEvent(null)} title={t('dashboard.editEvent')}>
        {editEvent && (
          <div className="space-y-4">
            <Input label="Title" value={editEvent.title} onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })} />
            <Input label="Location" value={editEvent.location || ''} onChange={(e) => setEditEvent({ ...editEvent, location: e.target.value })} />
            <Input label="Start Date" type="datetime-local" value={editEvent.startDate} onChange={(e) => setEditEvent({ ...editEvent, startDate: e.target.value })} />
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                value={editEvent.description || ''}
                onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => updateEventMutation.mutate()} disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditEvent(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showAnnouncementModal} onClose={() => setShowAnnouncementModal(false)} title={t('dashboard.addAnnouncement')}>
        <div className="space-y-4">
          <Input label="Title" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
          <div>
            <label className="text-sm font-medium mb-1 block">Content</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => createAnnouncementMutation.mutate()} disabled={!announcementForm.title || !announcementForm.content || createAnnouncementMutation.isPending}>
              {createAnnouncementMutation.isPending ? 'Posting...' : 'Post Announcement'}
            </Button>
            <Button variant="outline" onClick={() => setShowAnnouncementModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editAnnouncement} onClose={() => setEditAnnouncement(null)} title={t('dashboard.editAnnouncement')}>
        {editAnnouncement && (
          <div className="space-y-4">
            <Input label="Title" value={editAnnouncement.title} onChange={(e) => setEditAnnouncement({ ...editAnnouncement, title: e.target.value })} />
            <div>
              <label className="text-sm font-medium mb-1 block">Content</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                value={editAnnouncement.content}
                onChange={(e) => setEditAnnouncement({ ...editAnnouncement, content: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => updateAnnouncementMutation.mutate()} disabled={updateAnnouncementMutation.isPending}>
                {updateAnnouncementMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditAnnouncement(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
