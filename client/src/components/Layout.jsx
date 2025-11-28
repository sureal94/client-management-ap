import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { Package, Users, Upload, Globe, Menu, X, Bell, Calendar, Clock, FileText, User } from 'lucide-react';
import { fetchClients } from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/IMG-20251124-WA0020.jpg';

const Layout = ({ children }) => {
  const { t, language, toggleLanguage } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Fetch reminders from all clients
  useEffect(() => {
    const loadReminders = async () => {
      try {
        const clients = await fetchClients();
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Collect all reminders from all clients that are within 24 hours or overdue
        const allReminders = [];
        clients.forEach(client => {
          if (client.reminders && client.reminders.length > 0) {
            client.reminders.forEach(reminder => {
              const reminderDate = new Date(reminder.date);
              // Include reminders that are overdue or within the next 7 days
              const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              if (reminderDate <= in7Days) {
                allReminders.push({
                  ...reminder,
                  clientId: client.id,
                  clientName: client.name || reminder.clientName,
                  isUrgent: reminderDate <= in24Hours // Within 24 hours or overdue
                });
              }
            });
          }
        });

        // Sort by date (earliest first)
        allReminders.sort((a, b) => new Date(a.date) - new Date(b.date));
        setUpcomingReminders(allReminders);
      } catch (err) {
        console.error('Failed to load reminders:', err);
      }
    };

    loadReminders();
    // Refresh every minute
    const interval = setInterval(loadReminders, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]); // Refresh when navigating

  // Check if there are urgent reminders (within 24 hours)
  const hasUrgentReminders = upcomingReminders.some(r => r.isUrgent);

  // Format reminder time
  const formatReminderTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return t('overdue') || 'Overdue';
    if (diffDays === 0) return t('today') || 'Today';
    if (diffDays === 1) return t('tomorrow') || 'Tomorrow';
    if (diffDays < 7) return `${diffDays} ${t('daysAgo') || 'days'}`;
    return format(date, 'dd/MM/yyyy');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is inside menu
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return; // Don't close if clicking inside menu
      }

      // Close menu if clicking outside
      if (menuRef.current) {
        setIsMenuOpen(false);
      }

      // Close notification if clicking outside
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    // Use mousedown instead of click to avoid interfering with button clicks
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Navigation items
  const navItems = [
    { path: '/products', icon: Package, label: t('products'), isActive: isActive('/products') || isActive('/') },
    { path: '/clients', icon: Users, label: t('clients'), isActive: isActive('/clients') },
    { path: '/documents', icon: FileText, label: t('documents'), isActive: isActive('/documents') },
    { path: '/import', icon: Upload, label: t('import'), isActive: isActive('/import') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <nav className="bg-black text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex justify-between h-16">
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <Link to="/" className="flex-shrink-0">
                <img src={logo} alt="כנען סנטר" className="h-12 max-w-[180px] object-contain" />
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${item.isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                    }`}
                >
                  <item.icon className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Profile Icon */}
              {user && (
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors"
                  title={t('profile') || 'Profile'}
                >
                  <User className="w-6 h-6" />
                </Link>
              )}

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  {hasUrgentReminders && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        {t('upcomingReminders') || 'Upcoming Reminders'}
                      </h3>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {upcomingReminders.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {t('noReminders') || 'No upcoming reminders'}
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {upcomingReminders.map((reminder) => (
                            <button
                              key={reminder.id}
                              onClick={() => {
                                navigate(`/clients`);
                                setIsNotificationOpen(false);
                              }}
                              className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${reminder.isUrgent ? 'bg-red-50' : ''
                                }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 truncate">
                                    {reminder.clientName}
                                  </p>
                                  {reminder.note && (
                                    <p className="text-sm text-gray-600 truncate mt-0.5">
                                      {reminder.note}
                                    </p>
                                  )}
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${reminder.isUrgent
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                                  }`}>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatReminderTime(reminder.date)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(reminder.date), 'dd/MM/yyyy')}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hamburger Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors cursor-pointer"
                  aria-label="Menu"
                  type="button"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Import Option */}
                    <Link
                      to="/import"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Let Link handle navigation naturally
                        // Close menu after navigation starts
                        setTimeout(() => {
                          setIsMenuOpen(false);
                        }, 150);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-sm hover:bg-gray-100 transition-colors cursor-pointer ${isActive('/import') ? 'text-primary bg-orange-50' : 'text-gray-700'
                        }`}
                    >
                      <Upload className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                      {t('import')}
                    </Link>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Language Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Use requestAnimationFrame to ensure this runs before any other handlers
                        requestAnimationFrame(() => {
                          toggleLanguage();
                        });
                        setTimeout(() => setIsMenuOpen(false), 200);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Globe className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                      {language === 'en' ? t('hebrew') : t('english')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            {/* Top row: Logo, Bell, Menu */}
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="flex-shrink-0">
                <img src={logo} alt="כנען סנטר" className="h-10 max-w-[120px] object-contain" />
              </Link>

              <div className="flex items-center gap-1">
                {/* Profile Icon */}
                {user && (
                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors"
                    title={t('profile') || 'Profile'}
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}

                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {hasUrgentReminders && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
                    )}
                  </button>

                  {/* Mobile Notification Dropdown */}
                  {isNotificationOpen && (
                    <div className="fixed inset-x-2 top-28 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-hidden">
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                          <Bell className="w-4 h-4 text-blue-600" />
                          {t('upcomingReminders') || 'Upcoming Reminders'}
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {upcomingReminders.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            {t('noReminders') || 'No upcoming reminders'}
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {upcomingReminders.map((reminder) => (
                              <button
                                key={reminder.id}
                                onClick={() => {
                                  navigate(`/clients`);
                                  setIsNotificationOpen(false);
                                }}
                                className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${reminder.isUrgent ? 'bg-red-50' : ''
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate text-sm">
                                      {reminder.clientName}
                                    </p>
                                    {reminder.note && (
                                      <p className="text-xs text-gray-600 truncate mt-0.5">
                                        {reminder.note}
                                      </p>
                                    )}
                                  </div>
                                  <div className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${reminder.isUrgent
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatReminderTime(reminder.date)}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu Button */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
                    }}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none transition-colors cursor-pointer"
                    aria-label="Menu"
                    type="button"
                  >
                    {isMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>

                  {/* Mobile Menu Dropdown */}
                  {isMenuOpen && (
                    <div
                      className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Import Option */}
                      <Link
                        to="/import"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Let Link handle navigation naturally
                          // Close menu after navigation starts
                          setTimeout(() => {
                            setIsMenuOpen(false);
                          }, 150);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-sm hover:bg-gray-100 transition-colors cursor-pointer ${isActive('/import') ? 'text-primary bg-orange-50' : 'text-gray-700'
                          }`}
                      >
                        <Upload className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                        {t('import')}
                      </Link>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Language Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Call toggleLanguage immediately
                          toggleLanguage();
                          // Close menu after language change
                          setTimeout(() => {
                            setIsMenuOpen(false);
                          }, 200);
                        }}
                        onMouseDown={(e) => {
                          // Prevent mousedown from triggering click outside handler
                          e.stopPropagation();
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <Globe className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                        {language === 'en' ? t('hebrew') : t('english')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom row: Navigation Icons */}
            <div className="flex items-center justify-around py-2 border-t border-gray-800">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] ${item.isActive
                    ? 'text-primary bg-gray-800'
                    : 'text-gray-400 hover:text-white active:bg-gray-800'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5 font-medium truncate max-w-full">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 px-3 sm:py-6 sm:px-4 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
