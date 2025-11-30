# CRM Sales App

A responsive CRM web application for sales representatives with product management, client management, bulk import capabilities, and bilingual support (English/Hebrew).

## Features

- **Products Management**: Full CRUD operations for products with name, code, price, discount, discount type (percent/fixed), and computed final price
- **Bulk Product Import**: Import products from CSV and PDF files with:
  - Mapping preview and column selection
  - For PDFs: Selectable text parsing with OCR fallback
  - Data preview and correction before import
- **Product Search**: Fuzzy search by name and code with filters and sorting
- **Client Management**: 
  - Create and manage clients with name, phone, email
  - Attach multiple products to clients
  - Add notes and status
  - Track last contacted date
  - Quick call/email actions
- **Bilingual UI**: Full English and Hebrew support with RTL layout
- **Export**: Export products and clients to CSV/XLSX
- **Theme**: Orange (#FF7A00) and Black (#000000) color scheme

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **PDF Processing**: pdf-parse + Tesseract.js (OCR)
- **CSV Processing**: PapaParse
- **Testing**: Vitest
- **Export**: SheetJS (xlsx)

## Installation

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

## Development

Run both client and server in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

- Client runs on: http://localhost:3000
- Server runs on: http://localhost:5000

## Testing

Run tests:

```bash
npm test
```

Or run tests separately:

```bash
# Client tests
cd client
npm test

# Server tests
cd server
npm test
```

## Building for Production

Build the client:

```bash
npm run build
```

The built files will be in `client/dist/`.

## Deployment

### Option 1: Deploy with Node.js Server

1. **Build the client:**
   ```bash
   cd client
   npm run build
   ```

2. **Serve the built files from the server:**

   Update `server/server.js` to serve static files:
   ```javascript
   import path from 'path';
   import { fileURLToPath } from 'url';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   
   // Add this before routes
   app.use(express.static(path.join(__dirname, '../client/dist')));
   
   // Add catch-all route at the end
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../client/dist/index.html'));
   });
   ```

3. **Set environment variables:**
   ```bash
   export PORT=5000
   ```

4. **Start the server:**
   ```bash
   cd server
   npm start
   ```

### Option 2: Deploy Frontend and Backend Separately

**Frontend (Vercel/Netlify):**
1. Connect your repository to Vercel or Netlify
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/dist`
4. Update API_BASE_URL in `client/src/services/api.js` to point to your backend URL

**Backend (Heroku/Railway/Render):**
1. Create a new Node.js app
2. Set the start command: `cd server && npm start`
3. Ensure the PORT environment variable is set
4. Add the client URL to CORS allowed origins

### Option 3: Docker Deployment

Create a `Dockerfile` in the root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Build client
RUN cd client && npm run build

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["cd", "server", "&&", "npm", "start"]
```

Build and run:
```bash
docker build -t crm-app .
docker run -p 5000:5000 crm-app
```

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── i18n/          # Internationalization
│   │   └── styles/        # CSS styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── uploads/           # Uploaded files (temporary)
│   └── data.json          # Data storage (JSON file)
└── package.json           # Root package.json
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk` - Bulk import products

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Import
- `POST /api/import/csv` - Upload and parse CSV file
- `POST /api/import/pdf` - Upload and parse PDF file (with OCR)

## Notes

- Data is stored in `server/data.json` (simple file-based storage)
- For production, consider using a proper database (PostgreSQL, MongoDB, etc.)
- PDF OCR requires Tesseract.js which can be memory-intensive for large files
- File uploads are stored temporarily in `server/uploads/` and cleaned up after processing

## License

MIT












