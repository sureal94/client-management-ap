import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { readData } from '../utils/storage.js';
import {
  getImportHistory,
  getImportLogById,
  deleteImportLog,
  clearImportHistory,
  addImportLog
} from '../utils/storage.js';

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

export const importHistoryRouter = express.Router();

// Get all import history (Admin only)
importHistoryRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdmin(req.userId);
    if (!admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const history = await getImportHistory();
    // Sort by date descending (most recent first)
    const sorted = history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single import log by ID (Admin only)
importHistoryRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdmin(req.userId);
    if (!admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const log = await getImportLogById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Import log not found' });
    }
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete single import log (Admin only)
importHistoryRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdmin(req.userId);
    if (!admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await deleteImportLog(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all import history (Admin only)
importHistoryRouter.delete('/', authenticateToken, async (req, res) => {
  try {
    const admin = await isAdmin(req.userId);
    if (!admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await clearImportHistory();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export the addImportLog function for use in other routes
export { addImportLog };

