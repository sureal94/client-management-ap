# Testing Guide - Bug Fixes Verification

## Prerequisites

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   node server.js

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

2. **Open the app:** http://localhost:3000

3. **Open browser DevTools:** Press F12 (to see console logs and errors)

---

## Test 1: PDF Preview (No Download Trigger) ✅

### What to Test:
Verify that PDF preview shows in modal without triggering browser download.

### Steps:
1. Go to **Documents** page
2. Click on **"My Documents"** tab
3. Upload a PDF file (or use an existing one)
4. Click the **Preview button** (eye icon) on a PDF document
5. **Expected Result:**
   - ✅ Modal opens with PDF preview
   - ✅ PDF displays in iframe inside the modal
   - ✅ **NO download dialog appears**
   - ✅ **NO new browser tab opens**
   - ✅ PDF content is visible in the modal

### What to Look For:
- PDF should render inside the modal
- No download prompts
- No new tabs/windows
- Console should show no errors

### Test Files:
- Try with different PDF sizes (small, medium, large)
- Try with PDFs that have multiple pages

---

## Test 2: Empty Excel File Handling ✅

### What to Test:
Verify that empty Excel files are handled gracefully.

### Steps:
1. Create an empty Excel file:
   - Open Excel
   - Create a new file
   - Save it as `empty-test.xlsx` (with no data)
2. Go to **Documents** page → **"My Documents"** tab
3. Upload the empty Excel file
4. Click the **Preview button** (eye icon)
5. **Expected Result:**
   - ✅ Modal opens
   - ✅ Shows message: "No data in this Excel file"
   - ✅ No errors in console
   - ✅ Download button still works

### Alternative Test (Excel with empty rows):
1. Create Excel file with headers but no data rows
2. Upload and preview
3. Should show headers only

### What to Look For:
- No JavaScript errors
- User-friendly message displayed
- Modal doesn't crash
- Download option still available

---

## Test 3: Error Handling for Network Issues ✅

### What to Test:
Verify that fetch errors are handled properly.

### Steps:

#### Test 3a: Excel File with Network Error
1. Go to **Documents** page
2. Click preview on an Excel file
3. **Simulate network error:**
   - Open DevTools (F12)
   - Go to **Network** tab
   - Find the Excel file request
   - Right-click → **Block request domain**
4. Refresh and try preview again
5. **Expected Result:**
   - ✅ Shows error message: "Failed to fetch Excel file: [status] [statusText]"
   - ✅ Download button is available
   - ✅ No unhandled errors in console

#### Test 3b: Word Document with Network Error
1. Same steps as above but with a Word (.docx) file
2. **Expected Result:**
   - ✅ Shows error message: "Failed to fetch Word document: [status] [statusText]"
   - ✅ Download button available

### What to Look For:
- Clear error messages (not technical jargon)
- Download option always available
- No unhandled promise rejections

---

## Test 4: File Upload with Preview ✅

### What to Test:
Verify that file selection shows preview, then upload works correctly.

### Steps:
1. Go to **Documents** page → **"My Documents"** tab
2. Click **"Upload Document"** button
3. Select a file (PDF, Excel, Word, or Image)
4. **Expected Result:**
   - ✅ Preview modal opens immediately
   - ✅ File preview is displayed
   - ✅ "Upload" button appears next to "Upload Document"
   - ✅ File info shows: "Selected: [filename] • [size]"

5. Click the **"Upload"** button
6. **Expected Result:**
   - ✅ File uploads successfully
   - ✅ Preview modal closes
   - ✅ File appears in the documents list
   - ✅ No errors in console

### Test Different File Types:
- ✅ PDF file
- ✅ Excel file (.xlsx)
- ✅ Word document (.docx)
- ✅ Image file (.jpg, .png)

### What to Look For:
- Preview shows immediately after file selection
- Upload button appears correctly
- Upload completes without errors
- File appears in list after upload

---

## Test 5: Object URL Cleanup (Memory Leak Prevention) ✅

### What to Test:
Verify that object URLs are properly cleaned up to prevent memory leaks.

### Steps:
1. Open browser DevTools (F12)
2. Go to **Memory** tab (Chrome) or **Memory** tool (Firefox)
3. Take a **heap snapshot** (baseline)
4. Go to **Documents** page → **"My Documents"** tab
5. Upload and preview **multiple images** (5-10 images)
6. Close each preview modal
7. Take another **heap snapshot**
8. **Expected Result:**
   - ✅ Memory usage should not continuously increase
   - ✅ Object URLs should be cleaned up
   - ✅ No memory leaks visible

