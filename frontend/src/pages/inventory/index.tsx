import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { modulesApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';
import { useToastStore } from '@/stores';

type Tab = 'assets' | 'suppliers';

export function InventoryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const [tab, setTab] = useState<Tab>('assets');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', serialNumber: '', location: '', purchaseCost: '' });

  const { data: assets } = useQuery({ queryKey: ['inventory-assets'], queryFn: modulesApi.inventory.getAssets });
  const { data: suppliers } = useQuery({
    queryKey: ['inventory-suppliers'],
    queryFn: modulesApi.inventory.getSuppliers,
    enabled: tab === 'suppliers',
  });

  const createMutation = useMutation({
    mutationFn: () => modulesApi.inventory.createAsset({
      name: form.name,
      category: form.category,
      serialNumber: form.serialNumber || undefined,
      location: form.location || undefined,
      purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-assets'] });
      setModalOpen(false);
      setForm({ name: '', category: '', serialNumber: '', location: '', purchaseCost: '' });
      pushToast(t('inventory.assetCreated'), 'success');
    },
    onError: () => pushToast(t('inventory.assetCreateFailed'), 'error'),
  });

  const activeCount = assets?.filter((a: { status: string }) => a.status === 'ACTIVE').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
          <p className="text-muted-foreground">{t('inventory.subtitle')}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('inventory.addAsset')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title={t('inventory.totalAssets')} value={assets?.length ?? 0} icon={Package} />
        <StatCard title={t('inventory.activeAssets')} value={activeCount} icon={Package} />
        <StatCard title={t('inventory.suppliersCount')} value={suppliers?.length ?? '—'} icon={Truck} />
      </div>

      <div className="flex gap-2 border-b border-border">
        {(['assets', 'suppliers'] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t(`inventory.${id}`)}
          </button>
        ))}
      </div>

      {tab === 'assets' && (
        <Card>
          <CardHeader><CardTitle>{t('inventory.assetsTable')}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">{t('common.name')}</th>
                    <th className="text-left py-2">{t('common.category')}</th>
                    <th className="text-left py-2">{t('inventory.serial')}</th>
                    <th className="text-left py-2">{t('common.location')}</th>
                    <th className="text-left py-2">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {assets?.map((a: { id: string; name: string; category: string; serialNumber?: string; location?: string; status: string }) => (
                    <tr key={a.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-2 font-medium">{a.name}</td>
                      <td className="py-2">{a.category}</td>
                      <td className="py-2 font-mono text-xs">{a.serialNumber || '—'}</td>
                      <td className="py-2">{a.location || '—'}</td>
                      <td className="py-2"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!assets?.length && <p className="text-muted-foreground text-center py-8">{t('inventory.noAssets')}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'suppliers' && (
        <Card>
          <CardHeader><CardTitle>{t('inventory.suppliers')}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers?.map((s: { id: string; name: string; contactPerson?: string; phone?: string; email?: string }) => (
              <div key={s.id} className="p-4 rounded-lg border border-border">
                <p className="font-medium">{s.name}</p>
                {s.contactPerson && <p className="text-sm text-muted-foreground">{s.contactPerson}</p>}
                <p className="text-xs text-muted-foreground mt-1">{s.phone || '—'} · {s.email || '—'}</p>
              </div>
            )) || <p className="text-muted-foreground col-span-full text-center py-8">{t('inventory.noSuppliers')}</p>}
          </CardContent>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('inventory.addAsset')}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <Input label={t('common.name')} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label={t('common.category')} required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label={t('inventory.serial')} value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          <Input label={t('common.location')} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label={t('inventory.purchaseCost')} type="number" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
