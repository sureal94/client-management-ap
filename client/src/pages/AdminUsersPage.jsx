import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Lock,
  Mail,
  UserCheck,
  UserX,
  X,
  Check,
  UserPlus
} from 'lucide-react';
import {
  getAdminUsers,
  resetUserPassword,
  adminUpdateUserEmail,
  toggleUserStatus,
  deleteUser
} from '../services/api';
import { format } from 'date-fns';

const AdminUsersPage = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [action, setAction] = useState(null); // 'resetPassword', 'changeEmail', 'delete', 'toggleStatus'
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const usersData = await getAdminUsers(token);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (user, actionType) => {
    setSelectedUser(user);
    setAction(actionType);
    setFormData({});
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setAction(null);
    setFormData({});
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');

      switch (action) {
        case 'resetPassword':
          if (!formData.newPassword || formData.newPassword.length < 6) {
            setError(t('passwordMinLength') || 'Password must be at least 6 characters');
            return;
          }
          await resetUserPassword(token, selectedUser.id, formData.newPassword);
          setSuccess(t('passwordResetSuccess') || 'Password reset successfully');
          setTimeout(() => {
            handleCloseModal();
            loadUsers();
          }, 1500);
          break;

        case 'changeEmail':
          if (!formData.email) {
            setError(t('emailRequired') || 'Email is required');
            return;
          }
          await adminUpdateUserEmail(token, selectedUser.id, formData.email);
          setSuccess(t('emailUpdatedSuccess') || 'Email updated successfully');
          setTimeout(() => {
            handleCloseModal();
            loadUsers();
          }, 1500);
          break;

        case 'toggleStatus':
          await toggleUserStatus(token, selectedUser.id, !selectedUser.isActive);
          setSuccess(
            selectedUser.isActive
              ? (t('userDeactivated') || 'User deactivated successfully')
              : (t('userActivated') || 'User activated successfully')
          );
          setTimeout(() => {
            handleCloseModal();
            loadUsers();
          }, 1500);
          break;

        case 'delete':
          if (formData.confirm !== 'DELETE') {
            setError(t('confirmDeleteRequired') || 'Please type DELETE to confirm');
            return;
          }
          await deleteUser(token, selectedUser.id);
          setSuccess(t('userDeletedSuccess') || 'User deleted successfully');
          setTimeout(() => {
            handleCloseModal();
            loadUsers();
          }, 1500);
          break;

        default:
          break;
      }
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-8 h-8 text-primary" />
          {t('usersManagement') || 'Users Management'}
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('searchUsers') || 'Search users...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              {searchTerm
                ? (t('noUsersFound') || 'No users found')
                : (t('noUsers') || 'No users registered')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4">{t('user') || 'User'}</th>
                  <th className="text-left p-4">{t('email') || 'Email'}</th>
                  <th className="text-left p-4">{t('phone') || 'Phone'}</th>
                  <th className="text-left p-4">{t('clients') || 'Clients'}</th>
                  <th className="text-left p-4">{t('products') || 'Products'}</th>
                  <th className="text-left p-4">{t('status') || 'Status'}</th>
                  <th className="text-left p-4">{t('actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{user.fullName || t('noName') || 'No Name'}</p>
                        <p className="text-sm text-gray-500">
                          {t('created') || 'Created'}: {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : '-'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">{user.email || '-'}</td>
                    <td className="p-4">{user.phone || '-'}</td>
                    <td className="p-4">{user.clientCount || 0}</td>
                    <td className="p-4">{user.productCount || 0}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isOnline === true
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.isOnline === true
                          ? (t('online') || 'Online')
                          : (t('offline') || 'Offline')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(user, 'resetPassword')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title={t('resetPassword') || 'Reset Password'}
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(user, 'changeEmail')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title={t('changeEmail') || 'Change Email'}
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(user, 'toggleStatus')}
                          className={`p-2 rounded ${
                            user.isActive !== false
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive !== false ? (t('deactivate') || 'Deactivate') : (t('activate') || 'Activate')}
                        >
                          {user.isActive !== false ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleAction(user, 'delete')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title={t('delete') || 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {selectedUser && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {action === 'resetPassword' && (t('resetPassword') || 'Reset Password')}
                {action === 'changeEmail' && (t('changeEmail') || 'Change Email')}
                {action === 'toggleStatus' &&
                  (selectedUser.isActive !== false
                    ? (t('deactivateUser') || 'Deactivate User')
                    : (t('activateUser') || 'Activate User'))}
                {action === 'delete' && (t('deleteUser') || 'Delete User')}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {t('user') || 'User'}: <span className="font-medium">{selectedUser.fullName || selectedUser.email}</span>
                </p>
              </div>

              {action === 'resetPassword' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('newPassword') || 'New Password'}
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword || ''}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('enterNewPassword') || 'Enter new password'}
                    required
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t('passwordMinLength') || 'Password must be at least 6 characters'}
                  </p>
                </div>
              )}

              {action === 'changeEmail' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('newEmail') || 'New Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('enterNewEmail') || 'Enter new email'}
                    required
                  />
                </div>
              )}

              {action === 'delete' && (
                <div className="mb-4">
                  <p className="text-sm text-red-600 mb-2">
                    {t('deleteUserWarning') || 'This action cannot be undone. All user data will be permanently deleted.'}
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('typeDeleteToConfirm') || 'Type DELETE to confirm'}
                  </label>
                  <input
                    type="text"
                    value={formData.confirm || ''}
                    onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="DELETE"
                    required
                  />
                </div>
              )}

              {action === 'toggleStatus' && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {selectedUser.isActive !== false
                      ? (t('deactivateUserConfirm') || 'Are you sure you want to deactivate this user?')
                      : (t('activateUserConfirm') || 'Are you sure you want to activate this user?')}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t('confirm') || 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {t('cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;

