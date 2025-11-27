import express from 'express';
import { getClients, saveClients } from '../utils/storage.js';

export const clientsRouter = express.Router();

// Get all clients
clientsRouter.get('/', async (req, res) => {
  try {
    const clients = await getClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single client
clientsRouter.get('/:id', async (req, res) => {
  try {
    const clients = await getClients();
    const client = clients.find(c => c.id === req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create client
clientsRouter.post('/', async (req, res) => {
  try {
    const clients = await getClients();
    const newClient = {
      id: Date.now().toString(),
      name: req.body.name || '',
      pc: req.body.pc || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      comments: req.body.comments || [],
      reminders: req.body.reminders || [],
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
clientsRouter.put('/:id', async (req, res) => {
  try {
    const clients = await getClients();
    const index = clients.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Client not found' });
    }
    clients[index] = {
      ...clients[index],
      ...req.body,
      id: req.params.id,
    };
    await saveClients(clients);
    res.json(clients[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete client
clientsRouter.delete('/:id', async (req, res) => {
  try {
    const clients = await getClients();
    const filtered = clients.filter(c => c.id !== req.params.id);
    await saveClients(filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import clients
clientsRouter.post('/bulk', async (req, res) => {
  try {
    const { clients: newClients } = req.body;
    const existingClients = await getClients();
    const imported = newClients.map(c => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: c.name || '',
      pc: c.pc || '',
      phone: c.phone || '',
      email: c.email || '',
      comments: c.comments || [],
      reminders: c.reminders || [],
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


