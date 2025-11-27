import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  File, 
  ChevronLeft, 
  User,
  FolderOpen,
  Clock
} from 'lucide-react';
import { 
  fetchClients, 
  fetchAllDocuments, 
  fetchClientDocuments, 
  fetchPersonalDocuments,
  uploadPersonalDocument,
  deleteDocument,
  getDocumentDownloadUrl
} from '../services/api';
import { format } from 'date-fns';

const DocumentsPage = () => {
  const { t } = useI18n();
  const [clients, setClients] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientDocs, setSelectedClientDocs] = useState([]);
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'personal'
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsData, docsData, personalDocsData] = await Promise.all([
        fetchClients(),
        fetchAllDocuments(),
        fetchPersonalDocuments()
      ]);
      setClients(clientsData);
      setAllDocuments(docsData);
      setPersonalDocuments(personalDocsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get clients that have documents
  const clientsWithDocs = clients.filter(client => {
    const clientDocs = allDocuments.filter(d => d.clientId === client.id);
    return clientDocs.length > 0;
  }).map(client => {
    const clientDocs = allDocuments.filter(d => d.clientId === client.id);
    const lastUpload = clientDocs.reduce((latest, doc) => {
      return new Date(doc.uploadedAt) > new Date(latest) ? doc.uploadedAt : latest;
    }, clientDocs[0]?.uploadedAt || '');
    
    return {
      ...client,
      documentCount: clientDocs.length,
      lastUpload
    };
  });

  // Handle viewing client documents
  const handleViewClientDocs = async (client) => {
    setSelectedClient(client);
    try {
      const docs = await fetchClientDocuments(client.id);
      setSelectedClientDocs(docs);
    } catch (err) {
      console.error('Failed to load client documents:', err);
    }
  };

  // Handle personal document upload
  const handlePersonalUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const newDoc = await uploadPersonalDocument(file);
      setPersonalDocuments([...personalDocuments, newDoc]);
      setAllDocuments([...allDocuments, newDoc]);
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle document delete
  const handleDeleteDocument = async (docId, isPersonal = false) => {
    if (!window.confirm(t('confirmDelete') || 'Are you sure?')) return;
    
    try {
      await deleteDocument(docId);
      setAllDocuments(allDocuments.filter(d => d.id !== docId));
      if (isPersonal) {
        setPersonalDocuments(personalDocuments.filter(d => d.id !== docId));
      } else {
        setSelectedClientDocs(selectedClientDocs.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Client documents view
  if (selectedClient) {
    return (
      <div>
        <button
          onClick={() => {
            setSelectedClient(null);
            setSelectedClientDocs([]);
          }}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('back') || 'Back'}
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">{selectedClient.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedClientDocs.length} {t('documents') || 'Documents'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {selectedClientDocs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('noDocuments') || 'No documents yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedClientDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <File className="w-10 h-10 text-purple-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{doc.originalName}</p>
                        <p className="text-sm text-gray-400 flex items-center gap-2">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm')}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={getDocumentDownloadUrl(doc.id)}
                        download={doc.originalName}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title={t('download') || 'Download'}
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title={t('deleteDocument') || 'Delete'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <FileText className="w-7 h-7 text-primary" />
          {t('documents') || 'Documents'}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'clients'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('clientsWithDocuments') || 'Clients with Documents'}
          {clientsWithDocs.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {clientsWithDocs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'personal'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('myDocuments') || 'My Documents'}
          {personalDocuments.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {personalDocuments.length}
            </span>
          )}
        </button>
      </div>

      {/* Clients with Documents Tab */}
      {activeTab === 'clients' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {clientsWithDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('noDocuments') || 'No documents yet'}</p>
              <p className="text-sm mt-1">Upload documents from the Edit Client page</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('clientName') || 'Client Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documentCount') || 'Documents'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('lastUpload') || 'Last Upload'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientsWithDocs.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {client.documentCount} {t('documents') || 'documents'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.lastUpload ? format(new Date(client.lastUpload), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewClientDocs(client)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 text-sm font-medium transition-colors"
                      >
                        {t('viewDocuments') || 'View Documents'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Personal Documents Tab */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Upload Button */}
          <div className="mb-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePersonalUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full px-4 py-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isUploading
                  ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-primary text-primary hover:bg-orange-50'
              }`}
            >
              <Upload className="w-5 h-5" />
              {isUploading ? 'Uploading...' : (t('uploadDocument') || 'Upload Document')}
            </button>
          </div>

          {/* Personal Documents List */}
          {personalDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('noDocuments') || 'No documents yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {personalDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <File className="w-10 h-10 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{doc.originalName}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={getDocumentDownloadUrl(doc.id)}
                      download={doc.originalName}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title={t('download') || 'Download'}
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, true)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title={t('deleteDocument') || 'Delete'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;

