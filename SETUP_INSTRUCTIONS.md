# Setup Instructions

## ⚠️ Important: Node.js Version Required

**You currently have Node.js 12.16.3, but this project requires Node.js 16.0.0 or higher.**

### How to Upgrade Node.js

1. **Download Node.js 18 LTS (Recommended):**
   - Go to: https://nodejs.org/
   - Download the Windows Installer (.msi) for version 18 LTS or 20 LTS
   - Run the installer and follow the setup wizard
   - **Restart your terminal/PowerShell after installation**

2. **Verify installation:**
   ```bash
   node --version
   # Should show v18.x.x or v20.x.x (not v12.x.x)
   ```

3. **Verify npm version:**
   ```bash
   npm --version
   # Should show 9.x.x or higher
   ```

## After Upgrading Node.js

### Step 1: Install Dependencies

Open PowerShell or Command Prompt in the project folder and run:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

This may take 3-5 minutes to complete.

### Step 2: Start the Development Servers

**Option A: Run both at once (recommended):**
```bash
npm run dev
```

**Option B: Run separately in two terminals:**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

### Step 3: Open the Application

After the servers start, you'll see:
- Frontend running on: http://localhost:3000
- Backend running on: http://localhost:5000

**Open your web browser and go to:** http://localhost:3000

## ⚠️ Why You Can't Just Open index.html

This is a React application that needs to be:
1. Compiled by Vite
2. Served through a development server
3. Connected to the backend API

Opening `index.html` directly in a browser won't work because:
- React code needs to be transpiled (converted from JSX to JavaScript)
- ES modules need to be processed
- The app needs to connect to the backend server

## Troubleshooting

### "Cannot find module" errors
- Make sure you've installed all dependencies (`npm install` in root, client, and server folders)

### Port already in use
- Change the port in `client/vite.config.js` (frontend)
- Change the port in `server/server.js` (backend)

### Still seeing blank page
1. Check the browser console for errors (F12)
2. Make sure both servers are running
3. Try clearing browser cache
4. Check that you're accessing http://localhost:3000 (not file://)

## Quick Test

Once everything is installed and running, you should see:
1. A black navigation bar at the top with "Products", "Clients", and "Import" links
2. A language toggle button (English/Hebrew)
3. The Products page with a table (even if empty)

## Need Help?

If you encounter issues:
1. Make sure Node.js version is 16+ (run `node --version`)
2. Make sure all dependencies are installed
3. Check that both servers are running
4. Look at the terminal output for error messages









