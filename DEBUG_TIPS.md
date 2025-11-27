# Debugging 500 Error

## The Error
"Failed to add product: Request failed with status 500"

This means the backend server IS running, but there's an error when trying to save the product.

## How to See the Actual Error

**Check the backend server console/terminal** where you ran `npm run dev` in the server folder.

You should see detailed error messages like:
- "Error creating product: [error message]"
- "Error writing data file: [error message]"
- The full error stack trace

## Common Causes

### 1. File Permissions
The server might not have write permission to `server/data.json`

**Fix:**
- Check if `server/data.json` exists
- Right-click the file → Properties → Security tab
- Make sure your user has "Write" permission

### 2. Path Issues
The data.json file path might be incorrect

**Check:**
- Look in the server console for: "Data file path: [path]"
- Verify the path exists and is writable

### 3. Invalid JSON
If data.json got corrupted, it might not be valid JSON

**Fix:**
- Open `server/data.json`
- Make sure it contains: `{"products": [], "clients": []}`
- Save and try again

### 4. Node Version Issue
If you see errors about `--watch`, your Node version might be too old

**Check:**
- Run: `node --version`
- Should be v18.0.0 or higher

## Quick Test

1. **Check server logs:**
   - Look at the terminal where the backend is running
   - Try adding a product
   - You should see logs like:
     - "Received product data: {...}"
     - "Current products count: 0"
     - "Saving products..."
     - "Product saved successfully" OR error message

2. **Check data.json:**
   - Open `server/data.json`
   - After trying to add a product, see if it changes

3. **Test API directly:**
   - Open browser: http://localhost:5000/api/health
   - Should show: `{"status":"ok"}`

## What I Fixed

1. ✅ Added detailed error logging
2. ✅ Added request logging
3. ✅ Improved error messages
4. ✅ Added validation for required fields
5. ✅ Better file write error handling

## Next Steps

1. **Restart the backend server:**
   - Stop it (Ctrl+C)
   - Start it again: `cd server && npm run dev`

2. **Try adding a product again**

3. **Check the server console** for the detailed error message

4. **Share the error message** from the server console if it still fails




