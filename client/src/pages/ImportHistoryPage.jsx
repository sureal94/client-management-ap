import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import {
  History,
  Search,
  Eye,
  Trash2,
  Download,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Package,
  Users,
  Filter
} from 'lucide-react';
import {
  getImportHistory,
  deleteImportLog,
  clearImportHistory
} from '../services/api';
import { format } from 'date-fns';

const ImportHistoryPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'type', 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [filterType, setFilterType] = useState('all'); // 'all', 'clients', 'products', 'documents'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'success', 'error', 'partial'
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getImportHistory();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load import history:', err);
      setError('Failed to load import history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this import log?')) return;
    
    try {
      await deleteImportLog(id);
      setHistory(history.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete import log:', err);
      alert('Failed to delete import log');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearImportHistory();
      setHistory([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear import history:', err);
      alert('Failed to clear import history');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'partial':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'clients':
        return <Users className="w-4 h-4" />;
      case 'products':
        return <Package className="w-4 h-4" />;
      case 'documents':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Filter and sort history
  const filteredAndSorted = history
    .filter(item => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          item.importedBy?.toLowerCase().includes(searchLower) ||
          item.fileName?.toLowerCase().includes(searchLower) ||
          item.type?.toLowerCase().includes(searchLower) ||
          item.id?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (filterType !== 'all' && item.type !== filterType) return false;
      
      // Status filter
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      
      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case 'type':
          aVal = a.type || '';
          bVal = b.type || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading import history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-7 h-7 text-primary" />
          {t('importHistory') || 'Import History'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t('clearAll') || 'Clear All'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('search') || 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('type') || 'Type'}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">{t('allTypes') || 'All Types'}</option>
              <option value="clients">{t('clients') || 'Clients'}</option>
              <option value="products">{t('products') || 'Products'}</option>
              <option value="documents">{t('documents') || 'Documents'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('status') || 'Status'}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">{t('allStatuses') || 'All Statuses'}</option>
              <option value="success">{t('success') || 'Success'}</option>
              <option value="error">{t('error') || 'Error'}</option>
              <option value="partial">{t('partial') || 'Partial'}</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('sortBy') || 'Sort By'}
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="date">{t('date') || 'Date'}</option>
                <option value="type">{t('type') || 'Type'}</option>
                <option value="status">{t('status') || 'Status'}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      {filteredAndSorted.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg font-medium mb-2">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? (t('noMatchingImports') || 'No matching imports found')
              : (t('noImportHistory') || 'No import history yet')}
          </p>
          {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
            <p className="text-gray-500 text-sm">
              {t('importHistoryDescription') || 'Import history will appear here after you import files.'}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('importId') || 'Import ID'}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('dateTime') || 'Date & Time'}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('importedBy') || 'Imported By'}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('type') || 'Type'}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('itemsImported') || 'Items'}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('assignedUser') || 'Assigned User'}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('status') || 'Status'}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {item.id?.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.createdAt ? (() => {
                      try {
                        return format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm');
                      } catch (e) {
                        return item.createdAt;
                      }
                    })() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {item.importedBy || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="capitalize">{item.type || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.successfulCount || 0} / {item.totalRows || 0}
                    {item.failedCount > 0 && (
                      <span className="text-red-600 ml-1">({item.failedCount} failed)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.assignedUserName || (t('unassigned') || 'Unassigned')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={getStatusBadge(item.status)}>
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/import-history/${item.id}`)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('viewLog') || 'View Log'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-600">
              {t('clearImportHistory') || 'Clear Import History?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('clearImportHistoryConfirm') || 'Are you sure you want to delete all import history? This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t('clearAll') || 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportHistoryPage;

