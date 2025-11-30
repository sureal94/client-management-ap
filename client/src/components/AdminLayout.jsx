import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronLeft,
  ChevronRight,
  History,
  Upload
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Load sidebar state from localStorage, default to true
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('adminSidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });
  
  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminSidebarOpen', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') || 'Dashboard' },
    { path: '/admin/users', icon: Users, label: t('users') || 'Users' },
    { path: '/admin/clients', icon: Users, label: t('clients') || 'Clients' },
    { path: '/admin/products', icon: Package, label: t('products') || 'Products' },
    { path: '/admin/documents', icon: FileText, label: t('documents') || 'Documents' },
    { path: '/admin/import', icon: Upload, label: t('import') || 'Import' },
    { path: '/admin/import-history', icon: History, label: t('importHistory') || 'Import History' },
  ];

  // Only close sidebar on mobile when clicking nav items
  const handleNavClick = () => {
    // Only close on mobile (screen width < 768px)
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0 md:w-16'
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden fixed md:static h-screen z-40`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            {isSidebarOpen ? (
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg whitespace-nowrap">{t('adminPanel') || 'Admin Panel'}</span>
              </div>
            ) : (
              <div className="flex justify-center w-full">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
              title={isSidebarOpen ? (t('collapse') || 'Collapse') : (t('expand') || 'Expand')}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                } ${!isSidebarOpen ? 'justify-center' : ''}`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            {isSidebarOpen && (
              <div className="mb-4">
                <p className="text-sm text-gray-400">{t('loggedInAs') || 'Logged in as'}</p>
                <p className="font-medium truncate">{adminUser.fullName || adminUser.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                !isSidebarOpen ? 'justify-center' : ''
              }`}
              title={!isSidebarOpen ? (t('logout') || 'Logout') : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span>{t('logout') || 'Logout'}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : 'md:ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-lg hover:bg-gray-100"
              title={isSidebarOpen ? (t('collapse') || 'Collapse Sidebar') : (t('expand') || 'Expand Sidebar')}
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm text-gray-600 font-medium">
              {t('adminPanel') || 'Admin Panel'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

