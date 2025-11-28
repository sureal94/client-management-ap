import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readData, writeData } from '../utils/storage.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

// Configure multer for profile picture uploads
const profilePicturesDir = path.join(__dirname, '../uploads/profile-pictures');
fs.mkdir(profilePicturesDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePicturesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get client and product counts
    const data = await readData();
    // Count all clients (since existing clients may not have userId field)
    // If you want user-specific clients, add userId when creating clients
    const clients = data.clients || [];
    const products = data.products || [];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        profilePicture: user.profilePicture,
        darkMode: user.darkMode,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      stats: {
        clientCount: clients.length,
        productCount: products.length
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, darkMode } = req.body;

    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === req.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (fullName !== undefined) users[userIndex].fullName = fullName;
    if (phone !== undefined) users[userIndex].phone = phone;
    if (darkMode !== undefined) users[userIndex].darkMode = darkMode;

    await saveUsers(users);

    res.json({
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        fullName: users[userIndex].fullName,
        phone: users[userIndex].phone,
        profilePicture: users[userIndex].profilePicture,
        darkMode: users[userIndex].darkMode,
        createdAt: users[userIndex].createdAt,
        lastLogin: users[userIndex].lastLogin
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update email
router.put('/profile/email', authenticateToken, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await getUsers();
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if email already exists
    const emailExists = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== req.userId);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    user.email = email.toLowerCase();
    await saveUsers(users);

    res.json({ message: 'Email updated successfully', email: user.email });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Update password
router.put('/profile/password', authenticateToken, async (req, res) => {
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

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    await saveUsers(users);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Upload profile picture
router.post('/profile/picture', authenticateToken, upload.single('picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const users = await getUsers();
    const user = users.find(u => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, '../uploads/profile-pictures', path.basename(user.profilePicture));
      fs.unlink(oldPicturePath).catch(() => {}); // Ignore errors if file doesn't exist
    }

    // Save new profile picture path
    const pictureUrl = `/api/users/profile-pictures/${req.file.filename}`;
    user.profilePicture = pictureUrl;
    await saveUsers(users);

    res.json({ message: 'Profile picture uploaded successfully', profilePicture: pictureUrl });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Serve profile pictures
router.use('/profile-pictures', express.static(profilePicturesDir));

// Delete profile
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === req.userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete profile picture if exists
    const user = users[userIndex];
    if (user.profilePicture) {
      const picturePath = path.join(__dirname, '../uploads/profile-pictures', path.basename(user.profilePicture));
      fs.unlink(picturePath).catch(() => {});
    }

    // Remove user
    users.splice(userIndex, 1);
    await saveUsers(users);

    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

export { router as usersRouter };

