import express from 'express';
import { getProducts, saveProducts } from '../utils/storage.js';
import { calculateFinalPrice } from '../utils/calculations.js';

export const productsRouter = express.Router();

// Get all products
productsRouter.get('/', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
productsRouter.get('/:id', async (req, res) => {
  try {
    const products = await getProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
productsRouter.post('/', async (req, res) => {
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
productsRouter.put('/:id', async (req, res) => {
  try {
    const products = await getProducts();
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    products[index] = {
      ...products[index],
      ...req.body,
      id: req.params.id,
      price: parseFloat(req.body.price),
      discount: parseFloat(req.body.discount) || 0,
    };
    await saveProducts(products);
    res.json(products[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
productsRouter.delete('/:id', async (req, res) => {
  try {
    const products = await getProducts();
    const filtered = products.filter(p => p.id !== req.params.id);
    await saveProducts(filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import products
productsRouter.post('/bulk', async (req, res) => {
  try {
    const { products: newProducts } = req.body;
    const existingProducts = await getProducts();
    const imported = newProducts.map(p => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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

