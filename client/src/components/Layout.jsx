import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { Package, Users, Upload, Globe } from 'lucide-react';
import logo from '../assets/IMG-20251124-WA0020.jpg';

const Layout = ({ children }) => {
  const { t, language, toggleLanguage } = useI18n();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8 rtl:space-x-reverse">
              <Link to="/" className="flex-shrink-0">
                <img src={logo} alt="כנען סנטר" className="h-12 max-w-[180px] object-contain" />
              </Link>
              <Link
                to="/products"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                  isActive('/products') || isActive('/')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <Package className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('products')}
              </Link>
              <Link
                to="/clients"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                  isActive('/clients')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('clients')}
              </Link>
              <Link
                to="/import"
                className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                  isActive('/import')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                <Upload className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('import')}
              </Link>
            </div>
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <Globe className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {language === 'en' ? t('hebrew') : t('english')}
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;



