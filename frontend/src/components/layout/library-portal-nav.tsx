import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BookMarked, History, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

const BASE = '/admin/portals/library';

const tabs = [
  { path: BASE, icon: LayoutDashboard, labelKey: 'libraryNav.dashboard', exact: true },
  { path: `${BASE}/books`, icon: BookOpen, labelKey: 'libraryNav.books' },
  { path: `${BASE}/borrowings`, icon: BookMarked, labelKey: 'libraryNav.borrowings' },
  { path: `${BASE}/history`, icon: History, labelKey: 'libraryNav.history' },
];

export function LibraryPortalNav() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Link to="/admin/portals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {t('libraryNav.backToPortals')}
      </Link>
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map(({ path, icon: Icon, labelKey, exact }) => {
          const active = exact ? location.pathname === path : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
