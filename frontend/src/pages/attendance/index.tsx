import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Check, X, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { attendanceApi, academicsApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present', color: 'bg-green-100 text-green-800' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 text-red-800' },
  { value: 'LATE', label: 'Late', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'EXCUSED', label: 'Excused', color: 'bg-blue-100 text-blue-800' },
];

export function AttendancePage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const today = new Date().toISOString().split('T')[0];
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<Record<string, string>>({});

  const { data: stats } = useQuery({
    queryKey: ['attendance-stats', date],
    queryFn: () => attendanceApi.getStats(date),
  });

  const { data: classes } = useQuery({
    queryKey: ['academics-classes'],
    queryFn: academicsApi.getClasses,
  });

  const { data: classData, isLoading } = useQuery({
    queryKey: ['class-attendance', selectedClass, date],
    queryFn: () => attendanceApi.getClassAttendance(selectedClass, date),
    enabled: !!selectedClass,
  });

  useEffect(() => {
    setRecords({});
  }, [selectedClass, date]);

  const markMutation = useMutation({
    mutationFn: () =>
      attendanceApi.markClassAttendance(selectedClass, {
        date,
        records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });

  const setStatus = (studentId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: string) => {
    if (!classData) return;
    const all: Record<string, string> = {};
    classData.forEach((item: { student: { id: string } }) => {
      all[item.student.id] = status;
    });
    setRecords(all);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('attendance.title')}</h1>
        <p className="text-muted-foreground">{t('attendance.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Present Today" value={stats?.present || 0} icon={Check} />
        <StatCard title="Absent" value={stats?.absent || 0} icon={X} />
        <StatCard title="Late" value={stats?.late || 0} icon={Clock} />
        <StatCard title="Attendance Rate" value={`${stats?.rate || 0}%`} icon={ClipboardCheck} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Select class"
            >
              <option value="">Select class...</option>
              {classes?.map((c: { id: string; name: string; section?: string }) => (
                <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Attendance date"
            />
            {selectedClass && (
              <>
                <Button variant="outline" size="sm" onClick={() => markAll('PRESENT')}>All Present</Button>
                <Button size="sm" onClick={() => markMutation.mutate()} disabled={markMutation.isPending}>
                  <Save className="h-4 w-4" /> Save
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedClass ? (
            <p className="text-center text-muted-foreground py-8">Select a class to mark attendance</p>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {classData?.map((item: {
                student: { id: string; admissionNumber: string; user: { firstName: string; lastName: string } };
                attendance: { status: string } | null;
              }) => {
                const current = records[item.student.id] || item.attendance?.status || 'PRESENT';
                return (
                  <div key={item.student.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">{item.student.user.firstName} {item.student.user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{item.student.admissionNumber}</p>
                    </div>
                    <div className="flex gap-1">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setStatus(item.student.id, s.value)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                            current === s.value ? s.color + ' ring-2 ring-offset-1 ring-primary/30' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
