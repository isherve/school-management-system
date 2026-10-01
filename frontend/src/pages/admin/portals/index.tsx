import { Link } from 'react-router-dom';
import {
  Library, Users, GraduationCap, Briefcase, Heart, Bus, DollarSign, UserCog, LayoutGrid, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { getAccessiblePortals, ADMIN_ROLES, type PortalDef } from '@/lib/access';

const PORTAL_ICONS: Record<string, typeof Library> = {
  library: Library,
  parent: Users,
  student: GraduationCap,
  teacher: Briefcase,
  nurse: Heart,
  transport: Bus,
  finance: DollarSign,
  hr: UserCog,
};

export function AdminPortalsPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const portals = getAccessiblePortals(user?.role);
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutGrid className="h-7 w-7 text-primary" />
          {t('portals.title')}
        </h1>
        <p className="text-muted-foreground">{t('portals.subtitle')}</p>
      </div>

      {isAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t('portals.adminHint')}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {portals.map((portal: PortalDef) => {
          const Icon = PORTAL_ICONS[portal.id] || LayoutGrid;
          return (
            <Link key={portal.id} to={portal.path} className="group">
              <Card className={`h-full border transition-all hover:shadow-md hover:border-primary/40 ${portal.color}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg bg-white/80 dark:bg-black/20 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-base mt-2">{t(portal.titleKey)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm opacity-80">{t(portal.descKey)}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {portals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('portals.noAccess')}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
