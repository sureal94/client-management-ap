# Fix All Issues - Step by Step

## Issue Summary
1. ✅ Port 5000 conflict - FIXED (killed processes)
2. ⚠️ Mammoth import issues - FIXING
3. ⚠️ pdfjs-dist import - Should work
4. ⚠️ Deprecation warning - Can ignore (from dependency)

## Complete Fix Steps

### Step 1: Install Dependencies Properly

```bash
cd "C:\Users\אמתייהו\Desktop\client managment App\client"

# Remove any broken installations
Remove-Item -Recurse -Force node_modules\mammoth -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\pdfjs-dist -ErrorAction SilentlyContinue

# Install fresh
npm install mammoth@latest pdfjs-dist@latest

# Verify installation
npm list mammoth pdfjs-dist
```

### Step 2: Clear All Caches

```bash
# Clear Vite cache
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

### Step 3: Fix Port 5000 Issue

If you still get port 5000 error:

```powershell
# Find process using port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object OwningProcess

# Kill it (replace <PID> with actual process ID)
Stop-Process -Id <PID> -Force
```

Or change server port in `server/server.js`:
```javascript
const PORT = process.env.PORT || 5001; // Changed from 5000
```

### Step 4: Updated Import Strategy

The FilePreview component now tries multiple import paths:
1. `mammoth/browser/index.js`
2. `mammoth/browser`
3. `mammoth`

This should work with Vite.

### Step 5: Restart Everything

```bash
# Terminal 1 - Backend
cd "C:\Users\אמתייהו\Desktop\client managment App\server"
node server.js

# Terminal 2 - Frontend
cd "C:\Users\אמתייהו\Desktop\client managment App\client"
npm run dev
```

### Step 6: Clear Browser Cache

- Press `Ctrl+Shift+Delete`
- Select "Cached images and files"
- Clear data
- Or use incognito window

## If Mammoth Still Doesn't Work

### Alternative: Make Word Preview Optional

If mammoth continues to cause issues, we can make Word preview optional:

```javascript
// In FilePreview.jsx, if mammoth fails:
case 'word':
  setError('Word document preview requires mammoth library. Please download the file to view it.');
  setLoading(false);
  break;
```

### Check Mammoth Installation

```bash
# Check if mammoth is actually installed
Test-Path node_modules\mammoth

# Check package.json
Select-String -Path package.json -Pattern "mammoth"

# Check what files mammoth has
Get-ChildItem node_modules\mammoth -Recurse -Filter "*.js" | Select-Object FullName
```

## Vite Configuration

The `vite.config.js` has been updated with:
- `optimizeDeps.include` for pdfjs-dist, mammoth, xlsx
- `resolve.alias` for mammoth browser path

## Expected Behavior After Fix

1. ✅ Server starts on port 5000 (or 5001 if changed)
2. ✅ Frontend starts on port 3000
3. ✅ No mammoth import errors
4. ✅ PDF preview works (iframe)
5. ✅ Excel preview works (table)
6. ✅ Word preview works (if mammoth loads)
7. ✅ Image preview works

## Troubleshooting

### If npm install fails:
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install mammoth pdfjs-dist
```

### If Vite still shows errors:
```bash
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### If port 5000 is still in use:
```powershell
# Find and kill
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Deprecation Warning

The `util._extend` warning is from a dependency and can be ignored. It won't break anything.


