import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import {
  ChevronLeft,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  File,
  Package,
  Users,
  Info
} from 'lucide-react';
import { getImportLog } from '../services/api';
import { format } from 'date-fns';

const ImportLogPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadLog();
    }
  }, [id]);

  const loadLog = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getImportLog(id);
      setLog(data);
    } catch (err) {
      console.error('Failed to load import log:', err);
      setError('Failed to load import log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadErrorReport = () => {
    if (!log || !log.errors || log.errors.length === 0) return;

    const csvRows = [
      ['Row Number', 'Error Message', 'Data'].join(',')
    ];

    log.errors.forEach(error => {
      const row = [
        error.row || '',
        `"${(error.error || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(error.data || {}).replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `import-error-report-${log.id.substring(0, 8)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFullLog = () => {
    if (!log) return;

    const logData = {
      importId: log.id,
      type: log.type,
      importedBy: log.importedBy,
      importedAt: log.createdAt,
      fileName: log.fileName,
      fileSize: log.fileSize,
      fileType: log.fileType,
      totalRows: log.totalRows,
      successfulCount: log.successfulCount,
      failedCount: log.failedCount,
      status: log.status,
      assignedUser: log.assignedUserName,
      errors: log.errors || [],
      successful: log.successful || []
    };

    const jsonContent = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `import-log-${log.id.substring(0, 8)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-semibold';
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
        return <Users className="w-5 h-5" />;
      case 'products':
        return <Package className="w-5 h-5" />;
      case 'documents':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading import log...</p>
        </div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="p-4 sm:p-6">
        <button
          onClick={() => navigate('/admin/import-history')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> {t('back') || 'Back'}
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 text-lg font-medium mb-2">
            {error || 'Import log not found'}
          </p>
          <button
            onClick={() => navigate('/admin/import-history')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600"
          >
            {t('backToHistory') || 'Back to Import History'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <button
        onClick={() => navigate('/admin/import-history')}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" /> {t('backToHistory') || 'Back to Import History'}
      </button>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              {getTypeIcon(log.type)}
              <div>
                <h1 className="text-2xl font-bold">
                  {t('importLog') || 'Import Log'}
                </h1>
                <p className="text-sm text-gray-500 font-mono">
                  {log.id?.substring(0, 16)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(log.status)}
              <span className={getStatusBadge(log.status)}>
                {log.status ? log.status.charAt(0).toUpperCase() + log.status.slice(1) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* File Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <File className="w-5 h-5 text-primary" />
            {t('fileInformation') || 'File Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fileName') || 'File Name'}
              </label>
              <p className="text-gray-900">{log.fileName || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fileSize') || 'File Size'}
              </label>
              <p className="text-gray-900">{formatFileSize(log.fileSize)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fileType') || 'File Type'}
              </label>
              <p className="text-gray-900 capitalize">{log.fileType || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('uploadDateTime') || 'Upload Date & Time'}
              </label>
              <p className="text-gray-900">
                {log.createdAt ? (() => {
                  try {
                    return format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss');
                  } catch (e) {
                    return log.createdAt;
                  }
                })() : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            {t('summary') || 'Summary'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-blue-700 mb-1">
                {t('totalRowsProcessed') || 'Total Rows Processed'}
              </label>
              <p className="text-2xl font-bold text-blue-900">{log.totalRows || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-green-700 mb-1">
                {t('successfulImports') || 'Successful Imports'}
              </label>
              <p className="text-2xl font-bold text-green-900">{log.successfulCount || 0}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-red-700 mb-1">
                {t('failedRows') || 'Failed Rows'}
              </label>
              <p className="text-2xl font-bold text-red-900">{log.failedCount || 0}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-purple-700 mb-1">
                {t('assignedUser') || 'Assigned User'}
              </label>
              <p className="text-lg font-semibold text-purple-900">
                {log.assignedUserName || (t('unassigned') || 'Unassigned')}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>
                <strong>{t('importedBy') || 'Imported By'}:</strong> {log.importedBy || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Logs */}
        {log.errors && log.errors.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              {t('errorLogs') || 'Error Logs'} ({log.errors.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {log.errors.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-red-800">
                        {t('row') || 'Row'} {error.row || index + 1}:
                      </span>
                    </div>
                  </div>
                  <p className="text-red-700 mb-2 font-medium">
                    {error.error || 'Unknown error'}
                  </p>
                  {error.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                        {t('viewData') || 'View Data'}
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded border border-red-200 text-xs overflow-x-auto">
                        {JSON.stringify(error.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Options */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            {t('downloadOptions') || 'Download Options'}
          </h2>
          <div className="flex flex-wrap gap-3">
            {log.errors && log.errors.length > 0 && (
              <button
                onClick={downloadErrorReport}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('downloadErrorReport') || 'Download Error Report (.csv)'}
              </button>
            )}
            <button
              onClick={downloadFullLog}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('downloadFullLog') || 'Download Full Log (.json)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportLogPage;

