import { useState, useMemo, useEffect, useRef } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Check, X, Edit2, AlertTriangle, SkipForward } from 'lucide-react';

const ImportPreview = ({ 
  data, 
  mapping, 
  onMappingChange, 
  onDataCorrection, 
  onImport, 
  onCancel, 
  loading, 
  importType = 'products',
  existingProducts = [],
  existingClients = []
}) => {
  const { t } = useI18n();
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [skippedRows, setSkippedRows] = useState(new Set());
  const prevDataLengthRef = useRef(data?.length);

  // Bug fix: Reset skippedRows when data length changes (row deleted)
  // This prevents stale indices from causing wrong rows to be skipped
  useEffect(() => {
    if (data && prevDataLengthRef.current !== data.length) {
      setSkippedRows(new Set());
      prevDataLengthRef.current = data.length;
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data to preview
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});
  
  // Different mapping fields based on import type
  const productFields = ['name', 'code', 'price', 'discount'];
  const clientFields = ['name', 'pc', 'phone', 'email', 'notes', 'lastContacted'];
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

  // Check for duplicates in import data against existing data
  const duplicateInfo = useMemo(() => {
    const duplicates = {};
    
    data.forEach((row, index) => {
      const errors = [];
      
      if (importType === 'products') {
        const nameCol = mapping.name;
        const codeCol = mapping.code;
        const rowName = (row[nameCol] || '').trim().toLowerCase();
        const rowCode = (row[codeCol] || '').trim().toLowerCase();
        
        // Check against existing products
        if (rowName) {
          const existingName = existingProducts.find(p => 
            ((p.nameEn || p.name || '').trim().toLowerCase() === rowName) ||
            ((p.nameHe || '').trim().toLowerCase() === rowName)
          );
          if (existingName) {
            errors.push(t('productNameExists') || 'Product name already exists');
          }
        }
        
        if (rowCode) {
          const existingCode = existingProducts.find(p => 
            (p.code || '').trim().toLowerCase() === rowCode
          );
          if (existingCode) {
            errors.push(t('productCodeExists') || 'Product code already exists');
          }
        }
        
        // Check for duplicates within import data
        // Bug fix: Use flags to only add each error type once, not once per matching row
        let hasDuplicateName = false;
        let hasDuplicateCode = false;
        for (let i = 0; i < index; i++) {
          const otherRow = data[i];
          const otherName = (otherRow[nameCol] || '').trim().toLowerCase();
          const otherCode = (otherRow[codeCol] || '').trim().toLowerCase();
          
          if (rowName && rowName === otherName && !hasDuplicateName) {
            errors.push(t('duplicateInFile') || 'Duplicate name in import file');
            hasDuplicateName = true;
          }
          if (rowCode && rowCode === otherCode && !hasDuplicateCode) {
            errors.push(t('duplicateCodeInFile') || 'Duplicate code in import file');
            hasDuplicateCode = true;
          }
          // Early exit if both duplicates found
          if (hasDuplicateName && hasDuplicateCode) break;
        }
      } else {
        // Clients
        const nameCol = mapping.name;
        const phoneCol = mapping.phone;
        const rowName = (row[nameCol] || '').trim().toLowerCase();
        const rowPhone = (row[phoneCol] || '').trim();
        
        // Check against existing clients
        if (rowName) {
          const existingName = existingClients.find(c => 
            (c.name || '').trim().toLowerCase() === rowName
          );
          if (existingName) {
            errors.push(t('clientNameExists') || 'Client name already exists');
          }
        }
        
        if (rowPhone) {
          const existingPhone = existingClients.find(c => 
            (c.phone || '').trim() === rowPhone
          );
          if (existingPhone) {
            errors.push(t('phoneExists') || 'Phone number already exists');
          }
        }
        
        // Check for duplicates within import data
        // Bug fix: Use flags to only add each error type once, not once per matching row
        let hasDuplicateName = false;
        let hasDuplicatePhone = false;
        for (let i = 0; i < index; i++) {
          const otherRow = data[i];
          const otherName = (otherRow[nameCol] || '').trim().toLowerCase();
          const otherPhone = (otherRow[phoneCol] || '').trim();
          
          if (rowName && rowName === otherName && !hasDuplicateName) {
            errors.push(t('duplicateInFile') || 'Duplicate name in import file');
            hasDuplicateName = true;
          }
          if (rowPhone && rowPhone === otherPhone && !hasDuplicatePhone) {
            errors.push(t('duplicatePhoneInFile') || 'Duplicate phone in import file');
            hasDuplicatePhone = true;
          }
          // Early exit if both duplicates found
          if (hasDuplicateName && hasDuplicatePhone) break;
        }
      }
      
      if (errors.length > 0) {
        duplicates[index] = errors;
      }
    });
    
    return duplicates;
  }, [data, mapping, importType, existingProducts, existingClients, t]);

  const duplicateCount = Object.keys(duplicateInfo).length;
  const hasAnyDuplicates = duplicateCount > 0;

  // Check if required fields are mapped
  const isImportDisabled = () => {
    if (importType === 'products') {
      return !mapping.name || !mapping.code;
    } else {
      return !mapping.name;
    }
  };

  const toggleSkipRow = (index) => {
    const newSkipped = new Set(skippedRows);
    if (newSkipped.has(index)) {
      newSkipped.delete(index);
    } else {
      newSkipped.add(index);
    }
    setSkippedRows(newSkipped);
  };

  const skipAllDuplicates = () => {
    const newSkipped = new Set(skippedRows);
    Object.keys(duplicateInfo).forEach(index => {
      newSkipped.add(parseInt(index));
    });
    setSkippedRows(newSkipped);
  };

  const handleImportWithSkips = () => {
    // Filter out skipped rows before importing
    const filteredData = data.filter((_, index) => !skippedRows.has(index));
    onImport(filteredData);
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

      {/* Duplicate Warning Banner */}
      {hasAnyDuplicates && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800">
                {t('duplicatesFound') || 'Duplicates Found'} ({duplicateCount})
              </h4>
              <p className="text-sm text-red-600 mt-1">
                {t('duplicatesDescription') || 'Some rows contain duplicate data. You can edit, skip, or remove them before importing.'}
              </p>
              <button
                onClick={skipAllDuplicates}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 flex items-center gap-1"
              >
                <SkipForward className="w-4 h-4" />
                {t('skipAllDuplicates') || 'Skip all duplicates'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-black mb-4">{t('previewData')}</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  #
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {t('status') || 'Status'}
                </th>
                {columns.map(col => (
                  <th key={col} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 20).map((row, rowIndex) => {
                const isDuplicate = duplicateInfo[rowIndex];
                const isSkipped = skippedRows.has(rowIndex);
                
                return (
                  <tr 
                    key={rowIndex} 
                    className={`
                      ${isDuplicate && !isSkipped ? 'bg-red-50' : ''}
                      ${isSkipped ? 'bg-gray-100 opacity-50' : ''}
                      hover:bg-gray-50
                    `}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">{rowIndex + 1}</td>
                    <td className="px-4 py-3 text-sm">
                      {isDuplicate ? (
                        <div className="relative group">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            isSkipped 
                              ? 'bg-gray-200 text-gray-600' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            <AlertTriangle className="w-3 h-3" />
                            {isSkipped ? (t('skipped') || 'Skipped') : (t('duplicate') || 'Duplicate')}
                          </span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                            <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                              {isDuplicate.map((err, i) => (
                                <div key={i}>{err}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          <Check className="w-3 h-3" />
                          {t('valid') || 'Valid'}
                        </span>
                      )}
                    </td>
                    {columns.map((col) => (
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
                            <span className={isSkipped ? 'line-through' : ''}>{row[col] || '-'}</span>
                            {!isSkipped && (
                              <button
                                onClick={() => startEdit(rowIndex, col)}
                                className="opacity-0 group-hover:opacity-100 text-primary hover:text-orange-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {isDuplicate && (
                          <button
                            onClick={() => toggleSkipRow(rowIndex)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              isSkipped 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                            title={isSkipped ? (t('include') || 'Include') : (t('skip') || 'Skip')}
                          >
                            {isSkipped ? (t('include') || 'Include') : (t('skip') || 'Skip')}
                          </button>
                        )}
                        <button
                          onClick={() => onDataCorrection(rowIndex, '__delete', null)}
                          className="text-red-600 hover:text-red-800"
                          title={t('delete') || 'Delete'}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.length > 20 && (
            <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
              Showing first 20 of {data.length} rows
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 rtl:flex-row-reverse items-center">
        <button
          onClick={handleImportWithSkips}
          disabled={loading || isImportDisabled()}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          {loading ? 'Importing...' : `${t('importData')} (${data.length - skippedRows.size})`}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        {skippedRows.size > 0 && (
          <span className="text-sm text-gray-500">
            {skippedRows.size} {t('rowsSkipped') || 'rows will be skipped'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ImportPreview;
