# How to Find the Error

## Step 1: Restart the Backend Server

1. Find the terminal/console window where the backend server is running
2. Press `Ctrl+C` to stop it
3. Start it again:
   ```powershell
   cd server
   npm run dev
   ```

## Step 2: Try Adding a Product

Go to the web app and try adding a product again.

## Step 3: Look at the Server Console

**Important:** The error details are shown in the **BACKEND SERVER terminal**, NOT in the browser!

You should see logs like:
```
=== CREATE PRODUCT REQUEST ===
Received product data: {...}
Validation passed, fetching products...
```

If there's an error, you'll see:
```
✗ ERROR CREATING PRODUCT ✗
Error message: [actual error here]
Error stack: [details here]
```

## Common Error Messages

### "Failed to save data: EACCES"
- **Problem:** File permission issue
- **Fix:** Check that `server/data.json` is writable

### "Failed to save data: ENOENT"  
- **Problem:** Directory doesn't exist
- **Fix:** Should be auto-created, but check `server/` folder exists

### "Cannot read property 'push' of undefined"
- **Problem:** Products array is undefined
- **Fix:** Check data.json format

### "JSON.parse error"
- **Problem:** data.json is corrupted
- **Fix:** Make sure data.json contains: `{"products": [], "clients": []}`

## Still Not Working?

1. **Copy the ENTIRE error message** from the server console
2. Share it with me so I can help fix it

The server console output is the key to finding the problem!










