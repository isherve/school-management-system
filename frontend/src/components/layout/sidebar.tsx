import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  ClipboardList,
  Library,
  Bus,
  Building2,
  Heart,
  Briefcase,
  Package,
  MessageSquare,
  FileText,
  Calendar,
  Video,
  Brain,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  Moon,
  Sun,
  UserCog,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useSidebarStore, useThemeStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { canAccessNav, ADMIN_ROLES } from '@/lib/access';
import {
  getPortalSidebarItems,
  getAdminPortalContextNav,
  usesPortalSidebar,
  buildPortalLink,
  isPortalNavActive,
  type SidebarNavEntry,
} from '@/lib/portal-nav';

const adminNavItems = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { labelKey: 'nav.portals', icon: LayoutGrid, path: '/admin/portals' },
  { labelKey: 'nav.userManagement', icon: UserCog, path: '/admin/users' },
  { labelKey: 'nav.students', icon: Users, path: '/students' },
  { labelKey: 'nav.teachers', icon: GraduationCap, path: '/teachers' },
  { labelKey: 'nav.academics', icon: BookOpen, path: '/academics' },
  { labelKey: 'nav.attendance', icon: ClipboardList, path: '/attendance' },
  { labelKey: 'nav.examinations', icon: FileText, path: '/exams' },
  { labelKey: 'nav.finance', icon: DollarSign, path: '/finance' },
  { labelKey: 'nav.library', icon: Library, path: '/library' },
  { labelKey: 'nav.transport', icon: Bus, path: '/transport' },
  { labelKey: 'nav.hostel', icon: Building2, path: '/hostel' },
  { labelKey: 'nav.health', icon: Heart, path: '/health' },
  { labelKey: 'nav.hr', icon: Briefcase, path: '/hr' },
  { labelKey: 'nav.inventory', icon: Package, path: '/inventory' },
  { labelKey: 'nav.communication', icon: MessageSquare, path: '/communication' },
  { labelKey: 'nav.timetable', icon: Calendar, path: '/timetable' },
  { labelKey: 'nav.onlineLearning', icon: Video, path: '/learning' },
  { labelKey: 'nav.aiTools', icon: Brain, path: '/ai' },
  { labelKey: 'nav.reports', icon: BarChart3, path: '/reports' },
  { labelKey: 'nav.settings', icon: Settings, path: '/settings' },
];

function PortalNavSection({
  items,
  isCollapsed,
  pathname,
  search,
  onNavigate,
  t,
}: {
  items: SidebarNavEntry[];
  isCollapsed: boolean;
  pathname: string;
  search: string;
  onNavigate: () => void;
  t: (key: string) => string;
}) {
  let lastSection: string | undefined;

  return (
    <>
      {items.map((item) => {
        const showSection = item.sectionKey && item.sectionKey !== lastSection;
        if (item.sectionKey) lastSection = item.sectionKey;
        const to = buildPortalLink(item);
        const active = isPortalNavActive(item, pathname, search);

        return (
          <div key={`${item.path}-${item.tab || item.view || item.labelKey}`}>
            {showSection && !isCollapsed && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                {t(item.sectionKey!)}
              </p>
            )}
            <Link
              to={to}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!isCollapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          </div>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggle, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();

  const role = user?.role;
  const isAdmin = role && ADMIN_ROLES.includes(role);
  const portalNav = getPortalSidebarItems(role);
  const adminContextNav = getAdminPortalContextNav(location.pathname, location.search, role);
  const showPortalNav = usesPortalSidebar(role) || adminContextNav.length > 0;
  const portalItems = portalNav.length > 0 ? portalNav : adminContextNav;

  const roleLabel = role
    ? (t(`roles.${role}`) !== `roles.${role}` ? t(`roles.${role}`) : role.replace(/_/g, ' '))
    : '';

  const homeLink = isAdmin
    ? '/dashboard'
    : portalItems[0]
      ? buildPortalLink(portalItems[0])
      : '/dashboard';

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
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {!isCollapsed && (
            <Link to={homeLink} className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg">EduSMS</span>
            </Link>
          )}
          <button onClick={toggle} className="rounded-md p-1.5 hover:bg-white/10 hidden lg:block"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <ChevronLeft className={cn('h-5 w-5 transition-transform', isCollapsed && 'rotate-180')} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {showPortalNav && portalItems.length > 0 && (
            <PortalNavSection
              items={portalItems}
              isCollapsed={isCollapsed}
              pathname={location.pathname}
              search={location.search}
              onNavigate={() => setMobileOpen(false)}
              t={t}
            />
          )}

          {isAdmin && (
            <>
              {!isCollapsed && showPortalNav && portalItems.length > 0 && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                  {t('nav.adminModules')}
                </p>
              )}
              {adminNavItems.filter((item) => canAccessNav(role, item.path)).map((item) => {
                const isActive = location.pathname.startsWith(item.path);
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
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {!isCollapsed && <span>{t(item.labelKey)}</span>}
                  </Link>
                );
              })}
            </>
          )}

          {!showPortalNav && !isAdmin && (
            adminNavItems.filter((item) => canAccessNav(role, item.path)).map((item) => {
              const isActive = location.pathname.startsWith(item.path);
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
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!isCollapsed && <span>{t(item.labelKey)}</span>}
                </Link>
              );
            })
          )}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-2">
          {!isCollapsed && <LanguageSwitcher className="mb-2" />}
          {!isCollapsed && user && (
            <div className="px-2 py-1">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors" aria-label={t('header.toggleTheme')}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {!isCollapsed && <span>{theme === 'light' ? t('nav.dark') : t('nav.light')}</span>}
            </button>
            <button onClick={logout} className="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/10 text-red-400" aria-label={t('nav.logout')}>
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>{t('nav.logout')}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
