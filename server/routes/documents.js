import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const documentsRouter = express.Router();

// Create documents directory
const documentsDir = path.join(__dirname, '../documents');
fs.mkdir(documentsDir, { recursive: true }).catch(console.error);

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename with timestamp prefix
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Data file path
const dataFile = path.join(__dirname, '../data.json');

// Helper to read/write data
async function getData() {
  const content = await fs.readFile(dataFile, 'utf-8');
  const data = JSON.parse(content);
  if (!data.documents) {
    data.documents = [];
  }
  return data;
}

async function saveData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

// Get all documents (both client and personal)
documentsRouter.get('/', async (req, res) => {
  try {
    const data = await getData();
    res.json(data.documents || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get documents for a specific client
documentsRouter.get('/client/:clientId', async (req, res) => {
  try {
    const data = await getData();
    const clientDocs = (data.documents || []).filter(
      d => d.clientId === req.params.clientId
    );
    res.json(clientDocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get personal documents (not attached to any client)
documentsRouter.get('/personal', async (req, res) => {
  try {
    const data = await getData();
    const personalDocs = (data.documents || []).filter(d => !d.clientId);
    res.json(personalDocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload document for a client
documentsRouter.post('/client/:clientId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const data = await getData();
    if (!data.documents) {
      data.documents = [];
    }

    const newDoc = {
      id: Date.now().toString(),
      clientId: req.params.clientId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    };

    data.documents.push(newDoc);
    await saveData(data);

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload personal document
documentsRouter.post('/personal', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const data = await getData();
    if (!data.documents) {
      data.documents = [];
    }

    const newDoc = {
      id: Date.now().toString(),
      clientId: null, // Personal document
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    };

    data.documents.push(newDoc);
    await saveData(data);

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download document
documentsRouter.get('/download/:id', async (req, res) => {
  try {
    const data = await getData();
    const doc = (data.documents || []).find(d => d.id === req.params.id);
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(documentsDir, doc.fileName);
    res.download(filePath, doc.originalName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
documentsRouter.delete('/:id', async (req, res) => {
  try {
    const data = await getData();
    const docIndex = (data.documents || []).findIndex(d => d.id === req.params.id);
    
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = data.documents[docIndex];
    
    // Delete file from filesystem
    try {
      const filePath = path.join(documentsDir, doc.fileName);
      await fs.unlink(filePath);
    } catch (e) {
      console.error('Failed to delete file:', e);
    }

    // Remove from data
    data.documents.splice(docIndex, 1);
    await saveData(data);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default documentsRouter;

