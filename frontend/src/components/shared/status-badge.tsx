import { cn, getStatusStyle } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface BadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  const { t } = useTranslation();
  const label = t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status.replace(/_/g, ' ');
  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusStyle(status), className)}>
      {label}
    </span>
  );
}
