import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Users, X, Check } from 'lucide-react';
import { getAdminUsers } from '../services/api';

const AssignToUserModal = ({ isOpen, onClose, onAssign, title, itemName }) => {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

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

  const handleAssign = () => {
    if (!selectedUserId) {
      alert(t('pleaseSelectUser') || 'Please select a user');
      return;
    }
    onAssign(selectedUserId);
    onClose();
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {title || (t('assignToUser') || 'Assign to User')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {itemName && (
          <p className="text-sm text-gray-600 mb-4">
            {t('assigning') || 'Assigning'}: <span className="font-medium">{itemName}</span>
          </p>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('searchUsers') || 'Search users...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">{t('loading') || 'Loading...'}</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto mb-4">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {t('noUsers') || 'No users found'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedUserId === user.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.fullName || user.email}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {selectedUserId === user.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleAssign}
            disabled={!selectedUserId || loading}
            className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {t('assign') || 'Assign'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {t('cancel') || 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignToUserModal;




