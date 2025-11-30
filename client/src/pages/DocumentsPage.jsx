import { useState, useEffect, useRef, useMemo } from 'react';
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
  Eye,
  Search,
  X,
  UserPlus
} from 'lucide-react';
import {
  fetchClients,
  fetchAllDocuments,
  fetchClientDocuments,
  fetchPersonalDocuments,
  uploadPersonalDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  assignDocumentToUser
} from '../services/api';
import { format } from 'date-fns';
import FilePreview from '../components/FilePreview';
import AssignToUserModal from '../components/AssignToUserModal';

const DocumentsPage = () => {
  // ============================================
  // SECTION 1: ALL HOOKS - MUST BE FIRST, UNCONDITIONAL
  // ============================================
  const { t } = useI18n();
  
  // All useState hooks
  const [clients, setClients] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientDocs, setSelectedClientDocs] = useState([]);
  const [activeTab, setActiveTab] = useState('clients');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingClientDocs, setLoadingClientDocs] = useState(false);
  const [error, setError] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDocumentForAssign, setSelectedDocumentForAssign] = useState(null);
  
  // useRef hook
  const fileInputRef = useRef(null);

  // Admin check (not a hook)
  const isAdmin = window.location.pathname.startsWith('/admin');

  // All useEffect hooks
  useEffect(() => {
    loadData();
  }, []);

  // All useMemo hooks
  const totalDocumentsCount = useMemo(() => {
    if (isAdmin) {
      return allDocuments.length;
    }
    return personalDocuments.length + allDocuments.filter(d => 
      d.clientId && clients.some(c => c.id === d.clientId)
    ).length;
  }, [isAdmin, allDocuments, personalDocuments, clients]);

  const clientsWithDocs = useMemo(() => {
    return clients
      .map((c) => {
        const docs = allDocuments.filter((d) => d.clientId === c.id);
        if (!docs.length) return null;
        return {
          ...c,
          documentCount: docs.length,
          lastUpload: docs.reduce(
            (acc, d) => (new Date(d.uploadedAt) > new Date(acc) ? d.uploadedAt : acc),
            docs[0].uploadedAt
          )
        };
      })
      .filter(Boolean)
      .filter((client) => {
        if (!clientSearchTerm.trim()) return true;
        return client.name.toLowerCase().includes(clientSearchTerm.toLowerCase());
      });
  }, [clients, allDocuments, clientSearchTerm]);

  const filteredPersonalDocuments = useMemo(() => {
    return personalDocuments.filter((doc) => {
      if (!documentSearchTerm.trim()) return true;
      const docName = doc.originalName || 'Unknown file';
      return docName.toLowerCase().includes(documentSearchTerm.toLowerCase());
    });
  }, [personalDocuments, documentSearchTerm]);

  // ============================================
  // SECTION 2: FUNCTIONS - After all hooks
  // ============================================
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clientsData, docsData, personalDocsData] = await Promise.all([
        fetchClients().catch(() => []),
        fetchAllDocuments().catch(() => []),
        fetchPersonalDocuments().catch(() => [])
      ]);
      setClients(clientsData || []);
      setAllDocuments(docsData || []);
      setPersonalDocuments(personalDocsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClientDocs = async (client) => {
    if (!client?.id) {
      setError('Invalid client selected.');
      return;
    }

    try {
      setSelectedClient(client);
      setLoadingClientDocs(true);
      setError(null);
      setSelectedClientDocs([]);

      const docs = await fetchClientDocuments(client.id);
      const validDocs = Array.isArray(docs) ? docs.filter(doc => doc && doc.id) : [];
      setSelectedClientDocs(validDocs);
    } catch (err) {
      console.error('Failed to load client docs:', err);
      setError('Failed to load documents. Please try again.');
      setSelectedClientDocs([]);
    } finally {
      setLoadingClientDocs(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadPersonalDocument(file);
      await loadData();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      alert('Document uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id, isPersonal) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      await deleteDocument(id);
      if (isPersonal) {
        setPersonalDocuments((docs) => docs.filter((d) => d.id !== id));
      } else {
        setSelectedClientDocs((docs) => docs.filter((d) => d.id !== id));
        setAllDocuments((docs) => docs.filter((d) => d.id !== id));
      }
      if (previewDocument?.id === id) {
        setPreviewDocument(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete document: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAssignDocument = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Admin token not found. Please log in again.');
        return;
      }
      await assignDocumentToUser(token, selectedDocumentForAssign.id, userId);
      alert(t('documentAssignedSuccess') || 'Document assigned successfully');
      loadData();
    } catch (error) {
      console.error('Error assigning document:', error);
      alert('Failed to assign document: ' + (error.message || 'Unknown error'));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (typeof bytes !== 'number') return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ============================================
  // SECTION 3: EARLY RETURNS - Only for loading
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // SECTION 4: JSX - Stable component tree
  // ============================================
  // CRITICAL: Always render the same component structure
  // FilePreview and AssignToUserModal must always be in the same position
  return (
    <>
      {/* Main content - conditionally show client view or main view */}
      {selectedClient && selectedClient.id ? (
        // Client Documents View
        <div className="p-4 sm:p-6">
          <button
            onClick={() => {
              setSelectedClient(null);
              setSelectedClientDocs([]);
              setError(null);
            }}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> {t('back') || 'Back'}
          </button>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              {selectedClient.name || 'Client Documents'}
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={() => handleViewClientDocs(selectedClient)}
                  className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {loadingClientDocs && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              </div>
            )}

            {!loadingClientDocs && !error && selectedClientDocs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-2">No documents found</p>
                <p className="text-sm">This client doesn't have any documents yet.</p>
              </div>
            )}

            {!loadingClientDocs && !error && selectedClientDocs.length > 0 && (
              <div className="space-y-2">
                {selectedClientDocs.map((doc) => {
                  if (!doc || !doc.id) return null;
                  
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-8 h-8 text-purple-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{doc.originalName || 'Unknown file'}</p>
                          <p className="text-sm text-gray-400">{formatFileSize(doc.size)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setPreviewDocument(doc)}
                          className="p-2 text-green-600 hover:text-green-700 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <a
                          href={getDocumentDownloadUrl(doc.id)}
                          download={doc.originalName}
                          className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedDocumentForAssign(doc);
                              setAssignModalOpen(true);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-700 transition-colors"
                            title={t('assignToUser') || 'Assign to User'}
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(doc.id, false)}
                          className="p-2 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Main Documents Page
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={loadData}
                className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary" /> {t('documents') || 'Documents'}
              </h1>
              <span
                className="bg-primary text-white px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap"
                title={isAdmin ? `Total: ${totalDocumentsCount} documents` : `You have ${totalDocumentsCount} documents`}
              >
                {totalDocumentsCount}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('clients');
                setDocumentSearchTerm('');
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm sm:text-base ${activeTab === 'clients' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            >
              <span>{t('clients') || 'Clients'}</span>
              {activeTab === 'clients' && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {clientsWithDocs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('personal');
                setClientSearchTerm('');
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap text-sm sm:text-base ${activeTab === 'personal' ? 'bg-primary text-white' : 'bg-gray-100'}`}
            >
              <span>{isAdmin ? (t('allDocuments') || 'All Documents') : (t('myDocuments') || 'My Documents')}</span>
              {activeTab === 'personal' && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {personalDocuments.length}
                </span>
              )}
            </button>
          </div>

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 rtl:right-3 rtl:left-auto" />
                  <input
                    type="text"
                    placeholder={t('searchClients') || 'Search clients...'}
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent rtl:pr-10 rtl:pl-4 text-base"
                  />
                  {clientSearchTerm && (
                    <button
                      onClick={() => setClientSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 rtl:left-3 rtl:right-auto"
                      title={t('clear') || 'Clear'}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {clientsWithDocs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>
                    {clientSearchTerm
                      ? (t('noDocumentsFound') || 'No documents found matching your search.')
                      : (t('noDocuments') || 'No documents yet')}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">{t('clientName') || 'Client Name'}</th>
                      <th className="text-left p-3">{t('documentCount') || 'Documents'}</th>
                      <th className="text-left p-3">{t('lastUpload') || 'Last Upload'}</th>
                      <th className="text-left p-3">{t('actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientsWithDocs.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            <span className="font-medium">{client.name}</span>
                          </div>
                        </td>
                        <td className="p-3">{client.documentCount}</td>
                        <td className="p-3">
                          {client.lastUpload ? (() => {
                            try {
                              return format(new Date(client.lastUpload), 'dd/MM/yyyy');
                            } catch (e) {
                              return '-';
                            }
                          })() : '-'}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleViewClientDocs(client)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
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
            <div className="bg-white p-6 rounded-lg border">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.xlsx,.xls,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
              />
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-4 border-2 border-dashed rounded-lg text-primary hover:bg-orange-50"
                  disabled={isUploading}
                >
                  <Upload className="w-5 h-5" /> {isUploading ? 'Uploading...' : (t('uploadDocument') || 'Upload Document')}
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 rtl:right-3 rtl:left-auto" />
                  <input
                    type="text"
                    placeholder={t('searchDocuments') || 'Search documents...'}
                    value={documentSearchTerm}
                    onChange={(e) => setDocumentSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent rtl:pr-10 rtl:pl-4 text-base"
                  />
                  {documentSearchTerm && (
                    <button
                      onClick={() => setDocumentSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 rtl:left-3 rtl:right-auto"
                      title={t('clear') || 'Clear'}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {filteredPersonalDocuments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      {documentSearchTerm
                        ? (t('noDocumentsFound') || 'No documents found matching your search.')
                        : (t('noDocuments') || 'No documents yet')}
                    </p>
                    {!documentSearchTerm && (
                      <p className="text-sm">Upload your first document using the button above.</p>
                    )}
                  </div>
                ) : (
                  filteredPersonalDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">{doc.originalName || 'Unknown file'}</p>
                          <p className="text-sm text-gray-400">{formatFileSize(doc.size)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewDocument(doc)}
                          className="p-2 text-green-600 hover:text-green-700"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <a
                          href={getDocumentDownloadUrl(doc.id)}
                          download={doc.originalName}
                          className="p-2 text-blue-600 hover:text-blue-700"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedDocumentForAssign(doc);
                              setAssignModalOpen(true);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-700"
                            title={t('assignToUser') || 'Assign to User'}
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(doc.id, true)}
                          className="p-2 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRITICAL: These components MUST always be in the same position */}
      {/* This ensures hook order never changes between renders */}
      {previewDocument && previewDocument.id && (
        <FilePreview
          fileUrl={getDocumentDownloadUrl(previewDocument.id)}
          fileName={previewDocument.originalName || 'Document'}
          onClose={() => setPreviewDocument(null)}
        />
      )}

      {isAdmin && (
        <AssignToUserModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedDocumentForAssign(null);
          }}
          onAssign={handleAssignDocument}
          title={t('assignDocumentToUser') || 'Assign Document to User'}
          itemName={selectedDocumentForAssign?.originalName}
        />
      )}
    </>
  );
};

export default DocumentsPage;

