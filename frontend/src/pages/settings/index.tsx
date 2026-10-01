import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, GraduationCap, Mail, School, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { settingsApi } from '@/services/endpoints';
import { formatDate } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useTranslation } from '@/i18n';

type Tab = 'profile' | 'academic' | 'grading' | 'email';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Record<string, string>>({});

  const { data: school } = useQuery({
    queryKey: ['school-settings'],
    queryFn: settingsApi.getSchool,
  });

  const { data: years } = useQuery({
    queryKey: ['academic-years'],
    queryFn: settingsApi.getAcademicYears,
    enabled: tab === 'academic',
  });

  const { data: grades } = useQuery({
    queryKey: ['grading'],
    queryFn: settingsApi.getGrading,
    enabled: tab === 'grading',
  });

  const { data: integrations } = useQuery({
    queryKey: ['settings-integrations'],
    queryFn: settingsApi.getIntegrations,
    enabled: tab === 'email',
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      settingsApi.updateSchool({
        name: profile.name ?? school?.name,
        motto: profile.motto ?? school?.motto,
        address: profile.address ?? school?.address,
        city: profile.city ?? school?.city,
        phone: profile.phone ?? school?.phone,
        email: profile.email ?? school?.email,
        website: profile.website ?? school?.website,
        timezone: profile.timezone ?? school?.timezone ?? 'Africa/Kigali',
        currency: profile.currency ?? school?.currency ?? 'RWF',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
      useAppStore.getState().loadSchoolSettings();
    },
  });

  const tabs = [
    { id: 'profile' as Tab, label: t('settings.tabs.profile'), icon: School },
    { id: 'academic' as Tab, label: t('settings.tabs.academic'), icon: Calendar },
    { id: 'grading' as Tab, label: t('settings.tabs.grading'), icon: GraduationCap },
    { id: 'email' as Tab, label: t('settings.tabs.email'), icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-7 w-7" /> {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === tabItem.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            <tabItem.icon className="h-4 w-4" /> {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && school && (
        <Card>
          <CardHeader><CardTitle>School Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            {['name', 'motto', 'address', 'city', 'phone', 'email', 'website', 'timezone', 'currency'].map((field) => (
              <Input
                key={field}
                id={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                defaultValue={field === 'currency' ? (school[field] || 'RWF') : (school[field] || '')}
                onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
              />
            ))}
            <div className="sm:col-span-2">
              <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'academic' && (
        <Card>
          <CardHeader><CardTitle>Academic Years & Terms</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {years?.map((year: {
              id: string; name: string; isCurrent: boolean;
              startDate: string; endDate: string;
              terms: { id: string; name: string; isCurrent: boolean; startDate: string; endDate: string }[];
            }) => (
              <div key={year.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{year.name} {year.isCurrent && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">Current</span>}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(year.startDate)} — {formatDate(year.endDate)}</p>
                  </div>
                </div>
                {year.terms?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {year.terms.map((term) => (
                      <span key={term.id} className={`text-xs px-2 py-1 rounded-full ${term.isCurrent ? 'bg-green-100 text-green-800' : 'bg-muted'}`}>
                        {term.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )) || <p className="text-muted-foreground">No academic years configured</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'email' && (
        <Card>
          <CardHeader><CardTitle>{t('settings.email.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-4 max-w-2xl text-sm">
            <div className={`rounded-lg border p-4 ${integrations?.emailConfigured ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20' : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'}`}>
              <p className="font-medium">
                {integrations?.emailConfigured ? t('settings.email.configured') : t('settings.email.notConfigured')}
              </p>
              {integrations?.devCodeOnScreen && (
                <p className="text-muted-foreground mt-2">{t('settings.email.devHint')}</p>
              )}
              {integrations?.smtpMandatory && (
                <p className="text-muted-foreground mt-2">{t('settings.email.mandatoryProduction')}</p>
              )}
            </div>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div><dt className="text-muted-foreground">{t('settings.email.smtpHost')}</dt><dd className="font-mono">{integrations?.smtpHost ?? '—'}</dd></div>
              <div><dt className="text-muted-foreground">{t('settings.email.smtpPort')}</dt><dd className="font-mono">{integrations?.smtpPort ?? '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">{t('settings.email.from')}</dt><dd>{integrations?.emailFrom ?? '—'}</dd></div>
            </dl>
            <p className="text-muted-foreground">{t('settings.email.instructions')}</p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
EMAIL_FROM="EduSMS <you@gmail.com>"`}</pre>
            <p className="text-xs text-muted-foreground">{t('settings.email.docHint')} docs/EMAIL-SMTP.md</p>
          </CardContent>
        </Card>
      )}

      {tab === 'grading' && (
        <Card>
          <CardHeader><CardTitle>Grading Scale</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Grade</th>
                  <th className="text-left py-2">Range</th>
                  <th className="text-left py-2">Points</th>
                  <th className="text-left py-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {grades?.map((g: { id: string; grade: string; minScore: number; maxScore: number; gradePoint?: number; remarks?: string }) => (
                  <tr key={g.id} className="border-b border-border">
                    <td className="py-2 font-medium">{g.grade}</td>
                    <td className="py-2">{g.minScore} — {g.maxScore}</td>
                    <td className="py-2">{g.gradePoint ?? '—'}</td>
                    <td className="py-2 text-muted-foreground">{g.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
