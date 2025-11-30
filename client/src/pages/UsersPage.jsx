import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Users, Search, Mail, Phone, Calendar, Clock, User as UserIcon } from 'lucide-react';
import { getAllUsers } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const UsersPage = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers(token);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users by search term (case-insensitive)
  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.phone && user.phone.includes(searchTerm))
    );
  });

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" />
          {t('users') || 'Users'}
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            placeholder={t('searchUsers') || 'Search users by name, email, or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent rtl:pr-10 rtl:pl-4 text-base"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {searchTerm
                ? (t('noUsersFound') || 'No users found matching your search.')
                : (t('noUsers') || 'No users registered yet.')}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4">{t('user') || 'User'}</th>
                    <th className="text-left p-4">{t('email') || 'Email'}</th>
                    <th className="text-left p-4">{t('phone') || 'Phone'}</th>
                    <th className="text-left p-4">{t('accountCreated') || 'Account Created'}</th>
                    <th className="text-left p-4">{t('lastLogin') || 'Last Login'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture.startsWith('/api') ? user.profilePicture : `/api${user.profilePicture}`}
                              alt={user.fullName || 'User'}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white ${user.profilePicture ? 'hidden' : 'flex'}`}
                          >
                            <UserIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.fullName || t('noName') || 'No Name'}
                            </p>
                            <p className="text-sm text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{user.email || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {user.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {user.createdAt ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                              {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {user.lastLogin ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                              {format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">{t('never') || 'Never'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture.startsWith('/api') ? user.profilePicture : `/api${user.profilePicture}`}
                        alt={user.fullName || 'User'}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0 ${user.profilePicture ? 'hidden' : 'flex'}`}
                    >
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.fullName || t('noName') || 'No Name'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {user.id}</p>
                      {user.email && (
                        <div className="flex items-center gap-2 mt-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{user.phone}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        {user.createdAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(user.createdAt), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                        {user.lastLogin && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(user.lastLogin), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        {t('totalUsers') || 'Total Users'}: <span className="font-semibold">{users.length}</span>
        {searchTerm && (
          <>
            {' '}
            ({t('showing') || 'Showing'} {filteredUsers.length} {t('matching') || 'matching'})
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;



