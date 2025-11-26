import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const ClientModal = ({ client, products, onSave, onClose, onDelete }) => {
  const { t, language } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: '',
    notes: '',
    productIds: [],
    lastContacted: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        status: client.status || '',
        notes: client.notes || '',
        productIds: client.productIds || [],
        lastContacted: client.lastContacted
          ? format(new Date(client.lastContacted), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [client]);

  const handleSubmit = (e) => {
    e.preventDefault();
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('status')}
              </label>
              <input
                type="text"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('lastContacted')}
              </label>
              <input
                type="date"
                name="lastContacted"
                value={formData.lastContacted}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('attachedProducts')}
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
              {products.length === 0 ? (
                <p className="text-gray-500 text-sm">No products available</p>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => {
                    const displayName = language === 'he' 
                      ? (product.nameHe || product.nameEn || product.name) 
                      : (product.nameEn || product.name);
                    return (
                      <label
                        key={product.id}
                        className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.productIds.includes(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">{displayName} ({product.code})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('notes')}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-4 rtl:flex-row-reverse">
            <button
              type="submit"
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium"
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
    </div>
  );
};

export default ClientModal;



