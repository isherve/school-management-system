import { useQuery } from '@tanstack/react-query';
import { Building2, Bed, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { modulesApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';

export function HostelPage() {
  const { t } = useTranslation();
  const { data: stats } = useQuery({ queryKey: ['hostel-stats'], queryFn: modulesApi.hostel.getStats });
  const { data: rooms } = useQuery({ queryKey: ['hostel-rooms'], queryFn: modulesApi.hostel.getRooms });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('hostel.title')}</h1>
        <p className="text-muted-foreground">{t('hostel.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title={t('hostel.totalRooms')} value={stats?.totalRooms || 0} icon={Building2} />
        <StatCard title={t('hostel.totalCapacity')} value={stats?.totalCapacity || 0} icon={Bed} />
        <StatCard title={t('hostel.occupied')} value={stats?.occupied || 0} icon={Users} />
      </div>
      <Card>
        <CardHeader><CardTitle>{t('hostel.rooms')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms?.map((room: { id: string; name: string; floor?: number; capacity: number; occupied: number; status: string }) => (
              <div key={room.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{room.name}</p>
                  <StatusBadge status={room.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('hostel.floor')} {room.floor ?? '—'} · {room.occupied}/{room.capacity} {t('hostel.beds')}
                </p>
              </div>
            )) || <p className="text-muted-foreground col-span-full text-center py-8">{t('hostel.noRooms')}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
