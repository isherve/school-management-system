import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ToastHost } from '@/components/shared/toast-host';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useSidebarStore, useAppStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const { isCollapsed } = useSidebarStore();
  const schoolName = useAppStore((s) => s.schoolName);
  const { t } = useTranslation();
  useDocumentTitle();

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Sidebar />
      <div className={cn('transition-all duration-300 flex flex-col min-h-screen', isCollapsed ? 'lg:ml-16' : 'lg:ml-64')}>
        <Header />
        <main className="p-4 lg:p-6 flex-1" id="main-content" role="main">
          <Outlet />
        </main>
        <footer className="border-t border-border px-4 lg:px-6 py-3 text-center text-xs text-muted-foreground">
          {t('footer.poweredBy')} · {schoolName}
        </footer>
      </div>
      <ToastHost />
    </div>
  );
}
