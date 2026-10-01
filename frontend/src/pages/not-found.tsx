import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/stores';
import { getHomePath } from '@/lib/access';

export function NotFoundPage() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.user?.role);
  const home = role ? getHomePath(role) : '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30 text-center">
      <p className="text-6xl font-bold text-primary/80">404</p>
      <h1 className="text-2xl font-semibold mt-4">{t('errors.notFoundTitle')}</h1>
      <p className="text-muted-foreground mt-2 max-w-md">{t('errors.notFoundDesc')}</p>
      <div className="flex flex-wrap gap-3 mt-8 justify-center">
        <Link to={home}>
          <Button><Home className="h-4 w-4" /> {t('errors.goHome')}</Button>
        </Link>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" /> {t('errors.goBack')}
        </Button>
      </div>
    </div>
  );
}
