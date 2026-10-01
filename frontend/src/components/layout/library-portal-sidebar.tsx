import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  History,
  ChevronLeft,
  LogOut,
  Moon,
  Sun,
  ArrowLeft,
  Library,
} from 'lucide-react';
import { cn, getRoleLabel } from '@/lib/utils';
import { useAuthStore, useSidebarStore, useThemeStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

const navItems = [
  { labelKey: 'libraryNav.dashboard', icon: LayoutDashboard, path: '/library-portal' },
  { labelKey: 'libraryNav.books', icon: BookOpen, path: '/library-portal/books' },
  { labelKey: 'libraryNav.borrowings', icon: BookMarked, path: '/library-portal/borrowings' },
  { labelKey: 'libraryNav.history', icon: History, path: '/library-portal/history' },
];

export function LibraryPortalSidebar() {
  const location = useLocation();
  const { isCollapsed, toggle, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Library portal navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!isCollapsed && (
            <Link to="/library-portal" className="flex items-center gap-2">
              <Library className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg">{t('library.portalTitle')}</span>
            </Link>
          )}
          <button
            onClick={toggle}
            className="rounded-md p-1.5 hover:bg-white/10 hidden lg:block"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={cn('h-5 w-5 transition-transform', isCollapsed && 'rotate-180')} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === '/library-portal'
              ? location.pathname === '/library-portal'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );
          })}

          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent mt-4 border-t border-white/10 pt-4"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{t('libraryNav.backToAdmin')}</span>}
          </Link>
        </nav>

        <div className="border-t border-white/10 p-4 space-y-2">
          {!isCollapsed && <LanguageSwitcher className="mb-2" />}
          {!isCollapsed && user && (
            <div className="px-2 py-1">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-sidebar-foreground/60">{getRoleLabel(user.role)}</p>
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {!isCollapsed && <span>{theme === 'light' ? t('nav.dark') : t('nav.light')}</span>}
            </button>
            <button onClick={logout} className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/10 text-red-400">
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>{t('nav.logout')}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
