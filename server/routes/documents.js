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

// Middleware to fix Content-Disposition header encoding before multer processes it
documentsRouter.use((req, res, next) => {
  // Intercept and fix Content-Disposition header if present
  const contentDisposition = req.headers['content-disposition'];
  if (contentDisposition) {
    // Try to decode UTF-8 filenames from the header
    // Handle both standard and RFC 5987 formats
    const rfc5987Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (rfc5987Match) {
      try {
        const decoded = decodeURIComponent(rfc5987Match[1]);
        // Replace in header
        req.headers['content-disposition'] = contentDisposition.replace(
          /filename\*=UTF-8''[^;]+/i,
          `filename*=UTF-8''${rfc5987Match[1]}`
        );
      } catch (e) {
        // Keep original if decode fails
      }
    }
  }
  next();
});

// Helper function to decode UTF-8 filename from Content-Disposition header
function decodeFilename(filename) {
  if (!filename) return filename;
  
  // Try to decode RFC 5987 format: filename*=UTF-8''encoded
  const rfc5987Match = filename.match(/filename\*=UTF-8''(.+)/i);
  if (rfc5987Match) {
    try {
      return decodeURIComponent(rfc5987Match[1]);
    } catch (e) {
      console.warn('Failed to decode RFC 5987 filename:', e);
    }
  }
  
  // Try to decode standard URL encoding
  try {
    const decoded = decodeURIComponent(filename);
    if (decoded !== filename) {
      return decoded;
    }
  } catch (e) {
    // Not URL encoded, continue
  }
  
  // Check if it's corrupted (mojibake) - contains '×' pattern
  // Pattern: ×מ×ח×י... means UTF-8 bytes interpreted as Latin-1
  if (filename.includes('×')) {
    try {
      // This is UTF-8 bytes being read as Latin-1
      // Convert: treat each byte as Latin-1, then interpret as UTF-8
      const fixed = Buffer.from(filename, 'latin1').toString('utf8');
      // Verify it's actually fixed (contains Hebrew characters and no ×)
      if (/[\u0590-\u05FF]/.test(fixed) && !fixed.includes('×')) {
        console.log(`Fixed corrupted filename: "${filename}" -> "${fixed}"`);
        return fixed;
      }
    } catch (e) {
      console.warn('Failed to fix corrupted filename:', e);
    }
  }
  
  // If filename contains non-ASCII but no valid Unicode characters, try latin1->utf8 conversion
  if (/[^\x00-\x7F]/.test(filename) && !/[\u0590-\u05FF\u0400-\u04FF\u4E00-\u9FFF\u00A0-\u00FF]/.test(filename)) {
    try {
      const fixed = Buffer.from(filename, 'latin1').toString('utf8');
      // Only use if it results in valid Unicode characters
      if (/[\u0590-\u05FF\u0400-\u04FF\u4E00-\u9FFF]/.test(fixed)) {
        console.log(`Fixed corrupted filename (non-ASCII): "${filename}" -> "${fixed}"`);
        return fixed;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  return filename;
}

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    // Decode the filename properly
    let originalName = decodeFilename(file.originalname);
    
    // Preserve original filename with timestamp prefix
    const timestamp = Date.now();
    
    // Only sanitize truly problematic filesystem characters, preserve Unicode
    const safeName = originalName.replace(/[<>:"|?*\x00-\x1f]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Data file path
const dataFile = path.join(__dirname, '../data.json');

// Helper to read/write data
async function getData() {
  const content = await fs.readFile(dataFile, 'utf8');
  const data = JSON.parse(content);
  if (!data.documents) {
    data.documents = [];
  }
  return data;
}

async function saveData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

// Helper function to fix corrupted UTF-8 filenames in existing data
function fixCorruptedFilename(originalName) {
  if (!originalName) return originalName;
  
  // Use the same decode logic
  return decodeFilename(originalName);
}

// Get all documents (both client and personal)
documentsRouter.get('/', async (req, res) => {
  try {
    const data = await getData();
    // Fix any corrupted filenames before returning
    const fixedDocuments = (data.documents || []).map(doc => ({
      ...doc,
      originalName: fixCorruptedFilename(doc.originalName)
    }));
    res.json(fixedDocuments);
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
    ).map(doc => ({
      ...doc,
      originalName: fixCorruptedFilename(doc.originalName)
    }));
    res.json(clientDocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get personal documents (not attached to any client)
documentsRouter.get('/personal', async (req, res) => {
  try {
    const data = await getData();
    const personalDocs = (data.documents || []).filter(d => !d.clientId).map(doc => ({
      ...doc,
      originalName: fixCorruptedFilename(doc.originalName)
    }));
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

    // Decode filename properly (already done in multer, but ensure it's correct)
    let originalName = decodeFilename(req.file.originalname);
    
    // Double-check: if still corrupted, try to fix
    if (originalName.includes('×')) {
      try {
        const fixed = Buffer.from(originalName, 'latin1').toString('utf8');
        if (/[\u0590-\u05FF]/.test(fixed) && !fixed.includes('×')) {
          originalName = fixed;
        }
      } catch (e) {
        console.warn('Failed to fix filename in upload:', e);
      }
    }

    const newDoc = {
      id: Date.now().toString(),
      clientId: req.params.clientId,
      originalName: originalName,
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

    // Decode filename properly (already done in multer, but ensure it's correct)
    let originalName = decodeFilename(req.file.originalname);
    
    // Double-check: if still corrupted, try to fix
    if (originalName.includes('×')) {
      try {
        const fixed = Buffer.from(originalName, 'latin1').toString('utf8');
        if (/[\u0590-\u05FF]/.test(fixed) && !fixed.includes('×')) {
          originalName = fixed;
        }
      } catch (e) {
        console.warn('Failed to fix filename in upload:', e);
      }
    }

    const newDoc = {
      id: Date.now().toString(),
      clientId: null, // Personal document
      originalName: originalName,
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
    
    // Fix filename if corrupted
    const fixedFileName = fixCorruptedFilename(doc.originalName);
    
    // Set proper headers for UTF-8 filename (RFC 5987)
    const encodedFileName = encodeURIComponent(fixedFileName);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    
    // Send file
    res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix all corrupted filenames in database (one-time migration)
documentsRouter.post('/fix-filenames', async (req, res) => {
  try {
    const data = await getData();
    let fixedCount = 0;
    
    if (data.documents && data.documents.length > 0) {
      data.documents = data.documents.map(doc => {
        const fixed = fixCorruptedFilename(doc.originalName);
        if (fixed !== doc.originalName) {
          fixedCount++;
          return { ...doc, originalName: fixed };
        }
        return doc;
      });
      
      await saveData(data);
    }
    
    res.json({ 
      success: true, 
      message: `Fixed ${fixedCount} corrupted filename(s)`,
      fixedCount 
    });
  } catch (error) {
    console.error('Error fixing filenames:', error);
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
