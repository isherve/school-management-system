import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n';
import { buildShortcutLink, getPortalShortcuts, type PortalShortcut } from '@/lib/portal-shortcuts';
import { useAuthStore } from '@/stores';

interface PortalShortcutsProps {
  /** Override role (e.g. admin previewing a portal) */
  role?: string;
  titleKey?: string;
  items?: PortalShortcut[];
  className?: string;
}

export function PortalShortcuts({ role, titleKey = 'shortcuts.title', items, className }: PortalShortcutsProps) {
  const { t } = useTranslation();
  const userRole = useAuthStore((s) => s.user?.role);
  const shortcuts = items ?? getPortalShortcuts((role ?? userRole) as Parameters<typeof getPortalShortcuts>[0]);

  if (!shortcuts.length) return null;

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-3">{t(titleKey)}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.labelKey} to={buildShortcutLink(item)}>
              <Card className="h-full hover:border-primary/40 hover:shadow-sm transition-all">
                <CardContent className="pt-4 flex gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{t(item.labelKey)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t(item.descKey)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
