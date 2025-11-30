import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { Package, Users, Upload, Globe, Menu, X, Bell, Calendar, Clock, FileText, User } from 'lucide-react';
import { fetchClients, fetchProducts, fetchAllDocuments, fetchPersonalDocuments } from '../services/api';
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
  const [productCount, setProductCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Helper to determine if a reminder is urgent (within 24 hours or overdue)
  const isUrgentReminder = (reminderDate) => {
    if (!reminderDate) return false;
    
    const now = new Date();
    let reminder;
    
    // Parse date string as local date (avoid timezone issues)
    if (typeof reminderDate === 'string') {
      // If it's a date-only string (YYYY-MM-DD), parse as local date
      if (reminderDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = reminderDate.split('-').map(Number);
        reminder = new Date(year, month - 1, day);
      } else {
        reminder = new Date(reminderDate);
      }
    } else {
      reminder = new Date(reminderDate);
    }
    
    // Set to start of day for accurate comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reminderDateOnly = new Date(reminder.getFullYear(), reminder.getMonth(), reminder.getDate());
    const in24Hours = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Urgent if overdue, today, or tomorrow (within 24 hours)
    return reminderDateOnly <= in24Hours || reminderDateOnly < today;
  };

  // Fetch reminders from clients
  const fetchReminders = async () => {
    try {
      const [clients, products, allDocs, personalDocs] = await Promise.all([
        fetchClients().catch(() => []),
        fetchProducts().catch(() => []),
        fetchAllDocuments().catch(() => []),
        fetchPersonalDocuments().catch(() => [])
      ]);

      // Set product count
      setProductCount(products.length || 0);

      // Set document count (personal + client documents)
      const clientDocIds = new Set();
      clients.forEach(client => {
        if (client.id) clientDocIds.add(client.id);
      });
      const clientDocs = allDocs.filter(d => d.clientId && clientDocIds.has(d.clientId));
      setDocumentCount((personalDocs.length || 0) + (clientDocs.length || 0));

      // Get current user ID (check both regular token and admin token)
      const isAdminMode = window.location.pathname.startsWith('/admin');
      const adminToken = localStorage.getItem('adminToken');
      const isAdmin = isAdminMode && adminToken;
      const currentUserId = isAdmin ? null : (user?.id || null);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const allReminders = [];
      
      clients.forEach(client => {
        if (client.reminders && client.reminders.length > 0) {
          client.reminders.forEach(reminder => {
            // Filter by userId: show reminders for current user, or all if admin
            const reminderUserId = reminder.userId || client.userId;
            
            if (!isAdmin && reminderUserId !== currentUserId) {
              return; // Skip reminders not belonging to current user
            }
            
            // Parse reminder date
            let reminderDate;
            if (reminder.date && typeof reminder.date === 'string') {
              if (reminder.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = reminder.date.split('-').map(Number);
                reminderDate = new Date(year, month - 1, day);
              } else {
                reminderDate = new Date(reminder.date);
              }
            } else {
              reminderDate = new Date(reminder.date);
            }
            
            const reminderDateOnly = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
            
            // Show reminders within 30 days or overdue
            if (reminderDateOnly <= in30Days || reminderDateOnly < today) {
              allReminders.push({
                ...reminder,
                clientId: client.id,
                clientName: client.name || reminder.clientName,
                isUrgent: isUrgentReminder(reminder.date)
              });
            }
          });
        }
      });

      // Sort by date (earliest first)
      allReminders.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const parsedA = a.date.match(/^\d{4}-\d{2}-\d{2}$/) 
          ? new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate())
          : dateA;
        const parsedB = b.date.match(/^\d{4}-\d{2}-\d{2}$/)
          ? new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate())
          : dateB;
        return parsedA - parsedB;
      });
      
      setUpcomingReminders(allReminders);
      console.log('[Reminders] Fetched:', allReminders.length, 'reminders');
    } catch (err) {
      console.error('[Reminders] Fetch failed:', err);
    }
  };

  // Fetch reminders and counts
  useEffect(() => {
    // Initial fetch
    fetchReminders();
    
    // Refresh every minute
    const interval = setInterval(fetchReminders, 60000);
    
    // Listen for clientSaved or clientUpdated events
    const handleClientSaved = () => {
      console.log('[Reminders] clientSaved/clientUpdated event received, refreshing reminders...');
      fetchReminders();
    };
    
    window.addEventListener('clientSaved', handleClientSaved);
    window.addEventListener('clientUpdated', handleClientSaved);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('clientSaved', handleClientSaved);
      window.removeEventListener('clientUpdated', handleClientSaved);
    };
  }, [location.pathname, user?.id]); // Refresh when navigating or user changes

  // Count urgent reminders for red dot
  const urgentCount = upcomingReminders.filter(r => r.isUrgent).length;
  const hasUrgentReminders = urgentCount > 0;

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

  // Navigation items with counts
  const navItems = [
    { 
      path: '/products', 
      icon: Package, 
      label: t('products'), 
      count: productCount,
      isActive: isActive('/products') || isActive('/') 
    },
    { 
      path: '/clients', 
      icon: Users, 
      label: t('clients'), 
      isActive: isActive('/clients') 
    },
    { 
      path: '/documents', 
      icon: FileText, 
      label: t('documents'), 
      count: documentCount,
      isActive: isActive('/documents') 
    },
    { 
      path: '/import', 
      icon: Upload, 
      label: t('import'), 
      isActive: isActive('/import') 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden transition-colors duration-200">
      <nav className="bg-black dark:bg-gray-950 text-white shadow-lg sticky top-0 z-40 transition-colors duration-200">
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
                    onMouseDown={(e) => e.stopPropagation()}
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
                      onMouseDown={(e) => {
                        // Prevent mousedown from triggering click outside handler
                        e.stopPropagation();
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
                        e.preventDefault();
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
                  title={item.label}
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
