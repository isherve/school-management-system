import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { authApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError(t('auth.enterEmail'));
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError(t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-urblue mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t('auth.backToLogin')}
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.forgotPasswordTitle')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('auth.forgotPasswordHint')}</p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">{t('auth.resetEmailSent')}</p>
          <Link
            to="/login"
            className="w-full h-12 bg-urblue hover:bg-urblue/90 text-white font-semibold rounded-xl shadow-lg shadow-urblue/20 flex items-center justify-center transition-all"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="reset-email" className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {t('common.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demoschool.edu"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-urblue hover:bg-urblue/90 text-white font-semibold rounded-xl shadow-lg shadow-urblue/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.sendResetLink')}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
