import express from 'express';
import { getClients, saveClients, readData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';

export const clientsRouter = express.Router();

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

// Get all clients (filtered by userId unless admin)
clientsRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const clients = await getClients();
    const admin = await isAdmin(req.userId);
    
    // Admin sees all clients, regular users see ONLY their own (strict filtering)
    const filteredClients = admin 
      ? clients  // Admin sees ALL clients
      : clients.filter(c => c.userId === req.userId); // STRICT: Only items with matching userId
    
    res.json(filteredClients || []);
  } catch (error) {
    console.error('Error fetching clients:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to load clients' });
  }
});

// Get single client
clientsRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const clients = await getClients();
    const client = clients.find(c => c.id === req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Check if user has access (admin or owner) - STRICT
    const admin = await isAdmin(req.userId);
    if (!admin) {
      // Regular users can only access their own clients
      if (!client.userId || client.userId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create client
clientsRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const clients = await getClients();
    const newClient = {
      id: Date.now().toString(),
      userId: req.userId, // REQUIRED: Assign to current user
      name: req.body.name || '',
      pc: req.body.pc || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      comments: (req.body.comments || []).map(c => ({
        ...c,
        userId: req.userId, // Track ownership of comments
        createdAt: c.createdAt || new Date().toISOString()
      })),
      reminders: (req.body.reminders || []).map(r => ({
        ...r,
        userId: req.userId, // Track ownership of reminders
        createdAt: r.createdAt || new Date().toISOString()
      })),
      productIds: req.body.productIds || [],
      lastContacted: req.body.lastContacted || new Date().toISOString(),
    };
    clients.push(newClient);
    await saveClients(clients);
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
clientsRouter.put('/:id', authenticateToken, async (req, res) => {
  try {
    const clients = await getClients();
    const index = clients.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Check if user has access (admin or owner) - STRICT
    const admin = await isAdmin(req.userId);
    if (!admin) {
      // Regular users can only update their own clients
      if (!clients[index].userId || clients[index].userId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    clients[index] = {
      ...clients[index],
      ...req.body,
      id: req.params.id,
      userId: admin ? (req.body.userId || clients[index].userId) : req.userId, // Admin can change, user cannot
    };
    await saveClients(clients);
    res.json(clients[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete client
clientsRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const clients = await getClients();
    const client = clients.find(c => c.id === req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Check if user has access (admin or owner) - STRICT
    const admin = await isAdmin(req.userId);
    if (!admin) {
      // Regular users can only delete their own clients
      if (!client.userId || client.userId !== req.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // Admin can delete any client, regular users can only delete their own
    const filtered = clients.filter(c => c.id !== req.params.id);
    await saveClients(filtered);
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: error.message || 'Failed to delete client' });
  }
});

// Bulk import clients
clientsRouter.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { clients: newClients } = req.body;
    const existingClients = await getClients();
    const imported = newClients.map(c => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: req.userId, // Assign to current user
      name: c.name || '',
      pc: c.pc || '',
      phone: c.phone || '',
      email: c.email || '',
      comments: (c.comments || []).map(comment => ({
        ...comment,
        userId: req.userId, // Track ownership
        createdAt: comment.createdAt || new Date().toISOString()
      })),
      reminders: (c.reminders || []).map(reminder => ({
        ...reminder,
        userId: req.userId, // Track ownership
        createdAt: reminder.createdAt || new Date().toISOString()
      })),
      productIds: c.productIds || [],
      lastContacted: c.lastContacted || new Date().toISOString().split('T')[0],
    }));
    const updated = [...existingClients, ...imported];
    await saveClients(updated);
    res.json({ success: true, count: imported.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


