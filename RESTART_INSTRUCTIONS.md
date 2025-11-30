# Complete Restart Instructions - Get All New Changes

## ⚠️ IMPORTANT: Follow these steps in order

### Step 1: Stop ALL Running Servers
1. Close **ALL** terminal windows running Node.js
2. Press `Ctrl+C` in each terminal to stop servers
3. Or use Task Manager to end all `node.exe` processes

### Step 2: Clear All Caches
The caches have been cleared, but if you want to do it manually:

```bash
cd "C:\Users\אמתייהו\Desktop\client managment App\client"

# Clear Vite cache
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

### Step 3: Verify Packages Are Installed
```bash
cd "C:\Users\אמתייהו\Desktop\client managment App\client"
npm install
```

This ensures `pdfjs-dist` and `mammoth` are installed.

### Step 4: Start Backend Server
Open **Terminal 1**:
```bash
cd "C:\Users\אמתייהו\Desktop\client managment App\server"
node server.js
```

Wait until you see: `Server running on port 5000`

### Step 5: Start Frontend Server
Open **Terminal 2** (NEW terminal window):
```bash
cd "C:\Users\אמתייהו\Desktop\client managment App\client"
npm run dev
```

Wait until you see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
```

### Step 6: Clear Browser Cache
**IMPORTANT:** Your browser is showing old cached files!

1. **Chrome/Edge:**
   - Press `Ctrl+Shift+Delete`
   - Select "Cached images and files"
   - Time range: "All time"
   - Click "Clear data"

2. **Or use Hard Refresh:**
   - Press `Ctrl+Shift+R` (Windows)
   - Or `Ctrl+F5`

3. **Or use Incognito/Private Window:**
   - Open a new incognito/private window
   - Go to http://localhost:3000

### Step 7: Verify New Features Are Working

After restarting, you should see:

#### ✅ New Features Available:
1. **File Preview Component:**
   - Go to **Documents** page
   - Click **Preview** button (eye icon) on any document
   - Should show preview modal with file content

2. **Immediate Preview on File Selection:**
   - Go to **Documents** → **My Documents** tab
   - Click **Upload Document**
   - Select a file
   - Preview should appear immediately

3. **Support for Multiple File Types:**
   - PDFs: Preview in iframe
   - Excel: Preview as HTML table
   - Word: Preview as HTML
   - Images: Direct preview

#### ✅ Updated Files:
- `client/src/components/FilePreview.jsx` - NEW component
- `client/src/pages/DocumentsPage.jsx` - Updated with preview integration
- `client/package.json` - Added pdfjs-dist and mammoth
- `client/vite.config.js` - Added optimizeDeps

## Troubleshooting

### If you still see old app:

1. **Check browser console (F12):**
   - Look for errors
   - Check Network tab for failed requests

2. **Verify servers are running:**
   ```bash
   # Check if ports are in use
   netstat -ano | findstr ":3000 :5000"
   ```

3. **Try different browser:**
   - Use a different browser or incognito mode

4. **Check file timestamps:**
   ```bash
   # Verify FilePreview.jsx was recently modified
   Get-Item src/components/FilePreview.jsx | Select-Object LastWriteTime
   ```

### If packages are missing:

```bash
cd client
npm install pdfjs-dist mammoth
```

### If Vite shows errors:

```bash
cd client
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

## Quick Verification Checklist

After restarting, verify:
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] No errors in browser console (F12)
- [ ] Documents page loads
- [ ] Preview button (eye icon) appears on documents
- [ ] Clicking preview opens modal
- [ ] File upload shows immediate preview

## Expected Behavior

### Documents Page:
1. **My Documents Tab:**
   - Upload button
   - After selecting file → Preview appears immediately
   - Upload button appears next to "Upload Document"
   - List of documents with Preview, Download, Delete buttons

2. **Preview Modal:**
   - Opens when clicking Preview button
   - Shows file content (PDF, Excel, Word, Image)
   - Has Download and Close buttons
   - No automatic downloads triggered

## Still Having Issues?

If after following all steps you still see the old app:

1. **Check the actual file content:**
   ```bash
   # Verify FilePreview exists
   Test-Path src/components/FilePreview.jsx
   
   # Check if it's imported
   Select-String -Path src/pages/DocumentsPage.jsx -Pattern "FilePreview"
   ```

2. **Check package.json:**
   ```bash
   # Verify packages are listed
   Select-String -Path package.json -Pattern "pdfjs-dist|mammoth"
   ```

3. **Restart computer** (last resort - clears all caches)






