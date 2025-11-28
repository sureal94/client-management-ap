import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { productsRouter } from './routes/products.js';
import { clientsRouter } from './routes/clients.js';
import { importRouter } from './routes/import.js';
import { documentsRouter } from './routes/documents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure UTF-8 for JSON responses
app.use((req, res, next) => {
  // Store original json method
  const originalJson = res.json;
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson.call(this, body);
  };
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });

// Initialize data storage
const dataFile = path.join(__dirname, 'data.json');

async function initData() {
  try {
    await fs.access(dataFile);
  } catch {
    // File doesn't exist, create it with initial data
    await fs.writeFile(dataFile, JSON.stringify({
      products: [],
      clients: [],
    }));
  }
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
}

// Routes
app.use('/api/products', productsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/import', importRouter);
app.use('/api/documents', documentsRouter);

// Serve document files
const documentsDir = path.join(__dirname, 'documents');
fs.mkdir(documentsDir, { recursive: true }).catch(console.error);
app.use('/api/documents/files', express.static(documentsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
initData().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    console.log(`✓ Data file: ${dataFile}\n`);
  });
}).catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});

export { app, dataFile };

