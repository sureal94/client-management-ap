# Fix: "Network Error: Failed to fetch"

## The Problem

The error "Network Error: Failed to fetch" means the backend server on port 5000 is **NOT running** or **NOT accessible**.

## Root Cause

The backend dependencies are **NOT installed**. The `server/node_modules` folder doesn't exist, so the server can't start.

## Solution: Install Dependencies and Start Server

### Option 1: Use the Helper Batch File (Easiest)

1. **Double-click:** `INSTALL_AND_START.bat`
2. Wait for dependencies to install (3-5 minutes)
3. The server will start automatically
4. You should see: `✓ Server running on http://localhost:5000`
5. **Keep this window open**

### Option 2: Manual Installation

**Step 1: Install dependencies**
```powershell
cd "C:\Users\אמתייהו\Desktop\client managment App\server"
npm install
```

**Step 2: Start the server**
```powershell
npm run dev
```

## Verify It's Working

After the server starts, you should see:
```
✓ Server running on http://localhost:5000
✓ Health check: http://localhost:5000/api/health
✓ Data file: [path]
```

**Test it:**
1. Open browser: http://localhost:5000/api/health
2. Should show: `{"status":"ok"}`

## Try Adding Product Again

Once the backend is running:
1. Go to http://localhost:3000
2. Try adding a product
3. It should work now! ✅

## Important Notes

- **Keep the backend server window open** - if you close it, the server stops
- You need **TWO windows** open:
  - Frontend (port 3000) - shows the web app
  - Backend (port 5000) - handles API requests
- The first time you install dependencies, it takes 3-5 minutes

## If Still Not Working

If you see errors during installation:
1. Make sure Node.js 16+ is installed (`node --version`)
2. Check your internet connection (npm needs to download packages)
3. Try running as Administrator










