import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Check, X, Edit2 } from 'lucide-react';

const ImportPreview = ({ data, mapping, onMappingChange, onDataCorrection, onImport, onCancel, loading, importType = 'products' }) => {
  const { t } = useI18n();
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data to preview
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});
  
  // Different mapping fields based on import type
  const productFields = ['name', 'code', 'price', 'discount', 'discountType'];
  const clientFields = ['name', 'phone', 'email', 'status', 'notes', 'lastContacted'];
  const mappingFields = importType === 'products' ? productFields : clientFields;

  // Get the translation key for a field
  const getFieldLabel = (field) => {
    if (importType === 'products') {
      if (field === 'name') return 'productName';
      if (field === 'code') return 'productCode';
      return field;
    } else {
      if (field === 'name') return 'clientName';
      return field;
    }
  };

  // Check if required fields are mapped
  const isImportDisabled = () => {
    if (importType === 'products') {
      return !mapping.name || !mapping.code;
    } else {
      return !mapping.name;
    }
  };

  const startEdit = (rowIndex, column) => {
    setEditingCell({ rowIndex, column });
    setEditingValue(data[rowIndex][column] || '');
  };

  const saveEdit = () => {
    if (editingCell) {
      onDataCorrection(editingCell.rowIndex, editingCell.column, editingValue);
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">{t('mappingPreview')}</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          {mappingFields.map(field => (
            <div key={field} className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">
                {t(getFieldLabel(field))}:
              </label>
              <select
                value={mapping[field] || ''}
                onChange={(e) => onMappingChange(field, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Select column...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-black mb-4">{t('previewData')}</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase">
                  #
                </th>
                {columns.map(col => (
                  <th key={col} className="px-4 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase">
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{rowIndex + 1}</td>
                  {columns.map((col, colIndex) => (
                    <td key={col} className="px-4 py-3 text-sm text-gray-900">
                      {editingCell?.rowIndex === rowIndex && editingCell?.column === col ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="flex-1 px-2 py-1 border border-primary rounded"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <button
                            onClick={saveEdit}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span>{row[col] || '-'}</span>
                          <button
                            onClick={() => startEdit(rowIndex, col)}
                            className="opacity-0 group-hover:opacity-100 text-primary hover:text-orange-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onDataCorrection(rowIndex, '__delete', null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
              Showing first 10 of {data.length} rows
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 rtl:flex-row-reverse">
        <button
          onClick={onImport}
          disabled={loading || isImportDisabled()}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          {loading ? 'Importing...' : t('importData')}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
};

export default ImportPreview;
