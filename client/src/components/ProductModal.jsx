import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { X, Trash2, AlertCircle } from 'lucide-react';

const ProductModal = ({ product, products = [], onSave, onClose, onDelete }) => {
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

  // Check if at least one name is provided
  const hasAtLeastOneName = formData.nameEn.trim() || formData.nameHe.trim();
  const nameRequiredError = !hasAtLeastOneName ? (t('atLeastOneNameRequired') || 'Please fill out at least one product name.') : null;

  // Check for duplicates (case-insensitive, trimmed)
  const duplicateErrors = useMemo(() => {
    const errors = {};
    const currentId = product?.id;
    
    const nameEnTrimmed = formData.nameEn.trim().toLowerCase();
    const nameHeTrimmed = formData.nameHe.trim().toLowerCase();
    const codeTrimmed = formData.code.trim().toLowerCase();

    if (nameEnTrimmed) {
      const duplicateName = products.find(p => 
        p.id !== currentId && 
        ((p.nameEn || p.name || '').trim().toLowerCase() === nameEnTrimmed)
      );
      if (duplicateName) {
        errors.nameEn = t('productNameExists') || 'Product name already exists';
      }
    }

    if (nameHeTrimmed) {
      const duplicateNameHe = products.find(p => 
        p.id !== currentId && 
        (p.nameHe || '').trim().toLowerCase() === nameHeTrimmed
      );
      if (duplicateNameHe) {
        errors.nameHe = t('productNameExists') || 'Product name already exists';
      }
    }

    if (codeTrimmed) {
      const duplicateCode = products.find(p => 
        p.id !== currentId && 
        (p.code || '').trim().toLowerCase() === codeTrimmed
      );
      if (duplicateCode) {
        errors.code = t('productCodeExists') || 'Product code already exists';
      }
    }

    return errors;
  }, [formData.nameEn, formData.nameHe, formData.code, products, product, t]);

  const hasErrors = Object.keys(duplicateErrors).length > 0 || nameRequiredError;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasErrors) {
      return;
    }
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
          {/* Name Required Error - shown when both names are empty */}
          {nameRequiredError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {nameRequiredError}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('productNameEn')}
            </label>
            <input
              type="text"
              name="nameEn"
              value={formData.nameEn}
              onChange={handleChange}
              dir="ltr"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                duplicateErrors.nameEn || (nameRequiredError && !formData.nameHe.trim()) ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {duplicateErrors.nameEn && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {duplicateErrors.nameEn}
              </p>
            )}
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
              dir="rtl"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                duplicateErrors.nameHe || (nameRequiredError && !formData.nameEn.trim()) ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {duplicateErrors.nameHe && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {duplicateErrors.nameHe}
              </p>
            )}
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
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                duplicateErrors.code ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {duplicateErrors.code && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {duplicateErrors.code}
              </p>
            )}
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
