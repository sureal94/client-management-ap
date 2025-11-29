import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readData, writeData } from '../utils/storage.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper functions
async function getUsers() {
  const data = await readData();
  return data.users || [];
}

async function saveUsers(users) {
  const data = await readData();
  data.users = users;
  await writeData(data);
}

async function getClients() {
  const data = await readData();
  return data.clients || [];
}

async function saveClients(clients) {
  const data = await readData();
  data.clients = clients;
  await writeData(data);
}

async function getProducts() {
  const data = await readData();
  return data.products || [];
}

async function saveProducts(products) {
  const data = await readData();
  data.products = products;
  await writeData(data);
}

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

// Initialize admin user if it doesn't exist
async function initializeAdmin() {
  const users = await getUsers();
  const adminExists = users.find(u => u.email === 'admin' || u.role === 'admin');
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin', 10);
    const adminUser = {
      id: 'admin-' + Date.now(),
      email: 'admin',
      password: hashedPassword,
      fullName: 'Administrator',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      phone: null,
      profilePicture: null,
      darkMode: false,
      mustChangePassword: true // Force password change on first login
    };
    users.push(adminUser);
    await saveUsers(users);
    console.log('Admin user created with default credentials: admin/admin');
  }
}

// Initialize admin on module load
initializeAdmin().catch(console.error);

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await getUsers();
    const user = users.find(u => 
      (u.email.toLowerCase() === email.toLowerCase() || u.email === email) && 
      u.role === 'admin'
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await saveUsers(users);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword || false
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to login: ' + error.message });
  }
});

// Change admin password (required on first login)
router.post('/change-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const users = await getUsers();
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await saveUsers(users);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get admin dashboard statistics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    const clients = await getClients();
    const products = await getProducts();
    const data = await readData();
    const documents = data.documents || [];

    // Filter out admin users
    const regularUsers = users.filter(u => u.role !== 'admin');

    // Calculate statistics - count ALL items (including those without userId for backward compatibility)
    const stats = {
      totalUsers: regularUsers.length || 0,
      totalClients: clients.length || 0,
      totalProducts: products.length || 0,
      totalDocuments: documents.length || 0,
      activeUsers: regularUsers.filter(u => {
        if (!u.lastLogin) return false;
        const lastLoginDate = new Date(u.lastLogin);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastLoginDate > sevenDaysAgo;
      }).length || 0,
      usersWithClients: regularUsers.filter(u => {
        const userClients = clients.filter(c => c.userId === u.id);
        return userClients.length > 0;
      }).length || 0,
      usersWithProducts: regularUsers.filter(u => {
        const userProducts = products.filter(p => p.userId === u.id);
        return userProducts.length > 0;
      }).length || 0
    };

    // Recent activity (last 10 active users) - sorted by lastActive, fallback to lastLogin
    const recentLogins = regularUsers
      .filter(u => u.lastActive || u.lastLogin) // Only users with activity
      .sort((a, b) => {
        // Sort by lastActive first, then lastLogin as fallback
        const aTime = a.lastActive ? new Date(a.lastActive) : (a.lastLogin ? new Date(a.lastLogin) : new Date(0));
        const bTime = b.lastActive ? new Date(b.lastActive) : (b.lastLogin ? new Date(b.lastLogin) : new Date(0));
        return bTime - aTime; // Descending (most recent first)
      })
      .slice(0, 10)
      .map(u => ({
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        lastLogin: u.lastLogin,
        lastActive: u.lastActive || u.lastLogin // Use lastActive if available
      }));

    res.json({ stats, recentLogins: recentLogins || [] });
  } catch (error) {
    console.error('Dashboard error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to load dashboard: ' + error.message });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    const clients = await getClients();
    const products = await getProducts();
    const data = await readData();
    const documents = data.documents || [];

    // Filter out admin users and add statistics
    const regularUsers = users
      .filter(u => u.role !== 'admin')
      .map(user => {
        // Count items owned by this user - STRICT: only items with matching userId
        const userClients = clients.filter(c => c.userId === user.id);
        const userProducts = products.filter(p => p.userId === user.id);
        const userDocuments = documents.filter(d => d.userId === user.id);

        return {
          id: user.id,
          email: user.email || '',
          fullName: user.fullName || '',
          phone: user.phone || '',
          profilePicture: user.profilePicture || null,
          createdAt: user.createdAt || '',
          lastLogin: user.lastLogin || null,
          lastActive: user.lastActive || user.lastLogin || null, // Use lastActive, fallback to lastLogin
          isOnline: user.isOnline === true, // Real-time online status
          isActive: user.isOnline === true, // Use isOnline for status (backward compatibility)
          clientCount: userClients ? userClients.length : 0,
          productCount: userProducts ? userProducts.length : 0,
          documentCount: userDocuments ? userDocuments.length : 0
        };
      });

    res.json(regularUsers || []);
  } catch (error) {
    console.error('Get users error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get users: ' + error.message });
  }
});

// Reset user password
router.post('/users/:userId/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const users = await getUsers();
    const user = users.find(u => u.id === userId && u.role !== 'admin');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = true; // Force password change on next login
    await saveUsers(users);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Update user email
router.put('/users/:userId/email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId && u.role !== 'admin');

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email already exists
    const emailExists = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== userId);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    users[userIndex].email = email.toLowerCase();
    await saveUsers(users);

    res.json({ message: 'Email updated successfully', email: users[userIndex].email });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Toggle user active status
router.put('/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId && u.role !== 'admin');

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].isActive = isActive !== false;
    await saveUsers(users);

    res.json({ message: `User ${isActive !== false ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId && u.role !== 'admin');

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.splice(userIndex, 1);
    await saveUsers(users);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Assign client to user
router.post('/clients/:clientId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const clients = await getClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);

    if (clientIndex === -1) {
      return res.status(404).json({ error: 'Client not found' });
    }

    clients[clientIndex].userId = userId;
    await saveClients(clients);

    res.json({ message: 'Client assigned successfully', client: clients[clientIndex] });
  } catch (error) {
    console.error('Assign client error:', error);
    res.status(500).json({ error: 'Failed to assign client' });
  }
});

// Assign product to user
router.post('/products/:productId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const products = await getProducts();
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[productIndex].userId = userId;
    await saveProducts(products);

    res.json({ message: 'Product assigned successfully', product: products[productIndex] });
  } catch (error) {
    console.error('Assign product error:', error);
    res.status(500).json({ error: 'Failed to assign product' });
  }
});

// Assign document to user
router.post('/documents/:documentId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const data = await readData();
    const documents = data.documents || [];
    const docIndex = documents.findIndex(d => d.id === documentId);

    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    documents[docIndex].userId = userId;
    data.documents = documents;
    await writeData(data);

    res.json({ message: 'Document assigned successfully', document: documents[docIndex] });
  } catch (error) {
    console.error('Assign document error:', error);
    res.status(500).json({ error: 'Failed to assign document' });
  }
});

export { router as adminRouter };

