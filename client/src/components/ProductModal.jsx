import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { X, Trash2 } from 'lucide-react';

const ProductModal = ({ product, onSave, onClose, onDelete }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    nameEn: '',
    nameHe: '',
    code: '',
    price: '',
    discount: '',
    discountType: 'percent',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        nameEn: product.nameEn || product.name || '',
        nameHe: product.nameHe || '',
        code: product.code || '',
        price: product.price || '',
        discount: product.discount || '',
        discountType: product.discountType || 'percent',
      });
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: parseFloat(formData.price),
      discount: parseFloat(formData.discount) || 0,
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">
            {product ? t('editProduct') : t('addProduct')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('productNameEn')}
            </label>
            <input
              type="text"
              name="nameEn"
              value={formData.nameEn}
              onChange={handleChange}
              required
              dir="ltr"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('productNameHe')}
            </label>
            <input
              type="text"
              name="nameHe"
              value={formData.nameHe}
              onChange={handleChange}
              required
              dir="rtl"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('productCode')}
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('price')}
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('discount')}
            </label>
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              min="0"
              step="0.01"
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
          {product && onDelete && (
            <div className="pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this item?')) {
                    onDelete(product.id);
                    onClose();
                  }
                }}
                className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center gap-2 border border-red-200"
              >
                <Trash2 className="w-5 h-5" />
                {t('deleteProduct')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProductModal;



