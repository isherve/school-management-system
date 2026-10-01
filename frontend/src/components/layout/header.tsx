import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Menu, Bell, Search, Moon, Sun, X } from 'lucide-react';
import { useSidebarStore, useThemeStore } from '@/stores';
import { searchApi, communicationApi } from '@/services/endpoints';
import { useTranslation, useFormatDate } from '@/i18n';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

const SEARCH_ROUTES: Record<string, string> = {
  students: '/students',
  teachers: '/teachers',
  books: '/library',
  invoices: '/finance',
};

function formatSearchItem(key: string, item: Record<string, unknown>): string {
  if (key === 'students') {
    const user = item.user as { firstName?: string; lastName?: string } | undefined;
    return `${user?.firstName || ''} ${user?.lastName || ''} (${item.admissionNumber || ''})`.trim();
  }
  if (key === 'teachers') {
    const user = item.user as { firstName?: string; lastName?: string } | undefined;
    return `${user?.firstName || ''} ${user?.lastName || ''} (${item.employeeId || ''})`.trim();
  }
  if (key === 'books') return String(item.title || '');
  if (key === 'invoices') return String(item.invoiceNumber || '');
  return JSON.stringify(item).slice(0, 60);
}

export function Header() {
  const navigate = useNavigate();
  const formatDate = useFormatDate();
  const { setMobileOpen } = useSidebarStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, unknown[]> | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useQuery({
    queryKey: ['header-notifications'],
    queryFn: () => communicationApi.getNotifications(true),
    enabled: notifOpen,
    refetchInterval: notifOpen ? 60_000 : false,
  });

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults(null); return; }
    try {
      setSearchResults(await searchApi.global(q));
    } catch {
      setSearchResults(null);
    }
  };

  const openSearchResult = (key: string) => {
    const path = SEARCH_ROUTES[key];
    if (path) {
      navigate(path);
      setSearchResults(null);
      setSearchQuery('');
    }
  };

  const unreadCount = notifications?.length ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
      <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 hover:bg-accent lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={t('header.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {searchResults && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-border bg-card shadow-lg max-h-80 overflow-y-auto z-50">
            {Object.entries(searchResults).every(([, items]) => !(items as unknown[]).length) ? (
              <p className="p-4 text-sm text-muted-foreground text-center">{t('common.noResults')}</p>
            ) : (
              Object.entries(searchResults).map(([key, items]) =>
                (items as unknown[]).length > 0 ? (
                  <div key={key} className="p-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">{key}</p>
                    {(items as Record<string, unknown>[]).map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => openSearchResult(key)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
                      >
                        {formatSearchItem(key, item)}
                      </button>
                    ))}
                  </div>
                ) : null
              )
            )}
          </div>
        )}
      </div>

      <LanguageSwitcher compact />

      <button
        onClick={toggleTheme}
        className="rounded-md p-2 hover:bg-accent transition-colors"
        aria-label={t('header.toggleTheme')}
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>

      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotifOpen((o) => !o)}
          className="relative rounded-md p-2 hover:bg-accent"
          aria-label={t('header.notifications')}
          aria-expanded={notifOpen}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto rounded-md border border-border bg-card shadow-lg z-50">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-sm font-semibold">{t('header.notifications')}</p>
              <button type="button" onClick={() => setNotifOpen(false)} className="p-1 hover:bg-accent rounded" aria-label={t('common.close')}>
                <X className="h-4 w-4" />
              </button>
            </div>
            {!notifications?.length ? (
              <p className="p-4 text-sm text-muted-foreground text-center">{t('header.noNotifications')}</p>
            ) : (
              notifications.map((n: { id: string; title: string; message: string; createdAt: string }) => (
                <div key={n.id} className="border-b border-border px-3 py-2.5 last:border-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                </div>
              ))
            )}
            <Link
              to="/communication"
              onClick={() => setNotifOpen(false)}
              className="block text-center text-xs text-primary py-2.5 hover:bg-accent border-t border-border"
            >
              {t('header.viewAllNotifications')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
