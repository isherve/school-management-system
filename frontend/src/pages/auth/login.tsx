import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, KeyRound, Eye, EyeOff, Loader2, AlertCircle,
  ArrowRight, UserPlus, RefreshCw,
} from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuthStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

type LoginTab = 'password' | 'email-code';
type CodeStep = 'enter-email' | 'verify-code';
type PasswordStep = 'credentials' | 'verify-code';

import { getHomePath } from '@/lib/access';

function navigateAfterLogin(navigate: ReturnType<typeof useNavigate>, role?: string) {
  navigate(getHomePath(role));
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, preparePasswordLogin, loginWithCode, requestLoginCode, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const [tab, setTab] = useState<LoginTab>('password');
  const [passwordStep, setPasswordStep] = useState<PasswordStep>('credentials');
  const [codeStep, setCodeStep] = useState<CodeStep>('enter-email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [codeSending, setCodeSending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  const apiError = (err: unknown, fallback: string) => {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message || (err instanceof Error ? err.message : fallback);
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const switchTab = (next: LoginTab) => {
    setTab(next);
    setError('');
    setPasswordStep('credentials');
    setCodeStep('enter-email');
    setCode('');
    setDevCode(null);
  };

  const sendPasswordVerificationCode = useCallback(async () => {
    if (!email || !password) {
      setError(t('auth.missingCredentials'));
      return;
    }
    setError('');
    setCodeSending(true);
    try {
      const result = await preparePasswordLogin(email, password);
      setPasswordStep('verify-code');
      setResendSeconds(60);
      setCode('');
      setDevCode(result.devCode || null);
      if (result.emailFailed) {
        setError(t('auth.emailDeliveryFailed'));
      }
    } catch (err: unknown) {
      setError(apiError(err, t('auth.invalidCredentials')));
    } finally {
      setCodeSending(false);
    }
  }, [email, password, preparePasswordLogin, t]);

  const handlePasswordCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendPasswordVerificationCode();
  };

  const verifyPasswordLogin = useCallback(async (codeValue: string) => {
    if (codeValue.length !== 6) return;
    setError('');
    try {
      await login(email, password, codeValue, true);
      navigateAfterLogin(navigate, useAuthStore.getState().user?.role);
    } catch (err: unknown) {
      setError(apiError(err, t('auth.invalidCode')));
    }
  }, [email, password, login, navigate, t]);

  const handlePasswordCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      setTimeout(() => verifyPasswordLogin(digits), 200);
    }
  };

  const sendCode = useCallback(async () => {
    if (!email) {
      setError(t('auth.enterEmail'));
      return;
    }
    setError('');
    setCodeSending(true);
    try {
      const result = await requestLoginCode(email);
      if (result.hint === 'no_account') {
        setError(t('auth.emailNotRegistered'));
        return;
      }
      setCodeStep('verify-code');
      setResendSeconds(60);
      setCode('');
      setDevCode(result.devCode || null);
      if (result.emailFailed) {
        setError(t('auth.emailDeliveryFailed'));
      }
    } catch (err: unknown) {
      setError(apiError(err, t('auth.codeSendFailed')));
    } finally {
      setCodeSending(false);
    }
  }, [email, requestLoginCode, t]);

  const verifyCode = useCallback(async (codeValue: string) => {
    if (codeValue.length !== 6) return;
    setError('');
    try {
      await loginWithCode(email, codeValue);
      navigateAfterLogin(navigate, useAuthStore.getState().user?.role);
    } catch (err: unknown) {
      setError(apiError(err, t('auth.invalidCode')));
    }
  }, [email, loginWithCode, navigate, t]);

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      setTimeout(() => verifyCode(digits), 200);
    }
  };

  return (
    <AuthLayout
      footer={
        <div className="mt-6 lg:mt-8 space-y-4 text-center">
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/request-account"
              className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-urblue/30 hover:bg-urblue/5 group flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="h-4 w-4 text-gray-500 group-hover:text-urblue transition-colors" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-urblue">
                {t('auth.requestAccount')}
              </span>
            </Link>
            <Link
              to="/admin/portals/library"
              className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-urblue/30 hover:bg-urblue/5 group flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="h-4 w-4 text-gray-500 group-hover:text-urblue transition-colors" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-urblue">
                {t('auth.staffPortal')}
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-urblue transition-all" />
            </Link>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('auth.needHelp')}{' '}
            <a href="tel:+250788123456" className="font-semibold hover:text-urblue transition-colors">
              +250 788 123 456
            </a>
          </p>
          <p className="text-[10px] text-gray-400">{t('auth.demoHint')}</p>
        </div>
      }
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.welcome')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('auth.signIn')}</p>
      </div>

      {/* Tab switcher — Inuma sliding pill */}
      <div className="relative flex p-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-gray-700 shadow-sm transition-all duration-300 ease-out"
          style={{ width: 'calc(50% - 4px)', left: tab === 'password' ? '4px' : 'calc(50% + 0px)' }}
        />
        <button
          type="button"
          onClick={() => switchTab('password')}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors',
            tab === 'password' ? 'text-urblue' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          )}
        >
          <Lock className="h-4 w-4" />
          {t('auth.passwordTab')}
        </button>
        <button
          type="button"
          onClick={() => switchTab('email-code')}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors',
            tab === 'email-code' ? 'text-urblue' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          )}
        >
          <Mail className="h-4 w-4" />
          {t('auth.emailCodeTab')}
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {tab === 'password' && passwordStep === 'credentials' && (
        <form onSubmit={handlePasswordCredentials} className="space-y-5" noValidate>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <Lock className="h-5 w-5 text-urblue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('auth.passwordTwoStepTitle')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('auth.passwordTwoStepHint')}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {t('common.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demoschool.edu"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none transition-all"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {t('common.password')}
              </label>
              <Link to="/forgot-password" className="text-xs text-urblue hover:text-urblue/80 font-medium transition-colors">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={codeSending || !email || !password}
            className="w-full h-12 bg-urblue hover:bg-urblue/90 text-white font-semibold rounded-xl shadow-lg shadow-urblue/20 hover:shadow-urblue/30 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {codeSending ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.continueWithCode')}
          </button>
        </form>
      )}

      {tab === 'password' && passwordStep === 'verify-code' && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('auth.passwordVerifyTitle')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('auth.codeSentTo')}{' '}
              <span className="font-medium text-urblue">{email}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{t('auth.otpExpires')}</p>
          </div>

          {devCode && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">{t('auth.devCodeHint')}</p>
              <p className="text-3xl font-bold tracking-[0.4em] text-amber-900 dark:text-amber-100">{devCode}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center block">
              {t('auth.enterCode')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => handlePasswordCodeChange(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full h-14 text-center text-2xl font-bold tracking-[0.5em] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => { setPasswordStep('credentials'); setCode(''); setError(''); setDevCode(null); }}
              className="text-gray-500 hover:text-urblue transition-colors"
            >
              {t('auth.backToPassword')}
            </button>
            <button
              type="button"
              onClick={sendPasswordVerificationCode}
              disabled={resendSeconds > 0 || codeSending}
              className={cn(
                'flex items-center gap-1 font-medium transition-colors',
                resendSeconds > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-urblue hover:text-urblue/80'
              )}
            >
              <RefreshCw className="h-3 w-3" />
              {resendSeconds > 0 ? t('auth.resendIn', { seconds: resendSeconds }) : t('auth.resendCode')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => verifyPasswordLogin(code)}
            disabled={isLoading || code.length !== 6}
            className="w-full h-12 bg-urblue hover:bg-urblue/90 text-white font-semibold rounded-xl shadow-lg shadow-urblue/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.signInBtn')}
          </button>
        </div>
      )}

      {tab === 'email-code' && codeStep === 'enter-email' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <Mail className="h-5 w-5 text-urblue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('auth.passwordlessTitle')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('auth.passwordlessHint')}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="code-email" className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {t('common.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="code-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demoschool.edu"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={sendCode}
            disabled={codeSending || !email}
            className="w-full h-12 bg-urblue hover:bg-urblue/90 text-white font-semibold rounded-xl shadow-lg shadow-urblue/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {codeSending ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.sendCode')}
          </button>
        </div>
      )}

      {tab === 'email-code' && codeStep === 'verify-code' && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('auth.checkInbox')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('auth.codeSentTo')}{' '}
              <span className="font-medium text-urblue">{email}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{t('auth.otpExpires')}</p>
          </div>

          {devCode && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">{t('auth.devCodeHint')}</p>
              <p className="text-3xl font-bold tracking-[0.4em] text-amber-900 dark:text-amber-100">{devCode}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center block">
              {t('auth.enterCode')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full h-14 text-center text-2xl font-bold tracking-[0.5em] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-urblue focus:ring-2 focus:ring-urblue/20 outline-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => { setCodeStep('enter-email'); setCode(''); setError(''); setDevCode(null); }}
              className="text-gray-500 hover:text-urblue transition-colors"
            >
              {t('auth.changeEmail')}
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={resendSeconds > 0 || codeSending}
              className={cn(
                'flex items-center gap-1 font-medium transition-colors',
                resendSeconds > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-urblue hover:text-urblue/80'
              )}
            >
              <RefreshCw className="h-3 w-3" />
              {resendSeconds > 0 ? t('auth.resendIn', { seconds: resendSeconds }) : t('auth.resendCode')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => verifyCode(code)}
            disabled={isLoading || code.length !== 6}
            className="w-full h-12 bg-urblue hover:bg-urblue/90 text-white font-semibold rounded-xl shadow-lg shadow-urblue/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.verifyCode')}
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
