# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Setup (5 minutes)

1. **Install all dependencies:**
   ```bash
   # From root directory
   npm install
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

2. **Start the development servers:**
   ```bash
   # From root directory - runs both client and server
   npm run dev
   ```

   Or run separately:
   ```bash
   # Terminal 1 - Backend server (port 5000)
   cd server
   npm run dev

   # Terminal 2 - Frontend client (port 3000)
   cd client
   npm run dev
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/health

## First Steps

1. **Add Products**: Navigate to Products page and click "Add Product"
2. **Import Products**: Go to Import page and upload a CSV or PDF file
3. **Add Clients**: Navigate to Clients page and add your first client
4. **Attach Products**: When editing a client, select products to attach
5. **Switch Language**: Click the language toggle in the top-right to switch between English and Hebrew

## Testing

Run tests:
```bash
npm test
```

## Building for Production

```bash
# Build the client
cd client
npm run build

# The built files will be in client/dist/
```

## Troubleshooting

- **Port already in use**: Change ports in `client/vite.config.js` and `server/server.js`
- **PDF parsing issues**: Ensure PDF files have selectable text. OCR fallback will activate automatically for scanned PDFs
- **Import errors**: Check CSV format - should have headers: name, code, price, discount, discountType

## Data Storage

Data is stored in `server/data.json`. This is a simple file-based storage. For production, consider using a database.












