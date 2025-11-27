import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import multer from 'multer';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const importRouter = express.Router();

// Define multer upload here to avoid circular dependency with server.js
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Import CSV
importRouter.post('/csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf8');

    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Clean up file
        fs.unlink(filePath).catch(console.error);

        if (results.errors.length > 0) {
          return res.status(400).json({ error: 'CSV parsing errors', details: results.errors });
        }

        const preview = results.data.slice(0, 50); // Limit preview to 50 rows
        const columns = results.data.length > 0 ? Object.keys(results.data[0]) : [];

        // Auto-detect mapping for both products and clients
        const mapping = {};
        columns.forEach(col => {
          const lowerCol = col.toLowerCase();
          // Product fields
          if (lowerCol.includes('name') || lowerCol.includes('שם')) {
            mapping.name = col;
          } else if (lowerCol.includes('code') || lowerCol.includes('קוד')) {
            mapping.code = col;
          } else if (lowerCol.includes('price') || lowerCol.includes('מחיר')) {
            mapping.price = col;
          } else if (lowerCol.includes('discount') || lowerCol.includes('הנחה')) {
            mapping.discount = col;
          } else if (lowerCol.includes('type') || lowerCol.includes('סוג')) {
            mapping.discountType = col;
          }
          // Client fields
          if (lowerCol.includes('phone') || lowerCol.includes('טלפון') || lowerCol.includes('נייד')) {
            mapping.phone = col;
          } else if (lowerCol.includes('email') || lowerCol.includes('אימייל') || lowerCol.includes('מייל') || lowerCol.includes('דואר')) {
            mapping.email = col;
          } else if (lowerCol.includes('pc') || lowerCol.includes('ח"פ') || lowerCol.includes('חפ') || lowerCol.includes('company')) {
            mapping.pc = col;
          } else if (lowerCol.includes('note') || lowerCol.includes('הערה') || lowerCol.includes('הערות')) {
            mapping.notes = col;
          } else if (lowerCol.includes('contact') || lowerCol.includes('date') || lowerCol.includes('תאריך') || lowerCol.includes('קשר')) {
            mapping.lastContacted = col;
          }
        });

        res.json({
          preview,
          mapping,
          totalRows: results.data.length,
        });
      },
      error: (error) => {
        fs.unlink(filePath).catch(console.error);
        res.status(500).json({ error: error.message });
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import PDF with text extraction and OCR fallback
importRouter.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileBuffer = await fs.readFile(filePath);

    let extractedText = '';
    let parsedData = [];

    try {
      // Try to extract text using pdf-parse (works for text-based PDFs)
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;

      // Try to parse table data from text
      parsedData = parseTableFromText(extractedText);
    } catch (parseError) {
      console.log('Text extraction failed, trying OCR...', parseError.message);
    }

    // If no data extracted or OCR needed
    if (parsedData.length === 0) {
      try {
        // Use OCR as fallback
        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(fileBuffer);
        await worker.terminate();
        
        extractedText = text;
        parsedData = parseTableFromText(extractedText);
      } catch (ocrError) {
        console.error('OCR failed:', ocrError.message);
      }
    }

    // Clean up file
    fs.unlink(filePath).catch(console.error);

    if (parsedData.length === 0) {
      return res.json({
        preview: [],
        mapping: {},
        rawText: extractedText,
        error: 'Could not parse table data from PDF',
      });
    }

    const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
    const preview = parsedData.slice(0, 50);

    // Auto-detect mapping for both products and clients
    const mapping = {};
    columns.forEach(col => {
      const lowerCol = col.toLowerCase();
      // Product fields
      if (lowerCol.includes('name') || lowerCol.includes('שם')) {
        mapping.name = col;
      } else if (lowerCol.includes('code') || lowerCol.includes('קוד')) {
        mapping.code = col;
      } else if (lowerCol.includes('price') || lowerCol.includes('מחיר')) {
        mapping.price = col;
      } else if (lowerCol.includes('discount') || lowerCol.includes('הנחה')) {
        mapping.discount = col;
      } else if (lowerCol.includes('type') || lowerCol.includes('סוג')) {
        mapping.discountType = col;
      }
      // Client fields
      if (lowerCol.includes('phone') || lowerCol.includes('טלפון') || lowerCol.includes('נייד')) {
        mapping.phone = col;
      } else if (lowerCol.includes('email') || lowerCol.includes('אימייל') || lowerCol.includes('מייל') || lowerCol.includes('דואר')) {
        mapping.email = col;
      } else if (lowerCol.includes('pc') || lowerCol.includes('ח"פ') || lowerCol.includes('חפ') || lowerCol.includes('company')) {
        mapping.pc = col;
      } else if (lowerCol.includes('note') || lowerCol.includes('הערה') || lowerCol.includes('הערות')) {
        mapping.notes = col;
      } else if (lowerCol.includes('contact') || lowerCol.includes('date') || lowerCol.includes('תאריך') || lowerCol.includes('קשר')) {
        mapping.lastContacted = col;
      }
    });

    res.json({
      preview,
      mapping,
      rawText: extractedText.substring(0, 1000), // First 1000 chars for preview
      totalRows: parsedData.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to parse table data from text
function parseTableFromText(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Try to detect headers (first non-empty line with multiple words/numbers)
  let headerLine = -1;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const parts = lines[i].split(/\s+/).filter(p => p.trim());
    if (parts.length >= 3) {
      headerLine = i;
      break;
    }
  }

  if (headerLine === -1) return [];

  const headers = lines[headerLine].split(/\s+/).filter(h => h.trim());
  const data = [];

  for (let i = headerLine + 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/).filter(p => p.trim());
    if (parts.length >= 2) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = parts[index] || '';
      });
      data.push(row);
    }
  }

  return data;
}

