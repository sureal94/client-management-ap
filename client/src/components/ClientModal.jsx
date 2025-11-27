import { useState, useEffect, useMemo, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { X, Trash2, Plus, Check, AlertCircle, MessageCircle, Send, Clock, Bell, Calendar, FileUp, File, Download } from 'lucide-react';
import { format } from 'date-fns';
import { uploadClientDocument, fetchClientDocuments, deleteDocument, getDocumentDownloadUrl } from '../services/api';

const ClientModal = ({ client, clients = [], products, onSave, onClose, onDelete }) => {
  const { t, language } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    pc: '',
    phone: '',
    email: '',
    comments: [],
    reminders: [],
    productIds: [],
    lastContacted: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderData, setReminderData] = useState({
    date: format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Tomorrow by default
    note: ''
  });
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [clientDocuments, setClientDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (client) {
      // Migrate old notes to comments if needed
      let comments = client.comments || [];
      if (client.notes && (!client.comments || client.comments.length === 0)) {
        // Migrate old notes string to first comment
        comments = [{
          id: 'migrated-' + Date.now(),
          text: client.notes,
          createdAt: client.lastContacted || new Date().toISOString(),
          user: 'System (migrated)'
        }];
      }
      
      setFormData({
        name: client.name || '',
        pc: client.pc || client.status || '', // Support old status field for migration
        phone: client.phone || '',
        email: client.email || '',
        comments: comments,
        reminders: client.reminders || [],
        productIds: client.productIds || [],
        lastContacted: client.lastContacted
          ? format(new Date(client.lastContacted), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [client]);

  // Load client documents when editing
  useEffect(() => {
    if (client?.id) {
      fetchClientDocuments(client.id)
        .then(setClientDocuments)
        .catch(err => console.error('Failed to load documents:', err));
    }
  }, [client?.id]);

  // Handle document upload
  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !client?.id) return;

    setIsUploading(true);
    try {
      const newDoc = await uploadClientDocument(client.id, file);
      setClientDocuments([...clientDocuments, newDoc]);
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
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm(t('confirmDelete') || 'Are you sure?')) return;
    
    try {
      await deleteDocument(docId);
      setClientDocuments(clientDocuments.filter(d => d.id !== docId));
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

  // Format relative time for comments
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('minutesAgo') || 'minutes ago'}`;
    if (diffHours < 24) return `${diffHours} ${t('hoursAgo') || 'hours ago'}`;
    if (diffDays < 7) return `${diffDays} ${t('daysAgo') || 'days ago'}`;
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  // Add a new comment
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
      user: 'User' // Could be replaced with actual user name
    };
    
    setFormData({
      ...formData,
      comments: [...formData.comments, comment]
    });
    setNewComment('');
  };

  // Delete a comment
  const handleDeleteComment = (commentId) => {
    setFormData({
      ...formData,
      comments: formData.comments.filter(c => c.id !== commentId)
    });
  };

  // Add a new reminder
  const handleAddReminder = () => {
    if (!reminderData.date) return;
    
    const reminder = {
      id: Date.now().toString(),
      date: reminderData.date,
      note: reminderData.note.trim(),
      createdAt: new Date().toISOString(),
      clientName: formData.name // Store client name for notification display
    };
    
    setFormData({
      ...formData,
      reminders: [...formData.reminders, reminder]
    });
    
    // Reset reminder form and close modal
    setReminderData({
      date: format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      note: ''
    });
    setIsReminderModalOpen(false);
  };

  // Delete a reminder
  const handleDeleteReminder = (reminderId) => {
    setFormData({
      ...formData,
      reminders: formData.reminders.filter(r => r.id !== reminderId)
    });
  };

  // Check for duplicates (case-insensitive, trimmed)
  const duplicateErrors = useMemo(() => {
    const errors = {};
    const currentId = client?.id;
    
    const nameTrimmed = formData.name.trim().toLowerCase();
    const phoneTrimmed = formData.phone.trim();

    if (nameTrimmed) {
      const duplicateName = clients.find(c => 
        c.id !== currentId && 
        (c.name || '').trim().toLowerCase() === nameTrimmed
      );
      if (duplicateName) {
        errors.name = t('clientNameExists') || 'Client name already exists';
      }
    }

    if (phoneTrimmed) {
      const duplicatePhone = clients.find(c => 
        c.id !== currentId && 
        (c.phone || '').trim() === phoneTrimmed
      );
      if (duplicatePhone) {
        errors.phone = t('phoneExists') || 'Phone number already exists';
      }
    }

    return errors;
  }, [formData.name, formData.phone, clients, client, t]);

  const hasErrors = Object.keys(duplicateErrors).length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasErrors) {
      return;
    }
    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProductToggle = (productId) => {
    setFormData({
      ...formData,
      productIds: formData.productIds.includes(productId)
        ? formData.productIds.filter(id => id !== productId)
        : [...formData.productIds, productId],
    });
  };

  const removeProduct = (productId) => {
    setFormData({
      ...formData,
      productIds: formData.productIds.filter(id => id !== productId),
    });
  };

  const getProductDisplayName = (product) => {
    return language === 'he' 
      ? (product.nameHe || product.nameEn || product.name) 
      : (product.nameEn || product.name);
  };

  const selectedProducts = products.filter(p => formData.productIds.includes(p.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">
            {client ? t('editClient') : t('addClient')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('clientName')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  duplicateErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {duplicateErrors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {duplicateErrors.name}
                </p>
              )}
            </div>

            {/* PC (ח"פ) - directly under Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pc')}
              </label>
              <input
                type="text"
                name="pc"
                value={formData.pc}
                onChange={handleChange}
                placeholder={language === 'he' ? 'מספר ח"פ' : 'PC Number'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  duplicateErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {duplicateErrors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {duplicateErrors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Last Contacted */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('lastContacted')}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="lastContacted"
                  value={formData.lastContacted}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(true)}
                  className="px-3 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1"
                  title={t('setReminder') || 'Set Reminder'}
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">{t('setReminder') || 'Set Reminder'}</span>
                </button>
                {client && (
                  <button
                    type="button"
                    onClick={() => setIsDocumentModalOpen(true)}
                    className="px-3 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
                    title={t('uploadDocument') || 'Upload Document'}
                  >
                    <FileUp className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{t('uploadDocument') || 'Upload Document'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Existing Reminders */}
          {formData.reminders.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">{t('reminders') || 'Reminders'}</span>
              </div>
              <div className="space-y-2">
                {formData.reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{format(new Date(reminder.date), 'dd/MM/yyyy')}</span>
                      {reminder.note && <span className="text-gray-500">- {reminder.note}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title={t('deleteReminder') || 'Delete Reminder'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('attachedProducts')}
            </label>
            
            {/* Selected Products as Bubbles/Chips */}
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedProducts.map((product) => (
                  <span
                    key={product.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium"
                  >
                    {getProductDisplayName(product)}
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Products Button */}
            <button
              type="button"
              onClick={() => setIsProductPickerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('addProducts') || 'Add Products'}
            </button>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <MessageCircle className="w-4 h-4" />
              {t('comments') || 'Comments'}
            </label>
            
            {/* Add Comment Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder={t('commentPlaceholder') || 'Write a comment...'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  newComment.trim()
                    ? 'bg-primary text-white hover:bg-orange-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                {t('addComment') || 'Add Comment'}
              </button>
            </div>

            {/* Comment History Timeline */}
            <div className="max-h-60 overflow-y-auto">
              {formData.comments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4 italic">
                  {t('noComments') || 'No comments yet'}
                </p>
              ) : (
                <div className="space-y-3">
                  {[...formData.comments].reverse().map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100 group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-primary">
                          {comment.user || 'User'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1"
                            title={t('deleteComment') || 'Delete Comment'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 rtl:flex-row-reverse">
            <button
              type="submit"
              disabled={hasErrors}
              className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                hasErrors
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-orange-600'
              }`}
            >
              {t('save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
            >
              {t('cancel')}
            </button>
          </div>

          {/* Delete button - only shown when editing */}
          {client && onDelete && (
            <div className="pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this item?')) {
                    onDelete(client.id);
                    onClose();
                  }
                }}
                className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2 border border-red-200"
              >
                <Trash2 className="w-5 h-5" />
                {t('deleteClient')}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Product Picker Modal */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black">
                {t('selectProducts') || 'Select Products'}
              </h3>
              <button
                onClick={() => setIsProductPickerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  {t('noProducts') || 'No products available'}
                </p>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => {
                    const isSelected = formData.productIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductToggle(product.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="font-medium">{getProductDisplayName(product)}</span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium"
              >
                {t('done') || 'Done'} ({formData.productIds.length} {t('selected') || 'selected'})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                {t('setReminder') || 'Set Reminder'}
              </h3>
              <button
                onClick={() => setIsReminderModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Reminder Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('reminderDate') || 'Reminder Date'}
                </label>
                <input
                  type="date"
                  value={reminderData.date}
                  onChange={(e) => setReminderData({ ...reminderData, date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Reminder Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reminderNote') || 'Reminder Note'}
                </label>
                <textarea
                  value={reminderData.note}
                  onChange={(e) => setReminderData({ ...reminderData, note: e.target.value })}
                  placeholder={t('reminderNotePlaceholder') || 'What is this reminder for? (e.g., Call later)'}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleAddReminder}
                disabled={!reminderData.date}
                className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  reminderData.date
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Bell className="w-4 h-4" />
                {t('saveReminder') || 'Save Reminder'}
              </button>
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
              >
                {t('cancelReminder') || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {isDocumentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-black flex items-center gap-2">
                <FileUp className="w-5 h-5 text-purple-600" />
                {t('clientDocuments') || 'Client Documents'}
              </h3>
              <button
                onClick={() => setIsDocumentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Upload Button */}
              <div className="mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`w-full px-4 py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    isUploading
                      ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-purple-300 text-purple-600 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                >
                  <FileUp className="w-5 h-5" />
                  {isUploading ? 'Uploading...' : (t('selectDocument') || 'Select Document')}
                </button>
              </div>

              {/* Document List */}
              {clientDocuments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8 italic">
                  {t('noDocuments') || 'No documents yet'}
                </p>
              ) : (
                <div className="space-y-2">
                  {clientDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <File className="w-8 h-8 text-purple-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{doc.originalName}</p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(doc.size)} • {format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={getDocumentDownloadUrl(doc.id)}
                          download={doc.originalName}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('download') || 'Download'}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('deleteDocument') || 'Delete Document'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsDocumentModalOpen(false)}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
              >
                {t('done') || 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientModal;
