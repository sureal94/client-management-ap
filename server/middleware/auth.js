import jwt from 'jsonwebtoken';
import { readData, writeData } from '../utils/storage.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token and extract userId
export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    // Update lastActive on each authenticated request (activity tracking)
    try {
      const data = await readData();
      const users = data.users || [];
      const user = users.find(u => u.id === decoded.userId);
      if (user) {
        user.lastActive = new Date().toISOString();
        user.isOnline = true; // User is active
        await writeData(data);
      }
    } catch (e) {
      // Ignore errors in activity tracking - don't block the request
      console.warn('Failed to update user activity:', e);
    }
    
    next();
  } catch (error) {
    // Token expired or invalid - try to set user offline
    try {
      const decoded = jwt.decode(req.headers.authorization?.replace('Bearer ', ''));
      if (decoded && decoded.userId) {
        const data = await readData();
        const users = data.users || [];
        const user = users.find(u => u.id === decoded.userId);
        if (user && user.isOnline) {
          user.isOnline = false;
          await writeData(data);
        }
      }
    } catch (e) {
      // Ignore errors in cleanup
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

