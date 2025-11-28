# Fix: 500 Error When Adding Product

## The Problem

The error shows the request is going to `http://localhost:3000/api/products`. This is correct - Vite is proxying it. BUT the proxy target `http://localhost:5000` is not responding because **the backend server is not running**.

## Solution: Start the Backend Server

### Step 1: Check if Backend is Running

Open a browser and go to: http://localhost:5000/api/health

**If you see:** `{"status":"ok"}` → Backend is running ✅  
**If you see:** "Cannot connect" or timeout → Backend is NOT running ❌

### Step 2: Start the Backend Server

**Option A: Use the Batch File (Easiest)**
1. Double-click `START_BACKEND.bat` in the project folder
2. Keep that window open
3. You should see: "Server running on http://localhost:5000"

**Option B: Manual Start**
1. Open a NEW terminal/PowerShell window
2. Run:
   ```powershell
   cd "C:\Users\אמתייהו\Desktop\client managment App\server"
   npm run dev
   ```
3. You should see: "Server running on http://localhost:5000"
4. **Keep this window open**

### Step 3: Verify Both Servers Are Running

You should have TWO terminals/windows open:

**Window 1 - Frontend (Port 3000):**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

**Window 2 - Backend (Port 5000):**
```
✓ Server running on http://localhost:5000
✓ Health check: http://localhost:5000/api/health
```

### Step 4: Test Again

1. Go to http://localhost:3000
2. Try adding a product
3. It should work now!

## Quick Test

Once the backend is running, test it:
- Open: http://localhost:5000/api/health
- Should show: `{"status":"ok"}`

## Why This Happens

- Frontend (Vite) runs on port 3000
- Backend (Express) runs on port 5000
- Vite proxies `/api/*` requests to port 5000
- If port 5000 isn't running, the proxy fails → 500 error

## Important

**Both servers must be running at the same time:**
- Frontend server (port 3000) - shows the web app
- Backend server (port 5000) - handles API requests

If you close either one, that part will stop working!








