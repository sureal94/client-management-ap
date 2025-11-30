import express from 'express';
import { getProducts, saveProducts, readData } from '../utils/storage.js';
import { calculateFinalPrice } from '../utils/calculations.js';
import { authenticateToken } from '../middleware/auth.js';

export const productsRouter = express.Router();

// Helper to check if user is admin
const isAdmin = async (userId) => {
  try {
    const data = await readData();
    const users = data.users || [];
    const user = users.find(u => u.id === userId);
    return user && user.role === 'admin';
  } catch {
    return false;
  }
};

// Get all products (filtered by userId unless admin)
productsRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const products = await getProducts();
    const admin = await isAdmin(req.userId);
    
    // Admin sees all products, regular users see ONLY their own (strict filtering)
    const filteredProducts = admin 
      ? products 
      : products.filter(p => p.userId === req.userId); // STRICT: Only items with matching userId
    
    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
productsRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const products = await getProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if user has access (admin or owner) - STRICT
    const admin = await isAdmin(req.userId);
    if (!admin) {
      // Regular users can only access their own products
      if (!product.userId || product.userId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
productsRouter.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('\n=== CREATE PRODUCT REQUEST ===');
    console.log('Received product data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if ((!req.body.nameEn && !req.body.name) || !req.body.code) {
      console.log('Validation failed: Missing name or code');
      return res.status(400).json({ 
        error: 'Name and code are required fields' 
      });
    }

    if (!req.body.price || isNaN(parseFloat(req.body.price))) {
      console.log('Validation failed: Invalid price');
      return res.status(400).json({ 
        error: 'Price must be a valid number' 
      });
    }

    console.log('Validation passed, fetching products...');
    const products = await getProducts();
    console.log('Current products count:', products.length);
    
    const newProduct = {
      id: Date.now().toString(),
      userId: req.userId, // Assign to current user
      nameEn: String(req.body.nameEn || req.body.name || '').trim(),
      nameHe: String(req.body.nameHe || '').trim(),
      code: String(req.body.code).trim(),
      price: parseFloat(req.body.price),
      discount: parseFloat(req.body.discount) || 0,
      discountType: req.body.discountType || 'percent',
    };

    console.log('New product object:', JSON.stringify(newProduct, null, 2));

    products.push(newProduct);
    console.log('Product added to array, saving...');
    
    await saveProducts(products);
    console.log('✓ Product saved successfully!');
    console.log('===============================\n');
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('\n✗ ERROR CREATING PRODUCT ✗');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('===============================\n');
    
    res.status(500).json({ 
      error: error.message || 'Failed to create product'
    });
  }
});

// Update product
productsRouter.put('/:id', authenticateToken, async (req, res) => {
  try {
    const products = await getProducts();
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if user has access (admin or owner) - STRICT
    const admin = await isAdmin(req.userId);
    if (!admin) {
      // Regular users can only update their own products
      if (!products[index].userId || products[index].userId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    products[index] = {
      ...products[index],
      ...req.body,
      id: req.params.id,
      price: parseFloat(req.body.price),
      discount: parseFloat(req.body.discount) || 0,
      userId: admin ? (req.body.userId || products[index].userId) : req.userId, // Admin can change, user cannot
    };
    await saveProducts(products);
    res.json(products[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
productsRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const products = await getProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if user has access (admin or owner) - STRICT
    const admin = await isAdmin(req.userId);
    if (!admin) {
      // Regular users can only delete their own products
      if (!product.userId || product.userId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Admin can delete any product, regular users can only delete their own
    const filtered = products.filter(p => p.id !== req.params.id);
    await saveProducts(filtered);
    
    // Verify deletion by reading back
    const verifyProducts = await getProducts();
    const stillExists = verifyProducts.find(p => p.id === req.params.id);
    if (stillExists) {
      console.error('ERROR: Product still exists after deletion! Retrying...');
      await saveProducts(filtered); // Retry save
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message || 'Failed to delete product' });
  }
});

// Bulk delete products
productsRouter.post('/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Product IDs array is required' });
    }
    
    const products = await getProducts();
    const admin = await isAdmin(req.userId);
    
    // Filter: admin can delete any, users can only delete their own
    const productsToDelete = products.filter(p => {
      if (!ids.includes(p.id)) return false;
      if (admin) return true;
      return p.userId === req.userId;
    });
    
    const deletedIds = productsToDelete.map(p => p.id);
    const filtered = products.filter(p => !deletedIds.includes(p.id));
    
    await saveProducts(filtered);
    
    // Verify deletion
    const verifyProducts = await getProducts();
    const stillExist = verifyProducts.filter(p => deletedIds.includes(p.id));
    if (stillExist.length > 0) {
      console.error('ERROR: Some products still exist after bulk deletion! Retrying...');
      await saveProducts(filtered); // Retry save
    }
    
    res.json({ 
      success: true, 
      message: `${deletedIds.length} product(s) deleted successfully`,
      deletedCount: deletedIds.length
    });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk delete products' });
  }
});

// Bulk import products
productsRouter.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { products: newProducts } = req.body;
    const existingProducts = await getProducts();
    const imported = newProducts.map(p => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: req.userId, // Assign to current user
      nameEn: p.nameEn || p.name || '',
      nameHe: p.nameHe || '',
      code: p.code,
      price: parseFloat(p.price) || 0,
      discount: parseFloat(p.discount) || 0,
      discountType: p.discountType || 'percent',
    }));
    const updated = [...existingProducts, ...imported];
    await saveProducts(updated);
    res.json({ success: true, count: imported.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

