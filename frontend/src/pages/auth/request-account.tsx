import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, Loader2, AlertCircle, CheckCircle2, Calendar,
} from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { authApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

const POSITIONS = [
  { value: 'Student', labelKey: 'requestOptions.student' },
  { value: 'Teacher', labelKey: 'requestOptions.teacher' },
  { value: 'Parent', labelKey: 'requestOptions.parent' },
  { value: 'Staff Member', labelKey: 'requestOptions.staff' },
] as const;
const CAMPUSES = [
  { value: 'Kigali Main Campus', labelKey: 'requestOptions.campusKigali' },
  { value: 'Kicukiro Campus', labelKey: 'requestOptions.campusKicukiro' },
  { value: 'Remera Campus', labelKey: 'requestOptions.campusRemera' },
] as const;
const COLLEGES = [
  { value: 'Sciences', labelKey: 'requestOptions.collegeSciences' },
  { value: 'Languages', labelKey: 'requestOptions.collegeLanguages' },
  { value: 'Commerce', labelKey: 'requestOptions.collegeCommerce' },
  { value: 'Arts', labelKey: 'requestOptions.collegeArts' },
] as const;
const GENDERS = [
  { value: 'Male', labelKey: 'requestOptions.male' },
  { value: 'Female', labelKey: 'requestOptions.female' },
] as const;
const EMPLOYMENT_GROUPS = [
  { value: 'Day Scholar', labelKey: 'requestOptions.dayScholar' },
  { value: 'Boarder', labelKey: 'requestOptions.boarder' },
] as const;
const DEGREES = [
  { value: 'Primary (P1–P6)', labelKey: 'requestOptions.degreePrimary' },
  { value: 'O-Level (S1–S3)', labelKey: 'requestOptions.degreeOLevel' },
  { value: 'A-Level (S4–S6)', labelKey: 'requestOptions.degreeALevel' },
  { value: 'Technical/Vocational', labelKey: 'requestOptions.degreeTechnical' },
] as const;

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      {children}
      <span className="text-red-500 ml-0.5">*</span>
    </label>
  );
}

const inputClass =
  'w-full h-11 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none transition-all';

const selectClass =
  'w-full h-11 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none transition-all appearance-none';

export function RequestAccountPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    campus: '',
    college: '',
    regNo: '',
    gender: '',
    dateOfBirth: '',
    admissionDate: '',
    employmentGroup: '',
    degree: '',
    qualification: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const required = ['name', 'email', 'phone', 'position', 'campus', 'college', 'regNo', 'gender', 'dateOfBirth', 'admissionDate', 'employmentGroup', 'degree', 'qualification'] as const;
    const missing = required.filter((k) => !form[k]);
    if (missing.length > 0) {
      setError(t('auth.requestAccountMissingFields'));
      return;
    }
    setLoading(true);
    try {
      await authApi.requestAccount(form);
      setSubmitted(true);
    } catch {
      setError(t('auth.requestAccountFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout wide>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 sm:p-10 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.requestAccountSuccessTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">{t('auth.requestAccountSuccessHint')}</p>
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center px-6 rounded-md bg-[#1a2332] hover:bg-[#243044] text-white text-sm font-medium transition-colors"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-urblue mb-5 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t('auth.backToLogin')}
      </Link>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Header info box */}
        <div className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-4 sm:p-5 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex gap-4">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-urblue" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a2332] dark:text-white">{t('auth.requestAccountTitle')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{t('auth.requestAccountDescription')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pt-5 space-y-5" noValidate>
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountName')}</RequiredLabel>
              <input type="text" value={form.name} onChange={set('name')} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>{t('common.email')}</RequiredLabel>
              <input type="email" value={form.email} onChange={set('email')} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountPhone')}</RequiredLabel>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+2507xxxxxxxx" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountPosition')}</RequiredLabel>
              <select value={form.position} onChange={set('position')} className={selectClass}>
                <option value="">{t('auth.requestAccountSelectPosition')}</option>
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{t(p.labelKey)}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">{t('auth.requestAccountPositionHint')}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <RequiredLabel>{t('auth.requestAccountUnitType')}</RequiredLabel>
            <input type="text" value={t('requestOptions.department')} readOnly className={cn(inputClass, 'bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed uppercase tracking-wide')} />
            <p className="text-xs text-gray-400">{t('auth.requestAccountUnitTypeHint')}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountCampus')}</RequiredLabel>
              <select value={form.campus} onChange={set('campus')} className={selectClass}>
                <option value="">{t('auth.requestAccountSelectCampus')}</option>
                {CAMPUSES.map((c) => (
                  <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountCollege')}</RequiredLabel>
              <select value={form.college} onChange={set('college')} className={selectClass}>
                <option value="">{t('auth.requestAccountSelectCollege')}</option>
                {COLLEGES.map((c) => (
                  <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountRegNo')}</RequiredLabel>
              <input type="text" value={form.regNo} onChange={set('regNo')} placeholder={t('auth.requestAccountRegNoPlaceholder')} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountGender')}</RequiredLabel>
              <select value={form.gender} onChange={set('gender')} className={selectClass}>
                <option value="">{t('auth.requestAccountSelectGender')}</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{t(g.labelKey)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountDateOfBirth')}</RequiredLabel>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} max={today} className={cn(inputClass, 'pl-10')} />
              </div>
              <p className="text-xs text-gray-400">{t('auth.requestAccountDateHint')}</p>
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>{t('auth.requestAccountAdmissionDate')}</RequiredLabel>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input type="date" value={form.admissionDate} onChange={set('admissionDate')} max={today} className={cn(inputClass, 'pl-10')} />
              </div>
              <p className="text-xs text-gray-400">{t('auth.requestAccountDateHint')}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <RequiredLabel>{t('auth.requestAccountEmploymentGroup')}</RequiredLabel>
            <select value={form.employmentGroup} onChange={set('employmentGroup')} className={selectClass}>
              <option value="">{t('auth.requestAccountSelectGroup')}</option>
              {EMPLOYMENT_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{t(g.labelKey)}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400">{t('auth.requestAccountEmploymentHint')}</p>
          </div>

          <div className="space-y-1.5">
            <RequiredLabel>{t('auth.requestAccountDegree')}</RequiredLabel>
            <select value={form.degree} onChange={set('degree')} className={selectClass}>
              <option value="">{t('auth.requestAccountSelectDegree')}</option>
              {DEGREES.map((d) => (
                <option key={d.value} value={d.value}>{t(d.labelKey)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <RequiredLabel>{t('auth.requestAccountQualification')}</RequiredLabel>
            <input type="text" value={form.qualification} onChange={set('qualification')} className={inputClass} />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-2">
            <Link
              to="/login"
              className="h-11 px-6 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
            >
              {t('auth.backToLogin')}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-8 rounded-md bg-[#1a2332] hover:bg-[#243044] text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.requestAccountSubmit')}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
