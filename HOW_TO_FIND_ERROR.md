# How to Find the Exact Error

## The browser error is generic
The error message "Failed to add product: Request failed with status 500" is just what the browser shows. The **actual error details** are shown in the **backend server terminal**.

## Step 1: Find the Backend Server Terminal

Look for the terminal/console window where you ran:
```powershell
cd server
npm run dev
```

This terminal should show:
```
Server running on http://localhost:5000
```

## Step 2: Watch This Terminal While Adding a Product

1. **Keep the backend server terminal visible**
2. Go to the web app (http://localhost:3000)
3. Try to add a product
4. **Immediately look at the backend server terminal**

You should see logs like:
```
=== CREATE PRODUCT REQUEST ===
Received product data: {...}
Validation passed, fetching products...
```

**If there's an error, you'll see:**
```
✗ ERROR CREATING PRODUCT ✗
Error message: [actual error here]
```

## Step 3: Test the API Directly

I created a test file. Open this in your browser:
- File: `TEST_API.html`
- Double-click it or open it in your browser
- Click "Test Create Product"
- This will show you the exact error message from the API

## Step 4: Check Browser Console

1. Open your browser's Developer Tools (Press F12)
2. Go to the "Console" tab
3. Try adding a product
4. Look for any error messages (usually in red)

## Common Issues

### "Cannot find module"
- Backend dependencies not installed
- Fix: `cd server && npm install`

### File permission errors
- Check that `server/data.json` exists and is writable

### Port 5000 not accessible
- Backend server not running
- Check: http://localhost:5000/api/health

## What to Share

When reporting the error, please share:
1. **The error message from the backend server terminal**
2. **The error from browser console (F12)**
3. **What happens when you open TEST_API.html**

This will help me find the exact problem!








