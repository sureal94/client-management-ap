import { useState, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { Edit, Plus, Download, Search, ChevronRight } from 'lucide-react';
import { calculateFinalPrice } from '../utils/calculations';
import ProductModal from './ProductModal';
import Fuse from 'fuse.js';
import * as XLSX from 'xlsx';

const ProductTable = ({ products, onAdd, onEdit, onDelete }) => {
  const { t, language } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ['nameEn', 'nameHe', 'name', 'code'],
      threshold: 0.3,
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Apply search
    if (searchTerm) {
      const searchResults = fuse.search(searchTerm);
      result = searchResults.map(item => item.item);
    }

    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'finalPrice') {
          aVal = calculateFinalPrice(a.price, a.discount, a.discountType);
          bVal = calculateFinalPrice(b.price, b.discount, b.discountType);
        }

        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return result;
  }, [products, searchTerm, sortConfig, fuse, language]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleSave = (productData) => {
    if (editingProduct) {
      onEdit(editingProduct.id, productData);
    } else {
      onAdd(productData);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleExport = (format) => {
    const data = filteredProducts.map(p => ({
      [t('productNameEn')]: p.nameEn || p.name,
      [t('productNameHe')]: p.nameHe || '',
      [t('productCode')]: p.code,
      [t('price')]: p.price,
      [t('discount')]: p.discount,
      [t('finalPrice')]: calculateFinalPrice(p.price, p.discount, p.discountType).toFixed(2),
    }));

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');
      // Add UTF-8 BOM for Hebrew/Unicode support in Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products.${format}`;
      a.click();
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, `products.${format}`, { bookType: 'xlsx', type: 'binary' });
    }
  };

  const getDisplayName = (product) => {
    return language === 'he' 
      ? (product.nameHe || product.nameEn || product.name) 
      : (product.nameEn || product.name);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-black">{t('products')}</h2>
            <span 
              className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold"
              title={t('totalProducts') || `You have ${products.length} products`}
            >
              {products.length}
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleAdd}
              className="flex-1 sm:flex-none bg-primary text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden xs:inline">{t('addProduct')}</span>
              <span className="xs:hidden">{t('add')}</span>
            </button>
            <div className="relative group">
              <button className="bg-black text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 text-sm sm:text-base">
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">{t('export')}</span>
              </button>
              <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-sm"
                >
                  {t('exportAsCSV')}
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-sm"
                >
                  {t('exportAsXLSX')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              placeholder={t('searchProducts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent rtl:pr-10 rtl:pl-4 text-base"
            />
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {t('noProducts')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType);
              const displayName = getDisplayName(product);
              return (
                <div
                  key={product.id}
                  className="p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                  onClick={() => handleEdit(product)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {displayName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('productCode')}: {product.code}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">
                          {t('price')}: ₪{product.price.toFixed(2)}
                        </span>
                        {product.discount > 0 && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-lg font-bold text-primary">
                        ₪{finalPrice.toFixed(2)}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-center text-sm font-bold text-black cursor-pointer hover:bg-gray-100"
              >
                {t('productName')}
                {sortConfig.key === 'name' && (
                  <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('code')}
                className="px-6 py-3 text-center text-sm font-bold text-black cursor-pointer hover:bg-gray-100"
              >
                {t('productCode')}
                {sortConfig.key === 'code' && (
                  <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('price')}
                className="px-6 py-3 text-center text-sm font-bold text-black cursor-pointer hover:bg-gray-100"
              >
                {t('price')}
                {sortConfig.key === 'price' && (
                  <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-center text-sm font-bold text-black">
                {t('discount')}
              </th>
              <th
                onClick={() => handleSort('finalPrice')}
                className="px-6 py-3 text-center text-sm font-bold text-black cursor-pointer hover:bg-gray-100"
              >
                {t('finalPrice')}
                {sortConfig.key === 'finalPrice' && (
                  <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-center text-sm font-bold text-black">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {t('noProducts')}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const finalPrice = calculateFinalPrice(product.price, product.discount, product.discountType);
                const displayName = getDisplayName(product);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {displayName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₪{product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.discount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                      ₪{finalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-primary hover:text-orange-600 p-2"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          products={products}
          onSave={handleSave}
          onDelete={onDelete}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductTable;
