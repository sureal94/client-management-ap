import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readData, writeData } from '../utils/storage.js';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Helper function to get users from data
async function getUsers() {
  const data = await readData();
  return data.users || [];
}

// Helper function to save users
async function saveUsers(users) {
  const data = await readData();
  data.users = users;
  await writeData(data);
}

// Helper function to get password reset tokens
async function getPasswordResetTokens() {
  const data = await readData();
  return data.passwordResetTokens || [];
}

// Helper function to save password reset tokens
async function savePasswordResetTokens(tokens) {
  const data = await readData();
  data.passwordResetTokens = tokens;
  await writeData(data);
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const users = await getUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName: fullName || email.split('@')[0],
      createdAt: new Date().toISOString(),
      lastLogin: null,
      lastActive: null, // Track last activity (login/logout)
      isOnline: false, // Track online status
      phone: null,
      profilePicture: null,
      darkMode: false
    };

    users.push(newUser);
    await saveUsers(users);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login, lastActive, and set online status
    const now = new Date().toISOString();
    user.lastLogin = now;
    user.lastActive = now; // Update last activity timestamp
    user.isOnline = true; // Set user as online
    await saveUsers(users);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        phone: user.phone,
        profilePicture: user.profilePicture,
        darkMode: user.darkMode
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to login: ' + error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    const users = await getUsers();
    const user = email 
      ? users.find(u => u.email.toLowerCase() === email.toLowerCase())
      : users.find(u => u.phone === phone);

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If a user exists with this email/phone, a reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    const tokens = await getPasswordResetTokens();
    tokens.push({
      userId: user.id,
      token: resetToken,
      expiresAt: resetTokenExpiry.toISOString(),
      createdAt: new Date().toISOString()
    });
    await savePasswordResetTokens(tokens);

    // In production, send email/SMS here
    // For now, return the token (in production, send via email/SMS)
    res.json({
      message: 'Password reset link sent',
      resetToken: resetToken, // Remove this in production, send via email/SMS
      resetLink: `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokens = await getPasswordResetTokens();
    const resetToken = tokens.find(t => t.token === token);

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      // Remove expired token
      const updatedTokens = tokens.filter(t => t.token !== token);
      await savePasswordResetTokens(updatedTokens);
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Update user password
    const users = await getUsers();
    const user = users.find(u => u.id === resetToken.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    await saveUsers(users);

    // Remove used token
    const updatedTokens = tokens.filter(t => t.token !== token);
    await savePasswordResetTokens(updatedTokens);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Logout endpoint - no auth required (user might be logging out with expired token)
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.decode(token); // Decode without verification (token might be expired)
        if (decoded && decoded.userId) {
          const users = await getUsers();
          const user = users.find(u => u.id === decoded.userId);
          if (user) {
            // Update lastActive and set offline
            const now = new Date().toISOString();
            user.lastActive = now;
            user.isOnline = false; // Set user as offline
            await saveUsers(users);
          }
        }
      } catch (e) {
        // Ignore decode errors
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Verify token (for protected routes)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await getUsers();
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update lastActive on verification (user is active)
    user.lastActive = new Date().toISOString();
    user.isOnline = true;
    await saveUsers(users);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        phone: user.phone,
        profilePicture: user.profilePicture,
        darkMode: user.darkMode
      }
    });
  } catch (error) {
    // Token expired or invalid - try to set user offline
    try {
      const decoded = jwt.decode(req.headers.authorization?.replace('Bearer ', ''));
      if (decoded && decoded.userId) {
        const users = await getUsers();
        const user = users.find(u => u.id === decoded.userId);
        if (user && user.isOnline) {
          user.isOnline = false;
          await saveUsers(users);
        }
      }
    } catch (e) {
      // Ignore errors in cleanup
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export { router as authRouter };


