import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Users, Package, FileText, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { getAdminDashboard } from '../services/api';
import { format } from 'date-fns';

const AdminDashboardPage = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentLogins, setRecentLogins] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const data = await getAdminDashboard(token);
      setStats(data.stats);
      setRecentLogins(data.recentLogins || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('totalUsers') || 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: t('totalClients') || 'Total Clients',
      value: stats?.totalClients || 0,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: t('totalProducts') || 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: t('totalDocuments') || 'Total Documents',
      value: stats?.totalDocuments || 0,
      icon: FileText,
      color: 'bg-orange-500',
    },
    {
      title: t('activeUsers') || 'Active Users (7 days)',
      value: stats?.activeUsers || 0,
      icon: UserCheck,
      color: 'bg-teal-500',
    },
    {
      title: t('usersWithClients') || 'Users with Clients',
      value: stats?.usersWithClients || 0,
      icon: TrendingUp,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('dashboard') || 'Dashboard'}</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Logins */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          {t('recentLogins') || 'Recent Logins'}
        </h2>
        {recentLogins.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t('noRecentLogins') || 'No recent logins'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">{t('user') || 'User'}</th>
                  <th className="text-left p-3">{t('email') || 'Email'}</th>
                  <th className="text-left p-3">{t('lastLogin') || 'Last Login'}</th>
                </tr>
              </thead>
              <tbody>
                {recentLogins.map((login) => (
                  <tr key={login.userId} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{login.fullName || t('noName') || 'No Name'}</td>
                    <td className="p-3 text-gray-600">{login.email}</td>
                    <td className="p-3 text-gray-600">
                      {login.lastActive 
                        ? format(new Date(login.lastActive), 'dd/MM/yyyy HH:mm')
                        : (login.lastLogin ? format(new Date(login.lastLogin), 'dd/MM/yyyy HH:mm') : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

