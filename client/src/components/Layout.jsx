import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { Package, Users, Upload, Globe, Menu, X } from 'lucide-react';
import logo from '../assets/IMG-20251124-WA0020.jpg';

const Layout = ({ children }) => {
  const { t, language, toggleLanguage } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

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
            </div>

            {/* Hamburger Menu */}
            <div className="relative flex items-center" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {/* Import Option */}
                  <button
                    onClick={() => {
                      navigate('/import');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm hover:bg-gray-100 transition-colors ${
                      isActive('/import') ? 'text-primary bg-orange-50' : 'text-gray-700'
                    }`}
                  >
                    <Upload className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                    {t('import')}
                  </button>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Language Toggle */}
                  <button
                    onClick={() => {
                      toggleLanguage();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Globe className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                    {language === 'en' ? t('hebrew') : t('english')}
                  </button>
                </div>
              )}
            </div>
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
