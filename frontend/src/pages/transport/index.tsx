import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bus, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { modulesApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';

export function TransportPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'fleet';

  const { data: stats } = useQuery({ queryKey: ['transport-stats'], queryFn: modulesApi.transport.getStats });
  const { data: vehicles } = useQuery({ queryKey: ['transport-vehicles'], queryFn: modulesApi.transport.getVehicles });
  const { data: assignments } = useQuery({ queryKey: ['transport-assignments'], queryFn: modulesApi.transport.getAssignments });

  const showFleet = tab === 'fleet';
  const showAssignments = tab === 'assignments';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('transport.title')}</h1>
        <p className="text-muted-foreground">{t('transport.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title={t('transport.activeVehicles')} value={stats?.vehicles || 0} icon={Bus} />
        <StatCard title={t('transport.studentAssignments')} value={stats?.assignments || 0} icon={Users} />
      </div>

      {(showFleet || (!showFleet && !showAssignments)) && (
      <Card>
        <CardHeader><CardTitle>{t('transport.fleet')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles?.map((v: { id: string; registration: string; make?: string; model?: string; capacity: number; driverName?: string; routes: { name: string }[] }) => (
              <div key={v.id} className="p-4 rounded-lg border border-border">
                <p className="font-medium">{v.registration}</p>
                <p className="text-sm text-muted-foreground">{v.make} {v.model} · {t('transport.capacity')}: {v.capacity}</p>
                {v.driverName && <p className="text-xs text-muted-foreground mt-1">{t('transport.driver')}: {v.driverName}</p>}
                {v.routes?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {v.routes.map((r, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {r.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )) || <p className="text-muted-foreground col-span-full text-center py-8">{t('transport.noVehicles')}</p>}
          </div>
        </CardContent>
      </Card>
      )}

      {(showAssignments || (!showFleet && !showAssignments)) && (
      <Card>
        <CardHeader><CardTitle>{t('portals.transportPortal.assignments')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 font-medium">{t('portals.transportPortal.student')}</th>
                  <th className="py-2 px-2 font-medium">{t('portals.transportPortal.class')}</th>
                  <th className="py-2 px-2 font-medium">{t('portals.studentPortal.vehicle')}</th>
                  <th className="py-2 px-2 font-medium">{t('portals.transportPortal.pickup')}</th>
                </tr>
              </thead>
              <tbody>
                {assignments?.map((a: {
                  id: string; pickupPoint?: string;
                  student: { user: { firstName: string; lastName: string }; class?: { name: string; section?: string } };
                  vehicle: { registration: string };
                }) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{a.student.user.firstName} {a.student.user.lastName}</td>
                    <td className="py-2 px-2 text-muted-foreground">
                      {a.student.class ? `${a.student.class.name} ${a.student.class.section || ''}` : '—'}
                    </td>
                    <td className="py-2 px-2">{a.vehicle.registration}</td>
                    <td className="py-2 px-2 text-muted-foreground">{a.pickupPoint || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!assignments?.length && <p className="text-muted-foreground text-center py-8">{t('portals.transportPortal.noAssignments')}</p>}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