### Alternative Test (Easier):
1. Open DevTools → **Console** tab
2. Preview an image file
3. Close the preview
4. Preview another image
5. Close the preview
6. Repeat 5-10 times
7. **Expected Result:**
   - ✅ No errors about revoked object URLs
   - ✅ Each preview works correctly
   - ✅ No memory warnings

### What to Look For:
- Memory doesn't continuously grow
- No console errors about revoked URLs
- Each preview works independently

---

## Test 6: handlePersonalUpload Function Fix ✅

### What to Test:
Verify that upload works both from file input and upload button.

### Steps:

#### Test 6a: Upload from Upload Button
1. Go to **Documents** page → **"My Documents"** tab
2. Click **"Upload Document"**
3. Select a file
4. Click the **"Upload"** button (that appears after file selection)
5. **Expected Result:**
   - ✅ File uploads successfully
   - ✅ No errors in console
   - ✅ File appears in list

#### Test 6b: Direct File Selection (if applicable)
1. If there's a way to select file and upload directly
2. Verify it works without errors

### What to Look For:
- No "Invalid file provided" errors
- Upload works from both paths
- Console shows no errors

---

## Test 7: Error States and User Experience ✅

### What to Test:
Verify that all error states show helpful messages.

### Steps:
1. Test preview with **unsupported file type** (e.g., .zip, .exe)
2. **Expected Result:**
   - ✅ Shows "Unsupported File Type" message
   - ✅ Download button is available
   - ✅ Message is user-friendly

3. Test preview with **corrupted file**
4. **Expected Result:**
   - ✅ Shows appropriate error message
   - ✅ Download option available
   - ✅ No app crash

### What to Look For:
- All error messages are user-friendly
- Download option always available
- No technical error messages exposed to users

---

## Quick Test Checklist

Use this checklist for a quick verification:

- [ ] PDF preview shows in modal (no download)
- [ ] Excel preview works (even with empty files)
- [ ] Word preview works
- [ ] Image preview works
- [ ] File upload with preview works
- [ ] Upload button appears after file selection
- [ ] Error messages are user-friendly
- [ ] Download button works in all cases
- [ ] No console errors
- [ ] No memory leaks (multiple previews)
- [ ] Modal closes correctly
- [ ] All file types can be previewed

---

## Common Issues to Watch For

### If PDF shows blank:
- Check browser console for CORS errors
- Verify PDF file is not corrupted
- Check if PDF.js worker is loading

### If Excel/Word preview fails:
- Check network tab for failed requests
- Verify file is not corrupted
- Check if libraries are loaded (xlsx, mammoth)

### If upload fails:
- Check network tab for API errors
- Verify file size is within limits
- Check server logs for errors

---

## Browser Compatibility Testing

Test in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)

### Known Limitations:
- PDF.js requires modern browser
- Excel/Word preview requires ArrayBuffer support
- Some older browsers may not support all features

---

## Performance Testing

1. **Large Files:**
   - Test with large PDFs (10MB+)
   - Test with large Excel files (1000+ rows)
   - Monitor loading times

2. **Multiple Previews:**
   - Open/close preview multiple times
   - Check for memory leaks
   - Verify performance doesn't degrade

---

## Automated Testing (Optional)

If you want to automate some tests, you can use browser DevTools:

```javascript
// Test PDF preview (run in browser console)
const testPDFPreview = async () => {
  // Simulate clicking preview button
  const previewBtn = document.querySelector('[title="Preview Document"]');
  if (previewBtn) {
    previewBtn.click();
    // Wait for modal
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Check if modal is visible
    const modal = document.querySelector('.fixed.inset-0');
    console.log('Modal visible:', modal !== null);
  }
};
```

---

## Reporting Issues

If you find any issues during testing:

1. **Note the exact steps to reproduce**
2. **Check browser console for errors**
3. **Check network tab for failed requests**
4. **Take screenshots if possible**
5. **Note browser and version**

---

## Success Criteria

All tests pass if:
- ✅ No console errors
- ✅ All previews work correctly
- ✅ No download triggers (except download button)
- ✅ Error messages are user-friendly
- ✅ Memory doesn't leak
- ✅ Upload works from all paths
- ✅ All file types can be previewed





