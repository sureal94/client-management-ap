import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react';

const LoginPage = () => {
  const { t, language, toggleLanguage } = useI18n();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const languages = [
    { code: 'en', name: t('english') || 'English', nativeName: 'English' },
    { code: 'he', name: t('hebrew') || 'Hebrew', nativeName: 'עברית' }
  ];

  const handleLanguageChange = (langCode) => {
    if (langCode !== language) {
      // If switching to a different language, toggle it
      if (language === 'en' && langCode === 'he') {
        toggleLanguage();
      } else if (language === 'he' && langCode === 'en') {
        toggleLanguage();
      }
    }
    setIsLanguageDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError(t('fullNameRequired') || 'Full name is required');
          setLoading(false);
          return;
        }
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || (isSignUp ? t('signupFailed') || 'Sign up failed' : t('loginFailed') || 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 relative">
      {/* Language Switcher Dropdown - Top Right */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[100]">
        <button
          onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-gray-300 hover:border-primary group"
          title={t('switchLanguage') || 'Switch Language'}
          aria-label={t('switchLanguage') || 'Switch Language'}
          aria-expanded={isLanguageDropdownOpen}
        >
          <Globe className="w-5 h-5 text-gray-700 group-hover:text-primary transition-colors" />
          <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
            {language === 'en' ? 'English' : 'עברית'}
          </span>
          <svg
            className={`w-4 h-4 text-gray-700 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isLanguageDropdownOpen && (
          <>
            {/* Backdrop to close dropdown on outside click */}
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setIsLanguageDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-gray-200 py-2 z-[100]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    language === lang.code
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-gray-500">({lang.name})</span>
                  </div>
                  {language === lang.code && (
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {isSignUp ? (t('signUp') || 'Sign Up') : (t('login') || 'Login')}
          </h1>
          <p className="text-gray-600">
            {isSignUp 
              ? (t('createAccount') || 'Create a new account to get started')
              : (t('welcomeBack') || 'Welcome back! Please login to your account')
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fullName') || 'Full Name'}
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('enterFullName') || 'Enter your full name'}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

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
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('password') || 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('enterPassword') || 'Enter your password'}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isSignUp && (
              <p className="mt-1 text-xs text-gray-500">
                {t('passwordMinLength') || 'Password must be at least 6 characters'}
              </p>
            )}
          </div>

          {!isSignUp && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary hover:underline"
              >
                {t('forgotPassword') || 'Forgot Password?'}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isSignUp ? (t('signingUp') || 'Signing Up...') : (t('loggingIn') || 'Logging In...')}
              </>
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {isSignUp ? (t('signUp') || 'Sign Up') : (t('login') || 'Login')}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-sm text-primary hover:underline font-medium"
          >
            {t('adminLogin') || 'Admin Login'}
          </button>
          <p className="text-sm text-gray-600">
            {isSignUp ? (
              <>
                {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {t('login') || 'Login'}
                </button>
              </>
            ) : (
              <>
                {t('dontHaveAccount') || "Don't have an account?"}{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {t('signUp') || 'Sign Up'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


