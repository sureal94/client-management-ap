import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { Mail, Phone, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '../services/api';

const ForgotPasswordPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const [step, setStep] = useState(resetToken ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email && !phone) {
      setError(t('emailOrPhoneRequired') || 'Email or phone number is required');
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(email || null, phone || null);
      setSuccess(t('resetLinkSent') || 'Password reset link has been sent');
      if (response.resetLink) {
        setResetLink(response.resetLink);
      }
    } catch (err) {
      setError(err.message || t('resetRequestFailed') || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError(t('allFieldsRequired') || 'All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setSuccess(t('passwordResetSuccess') || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || t('passwordResetFailed') || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'reset') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <button
            onClick={() => navigate('/login')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('backToLogin') || 'Back to Login'}
          </button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              {t('resetPassword') || 'Reset Password'}
            </h1>
            <p className="text-gray-600">
              {t('enterNewPassword') || 'Enter your new password'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('newPassword') || 'New Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('enterNewPassword') || 'Enter new password'}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('confirmPassword') || 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('confirmNewPassword') || 'Confirm new password'}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (t('resetting') || 'Resetting...') : (t('resetPassword') || 'Reset Password')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <button
          onClick={() => navigate('/login')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('backToLogin') || 'Back to Login'}
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {t('forgotPassword') || 'Forgot Password'}
          </h1>
          <p className="text-gray-600">
            {t('forgotPasswordDescription') || 'Enter your email or phone number to receive a password reset link'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
            {resetLink && (
              <div className="mt-2 p-2 bg-white rounded border">
                <p className="text-xs text-gray-600 mb-1">Reset Link (for testing):</p>
                <a href={resetLink} className="text-xs text-primary break-all">{resetLink}</a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleRequestReset} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setUsePhone(false);
                setPhone('');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                !usePhone
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-5 h-5 mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => {
                setUsePhone(true);
                setEmail('');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                usePhone
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Phone className="w-5 h-5 mx-auto" />
            </button>
          </div>

          {!usePhone ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email') || 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('enterEmail') || 'Enter your email'}
                  required={!usePhone}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone') || 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('enterPhone') || 'Enter your phone number'}
                  required={usePhone}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (t('sending') || 'Sending...') : (t('sendResetLink') || 'Send Reset Link')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;


