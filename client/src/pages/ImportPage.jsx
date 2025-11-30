import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Upload, FileText, File, CheckCircle, XCircle, FileSpreadsheet, Package, Users, UserPlus, Shield } from 'lucide-react';
import { uploadCSV, uploadPDF, uploadXLSX, bulkImportProducts, bulkImportClients, fetchProducts, fetchClients, getAdminUsers } from '../services/api';
import ImportPreview from '../components/ImportPreview';

const ImportPage = () => {
  const { t } = useI18n();
  const [importType, setImportType] = useState('products');
  const [fileType, setFileType] = useState('csv');
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [mapping, setMapping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imported, setImported] = useState(false);
  const [existingProducts, setExistingProducts] = useState([]);
  const [existingClients, setExistingClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignToUserId, setAssignToUserId] = useState(null);
  const [bulkAssignMode, setBulkAssignMode] = useState('single'); // 'single' or 'multiple'
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showBulkAssignAfter, setShowBulkAssignAfter] = useState(false);
  const [lastImportResult, setLastImportResult] = useState(null);
  const isAdmin = window.location.pathname.startsWith('/admin');

  // Fetch existing data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const [products, clients] = await Promise.all([
          fetchProducts(),
          fetchClients()
        ]);
        setExistingProducts(products);
        setExistingClients(clients);
        
        // Load users if admin
        if (isAdmin) {
          try {
            const token = localStorage.getItem('adminToken');
            const usersData = await getAdminUsers(token);
            setUsers(usersData || []);
          } catch (err) {
            console.error('Failed to load users:', err);
          }
        }
      } catch (err) {
        console.error('Failed to load existing data:', err);
      }
    };
    loadExistingData();
  }, [isAdmin]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewData(null);
      setMapping(null);
      setError(null);
      setImported(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      let response;
      if (fileType === 'csv') {
        response = await uploadCSV(file);
      } else if (fileType === 'pdf') {
        response = await uploadPDF(file);
      } else if (fileType === 'xlsx') {
        response = await uploadXLSX(file);
      }

      if (response.preview) {
        setPreviewData(response.preview);
        setMapping(response.mapping || {});
      } else {
        setError('Failed to parse file');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (field, column) => {
    setMapping({
      ...mapping,
      [field]: column,
    });
  };

  const handleDataCorrection = (index, field, value) => {
    if (field === '__delete') {
      // Remove the row
      const updated = previewData.filter((_, i) => i !== index);
      setPreviewData(updated);
    } else {
      // Update the field
      const updated = [...previewData];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      setPreviewData(updated);
    }
  };

  const handleImport = async (filteredData) => {
    // Use filtered data if provided, otherwise use all preview data
    const dataToImport = filteredData || previewData;
    if (!dataToImport || !mapping) return;

    setLoading(true);
    setError(null);

    try {
      const assignUserId = isAdmin && assignToUserId ? assignToUserId : null;
      const fileName = file?.name || 'Unknown';
      const fileSize = file?.size || 0;
      const fileTypeValue = file?.type || fileType || 'unknown';

      if (importType === 'products') {
        const products = dataToImport.map(row => ({
          nameEn: row[mapping.name] || row[mapping.nameEn] || row.name || row.nameEn || '',
          nameHe: row[mapping.nameHe] || row.nameHe || '',
          code: row[mapping.code] || row.code || '',
          price: parseFloat(row[mapping.price] || row.price || 0),
          discount: parseFloat(row[mapping.discount] || row.discount || 0),
          discountType: row[mapping.discountType] || row.discountType || 'percent',
        }));

        const result = await bulkImportProducts(products, assignUserId, fileName, fileSize, fileTypeValue);
        setLastImportResult(result);
        setImported(true);
        
        // Show bulk assign after import if admin and import was successful
        if (isAdmin && result.success && !assignUserId) {
          setShowBulkAssignAfter(true);
        } else {
          setPreviewData(null);
          setFile(null);
          setMapping(null);
          setTimeout(() => {
            window.location.href = isAdmin ? '/admin/products' : '/products';
          }, 2000);
        }
      } else {
        const clients = dataToImport.map(row => ({
          name: row[mapping.name] || row.name || '',
          pc: row[mapping.pc] || row.pc || '',
          phone: row[mapping.phone] || row.phone || '',
          email: row[mapping.email] || row.email || '',
          notes: row[mapping.notes] || row.notes || '',
          lastContacted: row[mapping.lastContacted] || row.lastContacted || new Date().toISOString().split('T')[0],
        }));

        const result = await bulkImportClients(clients, assignUserId, fileName, fileSize, fileTypeValue);
        setLastImportResult(result);
        setImported(true);
        
        // Show bulk assign after import if admin and import was successful
        if (isAdmin && result.success && !assignUserId) {
          setShowBulkAssignAfter(true);
        } else {
          setPreviewData(null);
          setFile(null);
          setMapping(null);
          setTimeout(() => {
            window.location.href = isAdmin ? '/admin/clients' : '/clients';
          }, 2000);
        }
      }
    } catch (err) {
      setError(err.message || `Failed to import ${importType}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignAfter = async (userId) => {
    if (!lastImportResult?.importId) return;
    
    setLoading(true);
    try {
      // The assignment would need to be done via a separate API endpoint
      // For now, we'll just close the modal and redirect
      setShowBulkAssignAfter(false);
      setPreviewData(null);
      setFile(null);
      setMapping(null);
      setTimeout(() => {
        const basePath = isAdmin ? '/admin' : '';
        window.location.href = importType === 'products' ? `${basePath}/products` : `${basePath}/clients`;
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to assign items');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewData(null);
    setMapping(null);
    setError(null);
    setImported(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-black mb-6">{t('import')}</h2>

      {imported && !showBulkAssignAfter && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">
            {importType === 'products' ? t('productsImportedSuccess') : t('clientsImportedSuccess')}
            {lastImportResult?.importId && ` (Import ID: ${lastImportResult.importId.substring(0, 8)})`}
          </span>
        </div>
      )}

      {/* Bulk Assign After Import Modal */}
      {showBulkAssignAfter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{t('bulkAssignAfterImport') || 'Bulk Assign Imported Items?'}</h3>
            <p className="text-gray-600 mb-4">
              {t('bulkAssignAfterImportDescription') || 'Would you like to assign the imported items to a user?'}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('assignToUser') || 'Assign To User'}
              </label>
              <select
                value={assignToUserId || ''}
                onChange={(e) => setAssignToUserId(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t('skip') || 'Skip'}</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email || `User ${user.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkAssignAfter(false);
                  setPreviewData(null);
                  setFile(null);
                  setMapping(null);
                  setTimeout(() => {
                    const basePath = isAdmin ? '/admin' : '';
                    window.location.href = importType === 'products' ? `${basePath}/products` : `${basePath}/clients`;
                  }, 500);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                {t('skip') || 'Skip'}
              </button>
              <button
                onClick={() => handleBulkAssignAfter(assignToUserId)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? t('assigning') || 'Assigning...' : t('assign') || 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {!previewData && (
        <div className="space-y-6">
          {/* Bulk Assign Section (Admin Only) */}
          {isAdmin && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                {t('bulkAssignOptions') || 'Bulk Assign Options'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('assignToUser') || 'Assign To User'}
                  </label>
                  <select
                    value={assignToUserId || ''}
                    onChange={(e) => setAssignToUserId(e.target.value || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">{t('leaveUnassigned') || 'Leave Unassigned (Admin Account)'}</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email || `User ${user.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-gray-600">
                  {t('bulkAssignDescription') || 'If left unassigned, imported items will remain in the admin account. You can assign them later from the Import History page.'}
                </p>
              </div>
            </div>
          )}

          {/* Import Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('importType')}
            </label>
            <div className="flex gap-4 mb-4 flex-wrap">
              <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 transition-colors ${
                importType === 'products' 
                  ? 'border-primary bg-orange-50 text-primary' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  value="products"
                  checked={importType === 'products'}
                  onChange={(e) => setImportType(e.target.value)}
                  className="sr-only"
                />
                <Package className="w-5 h-5" />
                {t('importProducts')}
              </label>
              <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 transition-colors ${
                importType === 'clients' 
                  ? 'border-primary bg-orange-50 text-primary' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  value="clients"
                  checked={importType === 'clients'}
                  onChange={(e) => setImportType(e.target.value)}
                  className="sr-only"
                />
                <Users className="w-5 h-5" />
                {t('importClients')}
              </label>
            </div>
          </div>

          {/* File Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('import')}
            </label>
            <div className="flex gap-4 mb-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={fileType === 'csv'}
                  onChange={(e) => setFileType(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <FileText className="w-5 h-5" />
                CSV
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="xlsx"
                  checked={fileType === 'xlsx'}
                  onChange={(e) => setFileType(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <FileSpreadsheet className="w-5 h-5" />
                Excel (XLSX)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="pdf"
                  checked={fileType === 'pdf'}
                  onChange={(e) => setFileType(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <File className="w-5 h-5" />
                PDF
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectFile')}
            </label>
            <input
              type="file"
              accept={fileType === 'csv' ? '.csv' : fileType === 'xlsx' ? '.xlsx,.xls' : '.pdf'}
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-orange-600"
            />
          </div>

          {file && (
            <button
              onClick={handleFileUpload}
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {loading ? 'Processing...' : 'Upload & Preview'}
            </button>
          )}
        </div>
      )}

      {previewData && (
        <ImportPreview
          data={previewData}
          mapping={mapping}
          onMappingChange={handleMappingChange}
          onDataCorrection={handleDataCorrection}
          onImport={handleImport}
          onCancel={handleCancel}
          loading={loading}
          importType={importType}
          existingProducts={existingProducts}
          existingClients={existingClients}
        />
      )}
    </div>
  );
};

export default ImportPage;
