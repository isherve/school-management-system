import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { authApi } from '@/services/endpoints';
import { useTranslation } from '@/i18n';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError(t('auth.resetTokenMissing'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch {
      setError(t('auth.resetInvalidToken'));
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.resetPasswordTitle')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('auth.resetPasswordHint')}</p>
      </div>

      {done ? (
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('auth.resetSuccess')}</p>
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
            <label htmlFor="new-password" className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label="Toggle password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-urblue hover:bg-urblue/90 text-white font-semibold rounded-xl shadow-lg shadow-urblue/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.resetPasswordBtn')}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
