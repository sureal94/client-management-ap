import { useState, useEffect } from 'react';
import ProductTable from '../components/ProductTable';
import { fetchProducts, createProduct, updateProduct, deleteProduct, bulkDeleteProducts, assignProductToUser, getAdminUsers } from '../services/api';
import AssignToUserModal from '../components/AssignToUserModal';
import { useI18n } from '../i18n/I18nContext';

const ProductsPage = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedProductForAssign, setSelectedProductForAssign] = useState(null);
  const [usersMap, setUsersMap] = useState(new Map());
  
  // Check if we're in admin mode
  const isAdmin = window.location.pathname.startsWith('/admin');

  useEffect(() => {
    loadProducts();
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (productData) => {
    try {
      const newProduct = await createProduct(productData);
      setProducts([...products, newProduct]); // Count updates automatically
    } catch (error) {
      console.error('Error adding product:', error);
      const errorMessage = error.message || 'Failed to add product';
      if (errorMessage.includes('not running') || errorMessage.includes('Failed to fetch')) {
        alert(`Backend server is not running!\n\nPlease make sure the backend server is started on port 5000.\n\nRun: cd server && npm run dev`);
      } else {
        alert(`Failed to add product: ${errorMessage}`);
      }
    }
  };

  const handleEdit = async (id, productData) => {
    try {
      const updatedProduct = await updateProduct(id, productData);
      setProducts(products.map(p => p.id === id ? updatedProduct : p));
      // Show success message
      alert('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error.message || 'Failed to update product';
      if (errorMessage.includes('not running') || errorMessage.includes('Failed to fetch')) {
        alert(`Backend server is not running!\n\nPlease make sure the backend server is started on port 5000.\n\nRun: cd server && npm run dev`);
      } else if (errorMessage.includes('Access denied') || errorMessage.includes('403')) {
        alert('Access denied. You do not have permission to update this product.');
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        alert('Product not found. Please refresh the page and try again.');
      } else {
        alert(`Failed to update product: ${errorMessage}`);
      }
    }
  };

  const handleDelete = async (id) => {
    const product = products.find(p => p.id === id);
    const productName = product?.nameEn || product?.name || 'this product';
    const isAdmin = window.location.pathname.startsWith('/admin');
    const confirmMessage = isAdmin
      ? `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      : `Are you sure you want to delete "${productName}"?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteProduct(id);
        // Reload from server to ensure persistence
        await loadProducts();
        // Show success message
        alert(isAdmin ? `Product "${productName}" deleted successfully.` : 'Product deleted successfully.');
      } catch (error) {
        console.error('Error deleting product:', error);
        const errorMessage = error.message || 'Failed to delete product';
        alert(`Failed to delete product: ${errorMessage}`);
        // Reload anyway to sync state
        await loadProducts();
      }
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!ids || ids.length === 0) {
      alert('Please select at least one product to delete.');
      return;
    }
    
    const isAdmin = window.location.pathname.startsWith('/admin');
    const confirmMessage = isAdmin
      ? `Are you sure you want to delete ${ids.length} selected product(s)? This action cannot be undone.`
      : `Are you sure you want to delete ${ids.length} selected product(s)?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const result = await bulkDeleteProducts(ids);
        // Reload from server to ensure persistence
        await loadProducts();
        // Show success message
        alert(isAdmin 
          ? `${result.deletedCount || ids.length} product(s) deleted successfully.` 
          : `${result.deletedCount || ids.length} product(s) deleted successfully.`);
      } catch (error) {
        console.error('Error bulk deleting products:', error);
        const errorMessage = error.message || 'Failed to delete products';
        alert(`Failed to delete products: ${errorMessage}`);
        // Reload anyway to sync state
        await loadProducts();
      }
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const usersData = await getAdminUsers(token);
      // Create a map for quick lookup: userId -> fullName
      const map = new Map();
      usersData.forEach(user => {
        map.set(user.id, user.fullName || user.email || 'Unknown User');
      });
      setUsersMap(map);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAssignProduct = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Admin token not found. Please log in again.');
        return;
      }
      await assignProductToUser(token, selectedProductForAssign.id, userId);
      alert(t('productAssignedSuccess') || 'Product assigned successfully');
      // Reload data to get updated userId
      await loadProducts();
      // Reload users to ensure we have the latest user info
      await loadUsers();
    } catch (error) {
      console.error('Error assigning product:', error);
      alert('Failed to assign product: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <>
      <ProductTable
        products={products}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onAssign={isAdmin ? (product) => {
          setSelectedProductForAssign(product);
          setAssignModalOpen(true);
        } : undefined}
        usersMap={isAdmin ? usersMap : undefined}
        isAdmin={isAdmin}
      />
      {isAdmin && (
        <AssignToUserModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedProductForAssign(null);
          }}
          onAssign={handleAssignProduct}
          title={t('assignProductToUser') || 'Assign Product to User'}
          itemName={selectedProductForAssign?.nameEn || selectedProductForAssign?.name}
        />
      )}
    </>
  );
};

export default ProductsPage;

