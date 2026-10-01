import { Globe } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { Locale } from '@/i18n/types';
import { cn } from '@/lib/utils';

const LOCALES: Locale[] = ['en', 'rw', 'fr'];

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {!compact && <Globe className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={t('language.label')}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>{t(`language.${l}`)}</option>
        ))}
      </select>
    </div>
  );
}