// Import XLSX/Excel
importRouter.post('/xlsx', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileBuffer = await fs.readFile(filePath);

    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON (using header row)
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      defval: '',
      raw: false 
    });

    // Clean up file
    fs.unlink(filePath).catch(console.error);

    if (!data || data.length === 0) {
      return res.json({
        preview: [],
        mapping: {},
        error: 'No data found in Excel file',
      });
    }

    const preview = data.slice(0, 50); // Limit preview to 50 rows
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    // Auto-detect mapping for both products and clients
    const mapping = {};
    columns.forEach(col => {
      const lowerCol = String(col).toLowerCase();
      // Product fields
      if (lowerCol.includes('name') || lowerCol.includes('שם')) {
        mapping.name = col;
      } else if (lowerCol.includes('code') || lowerCol.includes('קוד')) {
        mapping.code = col;
      } else if (lowerCol.includes('price') || lowerCol.includes('מחיר')) {
        mapping.price = col;
      } else if (lowerCol.includes('discount') || lowerCol.includes('הנחה')) {
        mapping.discount = col;
      } else if (lowerCol.includes('type') || lowerCol.includes('סוג')) {
        mapping.discountType = col;
      }
      // Client fields
      if (lowerCol.includes('phone') || lowerCol.includes('טלפון') || lowerCol.includes('נייד')) {
        mapping.phone = col;
      } else if (lowerCol.includes('email') || lowerCol.includes('אימייל') || lowerCol.includes('מייל') || lowerCol.includes('דואר')) {
        mapping.email = col;
      } else if (lowerCol.includes('pc') || lowerCol.includes('ח"פ') || lowerCol.includes('חפ') || lowerCol.includes('company')) {
        mapping.pc = col;
      } else if (lowerCol.includes('note') || lowerCol.includes('הערה') || lowerCol.includes('הערות')) {
        mapping.notes = col;
      } else if (lowerCol.includes('contact') || lowerCol.includes('date') || lowerCol.includes('תאריך') || lowerCol.includes('קשר')) {
        mapping.lastContacted = col;
      }
    });

    res.json({
      preview,
      mapping,
      totalRows: data.length,
    });
  } catch (error) {
    console.error('Error processing XLSX file:', error);
    res.status(500).json({ error: error.message || 'Failed to process Excel file' });
  }
});

