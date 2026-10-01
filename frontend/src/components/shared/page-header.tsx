import { useTranslation } from '@/i18n';

interface PageHeaderProps {
  titleKey: string;
  subtitleKey: string;
}

export function PageHeader({ titleKey, subtitleKey }: PageHeaderProps) {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
      <p className="text-muted-foreground">{t(subtitleKey)}</p>
    </div>
  );
}
