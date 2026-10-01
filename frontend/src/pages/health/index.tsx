import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pill, Stethoscope, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { modulesApi } from '@/services/endpoints';
import { useTranslation, useFormatDate } from '@/i18n';

export function HealthPage() {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'visits';
  const { data: visits } = useQuery({ queryKey: ['health-visits'], queryFn: modulesApi.health.getVisits });
  const { data: medicine } = useQuery({ queryKey: ['health-medicine'], queryFn: modulesApi.health.getMedicine });

  const lowStock = medicine?.filter((m: { quantity: number; reorderLevel: number }) => m.quantity <= m.reorderLevel) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('health.title')}</h1>
        <p className="text-muted-foreground">{t('health.subtitle')}</p>
      </div>

      {(tab === 'visits' || tab === 'medicine') && lowStock.length > 0 && tab === 'medicine' && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>{t('health.lowStockWarning', { count: lowStock.length })}</span>
          </CardContent>
        </Card>
      )}

      {(tab === 'visits' || !searchParams.get('tab')) && (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> {t('health.clinicVisits')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 font-medium">{t('portals.nursePortal.student')}</th>
                  <th className="py-2 px-2 font-medium">{t('common.date')}</th>
                  <th className="py-2 px-2 font-medium">{t('health.symptoms')}</th>
                  <th className="py-2 px-2 font-medium">{t('health.diagnosis')}</th>
                  <th className="py-2 px-2 font-medium">{t('health.treatment')}</th>
                </tr>
              </thead>
              <tbody>
                {visits?.map((v: {
                  id: string; visitDate: string; symptoms?: string; diagnosis?: string; treatment?: string;
                  student?: { user: { firstName: string; lastName: string }; class?: { name: string } };
                }) => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">
                      {v.student ? `${v.student.user.firstName} ${v.student.user.lastName}` : '—'}
                      {v.student?.class && <span className="block text-xs text-muted-foreground font-normal">{v.student.class.name}</span>}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap text-muted-foreground">{formatDate(v.visitDate)}</td>
                    <td className="py-2 px-2">{v.symptoms || t('health.generalVisit')}</td>
                    <td className="py-2 px-2 text-muted-foreground">{v.diagnosis || '—'}</td>
                    <td className="py-2 px-2 text-muted-foreground">{v.treatment || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visits?.length && <p className="text-muted-foreground text-center py-6">{t('health.noVisits')}</p>}
          </div>
        </CardContent>
      </Card>
      )}

      {(tab === 'medicine' || !searchParams.get('tab')) && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" /> {t('health.medicineInventory')} ({medicine?.length || 0} {t('health.items')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 px-2 font-medium">{t('health.medicine')}</th>
                  <th className="py-2 px-2 font-medium">{t('common.quantity')}</th>
                  <th className="py-2 px-2 font-medium">{t('health.unit')}</th>
                  <th className="py-2 px-2 font-medium">{t('health.reorderLevel')}</th>
                  <th className="py-2 px-2 font-medium">{t('health.expiry')}</th>
                  <th className="py-2 px-2 font-medium">{t('health.stockStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {medicine?.map((m: { id: string; name: string; quantity: number; unit: string; reorderLevel: number; expiryDate?: string }) => {
                  const isLow = m.quantity <= m.reorderLevel;
                  return (
                    <tr key={m.id} className={`border-b border-border/50 hover:bg-muted/30 ${isLow ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-2 px-2 font-medium">{m.name}</td>
                      <td className="py-2 px-2">{m.quantity.toLocaleString()}</td>
                      <td className="py-2 px-2 text-muted-foreground">{m.unit}</td>
                      <td className="py-2 px-2 text-muted-foreground">{m.reorderLevel}</td>
                      <td className="py-2 px-2 text-muted-foreground">{m.expiryDate ? formatDate(m.expiryDate) : '—'}</td>
                      <td className="py-2 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isLow ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                          {isLow ? t('health.lowStock') : t('health.stockOk')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!medicine?.length && <p className="text-muted-foreground text-center py-6">{t('health.noMedicine')}</p>}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
