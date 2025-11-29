import { useState, useEffect } from 'react';
import ProductTable from '../components/ProductTable';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

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
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
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
        // Remove from state immediately
        setProducts(products.filter(p => p.id !== id));
        // Show success message
        alert(isAdmin ? `Product "${productName}" deleted successfully.` : 'Product deleted successfully.');
      } catch (error) {
        console.error('Error deleting product:', error);
        const errorMessage = error.message || 'Failed to delete product';
        alert(`Failed to delete product: ${errorMessage}`);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <ProductTable
      products={products}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default ProductsPage;

