import { GraduationCap, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

interface AuthLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

export function AuthLayout({ children, footer, wide }: AuthLayoutProps) {
  const { t } = useTranslation();

  const features = [
    t('auth.feature1'),
    t('auth.feature2'),
    t('auth.feature3'),
    t('auth.feature4'),
    t('auth.feature5'),
  ];

  return (
    <div className="min-h-screen flex font-[Lato,sans-serif]">
      {/* Left branding panel — Inuma-style */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#00628B] via-[#004d6e] to-[#003a54]">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-white/[0.03]" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="h-24 w-24 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="h-14 w-14 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold leading-tight tracking-tight">EduSMS</h1>
              <p className="text-blue-200 text-sm mt-0.5">{t('auth.systemSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-7 -mt-8">
            <div>
              <h2 className="text-white text-2xl xl:text-3xl font-bold leading-tight">
                {t('auth.heroTitle')}
              </h2>
              <p className="text-blue-200/80 mt-3 text-sm leading-relaxed max-w-md">
                {t('auth.heroDescription')}
              </p>
            </div>
            <div className="space-y-3.5">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </div>
                  <span className="text-blue-100 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-200/60 text-xs">{t('auth.poweredBy')}</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="lg:hidden px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-12 w-12 rounded-xl bg-urblue/10 flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-urblue" />
            </div>
            <div>
              <p className="text-sm font-bold text-urblue leading-tight">EduSMS</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{t('auth.systemSubtitleShort')}</p>
            </div>
          </div>
          <LanguageSwitcher compact />
        </div>

        <div className="hidden lg:flex justify-end px-8 pt-6">
          <LanguageSwitcher compact />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-8">
          <div className={wide ? 'w-full max-w-4xl' : 'w-full max-w-[420px]'}>
            {children}
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
