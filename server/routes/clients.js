import express from 'express';
import { getClients, saveClients, readData, addImportLog } from '../utils/storage.js';
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
    
    // Ensure reminders have userId
    const updatedReminders = (req.body.reminders || []).map(r => ({
      ...r,
      userId: r.userId || req.userId, // Ensure userId is set
      createdAt: r.createdAt || new Date().toISOString()
    }));
    
    // Ensure comments have userId
    const updatedComments = (req.body.comments || []).map(c => ({
      ...c,
      userId: c.userId || req.userId, // Ensure userId is set
      createdAt: c.createdAt || new Date().toISOString()
    }));
    
    clients[index] = {
      ...clients[index],
      ...req.body,
      id: req.params.id,
      userId: admin ? (req.body.userId || clients[index].userId) : req.userId, // Admin can change, user cannot
      reminders: updatedReminders,
      comments: updatedComments,
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
    
    // Verify deletion by reading back
    const verifyClients = await getClients();
    const stillExists = verifyClients.find(c => c.id === req.params.id);
    if (stillExists) {
      console.error('ERROR: Client still exists after deletion! Retrying...');
      await saveClients(filtered); // Retry save
    }
    
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: error.message || 'Failed to delete client' });
  }
});

// Bulk delete clients
clientsRouter.post('/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Client IDs array is required' });
    }
    
    const clients = await getClients();
    const admin = await isAdmin(req.userId);
    
    // Filter: admin can delete any, users can only delete their own
    const clientsToDelete = clients.filter(c => {
      if (!ids.includes(c.id)) return false;
      if (admin) return true;
      return c.userId === req.userId;
    });
    
    const deletedIds = clientsToDelete.map(c => c.id);
    const filtered = clients.filter(c => !deletedIds.includes(c.id));
    
    await saveClients(filtered);
    
    // Verify deletion
    const verifyClients = await getClients();
    const stillExist = verifyClients.filter(c => deletedIds.includes(c.id));
    if (stillExist.length > 0) {
      console.error('ERROR: Some clients still exist after bulk deletion! Retrying...');
      await saveClients(filtered); // Retry save
    }
    
    res.json({ 
      success: true, 
      message: `${deletedIds.length} client(s) deleted successfully`,
      deletedCount: deletedIds.length
    });
  } catch (error) {
    console.error('Error bulk deleting clients:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk delete clients' });
  }
});

// Bulk import clients
clientsRouter.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { clients: newClients, assignToUserId, fileName, fileSize, fileType } = req.body;
    const existingClients = await getClients();
    const admin = await isAdmin(req.userId);
    
    // Get admin user info for logging
    const data = await readData();
    const users = data.users || [];
    const adminUser = users.find(u => u.id === req.userId);
    const importedBy = adminUser ? (adminUser.name || adminUser.email || 'Admin') : 'Admin';
    
    const importId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const errors = [];
    const successful = [];
    
    const imported = newClients.map((c, index) => {
      try {
        const clientId = Date.now().toString() + Math.random().toString(36).substr(2, 9) + index;
        const userId = assignToUserId || req.userId; // Use assigned user or current user
        
        const client = {
          id: clientId,
          userId: userId,
          name: c.name || '',
          pc: c.pc || '',
          phone: c.phone || '',
          email: c.email || '',
          comments: (c.comments || []).map(comment => ({
            ...comment,
            userId: userId,
            createdAt: comment.createdAt || new Date().toISOString()
          })),
          reminders: (c.reminders || []).map(reminder => ({
            ...reminder,
            userId: userId,
            createdAt: reminder.createdAt || new Date().toISOString()
          })),
          productIds: c.productIds || [],
          lastContacted: c.lastContacted || new Date().toISOString().split('T')[0],
        };
        
        successful.push({ row: index + 1, data: c });
        return client;
      } catch (err) {
        errors.push({
          row: index + 1,
          data: c,
          error: err.message || 'Unknown error'
        });
        return null;
      }
    }).filter(Boolean);
    
    const updated = [...existingClients, ...imported];
    await saveClients(updated);
    
    // Log import history
    if (admin) {
      const assignedUser = assignToUserId ? users.find(u => u.id === assignToUserId) : null;
      await addImportLog({
        id: importId,
        type: 'clients',
        importedBy: importedBy,
        importedById: req.userId,
        assignedUserId: assignToUserId || null,
        assignedUserName: assignedUser ? (assignedUser.name || assignedUser.email) : null,
        fileName: fileName || 'Unknown',
        fileSize: fileSize || 0,
        fileType: fileType || 'unknown',
        totalRows: newClients.length,
        successfulCount: successful.length,
        failedCount: errors.length,
        status: errors.length === 0 ? 'success' : (successful.length > 0 ? 'partial' : 'error'),
        createdAt: new Date().toISOString(),
        errors: errors,
        successful: successful.slice(0, 100) // Limit to first 100 for storage
      });
    }
    
    res.json({ 
      success: true, 
      count: imported.length,
      importId: admin ? importId : null,
      errors: errors.length,
      successful: successful.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


