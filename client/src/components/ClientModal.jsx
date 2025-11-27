import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { X, Trash2, Plus, Check } from 'lucide-react';
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
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

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
    </div>
  );
};

export default ClientModal;
