import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarOff, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { modulesApi } from '@/services/endpoints';
import { useTranslation, useFormatDate } from '@/i18n';

export function HRPage() {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const { data: employeesData } = useQuery({
    queryKey: ['hr-employees'],
    queryFn: () => modulesApi.hr.getEmployees({ limit: '20' }),
  });
  const { data: leave } = useQuery({ queryKey: ['hr-leave'], queryFn: modulesApi.hr.getLeave });
  const { data: stats } = useQuery({ queryKey: ['hr-stats'], queryFn: modulesApi.hr.getStats });

  const employees = employeesData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('hr.title')}</h1>
        <p className="text-muted-foreground">{t('hr.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title={t('portals.hrPortal.totalEmployees')} value={stats?.employees || 0} icon={Users} />
        <StatCard title={t('portals.hrPortal.pendingLeave')} value={stats?.pendingLeave || 0} icon={CalendarOff} />
        <StatCard title={t('portals.hrPortal.approvedLeave')} value={stats?.approvedLeave || 0} icon={CalendarOff} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(!tab || tab === 'employees') && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {t('portals.hrPortal.employees')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {employees.map((emp: {
              id: string; employeeId: string; designation: string; department?: string;
              user: { firstName: string; lastName: string; email: string };
            }) => (
              <div key={emp.id} className="p-3 rounded-lg border border-border">
                <p className="font-medium">{emp.user.firstName} {emp.user.lastName}</p>
                <p className="text-sm text-muted-foreground">{emp.designation} · {emp.employeeId}</p>
                <p className="text-xs text-muted-foreground">{emp.user.email}</p>
              </div>
            ))}
            {employees.length === 0 && <p className="text-muted-foreground text-center py-4">{t('portals.hrPortal.noEmployees')}</p>}
          </CardContent>
        </Card>
        )}
        {(!tab || tab === 'leave') && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarOff className="h-5 w-5" /> {t('portals.hrPortal.leaveRequests')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {leave?.map((l: {
              id: string; leaveType: string; startDate: string; endDate: string; status: string;
              user: { firstName: string; lastName: string };
            }) => (
              <div key={l.id} className="flex justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{l.user.firstName} {l.user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{l.leaveType} · {formatDate(l.startDate)} — {formatDate(l.endDate)}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            )) || <p className="text-muted-foreground text-center py-4">{t('portals.hrPortal.noLeave')}</p>}
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
