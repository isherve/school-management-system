import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Printer, BarChart3, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useToastStore, useAppStore } from '@/stores';
import { loadReportTable, type ReportId } from '@/lib/report-data';
import { downloadCsv, printReportHtml, tableHtml } from '@/lib/report-export';

const REPORT_IDS: ReportId[] = [
  'student', 'attendance', 'financial', 'academic', 'teacher',
  'library', 'transport', 'health', 'inventory',
];

const REPORT_PATHS: Record<ReportId, string> = {
  student: '/students',
  attendance: '/attendance',
  financial: '/finance',
  academic: '/exams',
  teacher: '/teachers',
  library: '/library',
  transport: '/transport',
  health: '/health',
  inventory: '/inventory',
};

export function ReportsPage() {
  const { t } = useTranslation();
  const pushToast = useToastStore((s) => s.push);
  const schoolName = useAppStore((s) => s.schoolName);
  const [loadingId, setLoadingId] = useState<ReportId | null>(null);

  const runExport = async (id: ReportId, format: 'pdf' | 'excel') => {
    setLoadingId(id);
    try {
      const { title, headers, rows } = await loadReportTable(id);
      const reportTitle = t(`reports.types.${id}.title`);
      if (format === 'excel') {
        downloadCsv(`${id}-report-${Date.now()}.csv`, headers, rows);
        pushToast(t('reports.exportSuccess', { format: 'CSV' }), 'success');
      } else {
        printReportHtml(reportTitle || title, schoolName, tableHtml(headers, rows));
        pushToast(t('reports.exportSuccess', { format: 'PDF' }), 'success');
      }
    } catch {
      pushToast(t('reports.exportFailed'), 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        <p className="text-muted-foreground">{t('reports.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_IDS.map((id) => {
          const busy = loadingId === id;
          return (
            <Card key={id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {t(`reports.types.${id}.title`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex-1">{t(`reports.types.${id}.desc`)}</p>
                <Link to={REPORT_PATHS[id]} className="mb-3">
                  <Button size="sm" variant="secondary" className="w-full">
                    <ExternalLink className="h-3 w-3" /> {t('reports.openModule')}
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => runExport(id, 'pdf')}>
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />} PDF
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => runExport(id, 'excel')}>
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />} Excel
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => window.print()} aria-label={t('reports.print')}>
                    <Printer className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
