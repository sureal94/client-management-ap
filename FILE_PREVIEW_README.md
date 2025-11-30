# File Preview Component Documentation

## Overview

The `FilePreview` component provides comprehensive file preview functionality for web applications. It supports multiple file types including images, PDFs, Excel files, and Word documents, all rendered directly in the browser without requiring downloads.

## Features

- ✅ **Image Preview**: Supports JPG, PNG, GIF, BMP, WebP, SVG
- ✅ **PDF Preview**: Renders PDFs using PDF.js with canvas rendering
- ✅ **Excel Preview**: Converts .xlsx and .xls files to HTML tables using SheetJS
- ✅ **Word Preview**: Converts .docx files to HTML using Mammoth.js
- ✅ **Immediate Preview**: Shows preview as soon as a file is selected
- ✅ **Error Handling**: Graceful fallbacks for unsupported files
- ✅ **Download Option**: Always provides download link for files

## Installation

Install the required dependencies:

```bash
npm install pdfjs-dist mammoth xlsx
```

Note: `xlsx` (SheetJS) is likely already installed in your project.

## Usage

### Basic Example

```jsx
import { useState, useRef } from 'react';
import FilePreview from './components/FilePreview';

function MyComponent() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowPreview(true);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.xlsx,.xls,.docx,.jpg,.jpeg,.png,.gif"
      />
      <button onClick={() => fileInputRef.current?.click()}>
        Select File
      </button>

      {showPreview && selectedFile && (
        <FilePreview
          file={selectedFile}
          fileUrl={null}
          fileName={selectedFile.name}
          onClose={() => {
            setShowPreview(false);
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          onDownload={() => {
            const url = URL.createObjectURL(selectedFile);
            const link = document.createElement('a');
            link.href = url;
            link.download = selectedFile.name;
            link.click();
            URL.revokeObjectURL(url);
          }}
        />
      )}
    </>
  );
}
```

### Preview from URL (Already Uploaded Files)

```jsx
<FilePreview
  file={null}
  fileUrl="https://example.com/document.pdf"
  fileName="document.pdf"
  onClose={() => setShowPreview(false)}
  onDownload={() => {
    window.open(fileUrl, '_blank');
  }}
/>
```

## Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `file` | File | No* | The File object to preview (use when previewing before upload) |
| `fileUrl` | string | No* | URL to the file (use when previewing already uploaded files) |
| `fileName` | string | Yes | Name of the file (for display) |
| `onClose` | function | Yes | Callback when user closes the preview modal |
| `onDownload` | function | No | Callback when user clicks download button |

\* Either `file` or `fileUrl` must be provided.

## Supported File Types

### Images
- Formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg`
- Rendering: Native `<img>` tag with responsive sizing
- Features: Automatic scaling, error handling

### PDFs
- Formats: `.pdf`
- Library: PDF.js
- Rendering: Canvas-based rendering
- Features: Shows first page (can be extended for multi-page)

### Excel Files
- Formats: `.xlsx`, `.xls`
- Library: SheetJS (xlsx)
- Rendering: HTML table with styling
- Features: Shows first sheet, styled table with hover effects

### Word Documents
- Formats: `.docx`
- Library: Mammoth.js
- Rendering: HTML conversion
- Features: Preserves formatting, tables, headings

### Unsupported Types
- Shows friendly fallback message
- Provides download button
- Displays file icon

## File Type Detection

The component automatically detects file types using:
1. File extension (from filename)
2. MIME type (from File object)
3. Fallback to 'unsupported' if neither matches

## Styling

The component uses Tailwind CSS classes and is fully responsive. The modal:
- Has a maximum width of `5xl` (1024px)
- Maximum height of `90vh`
- Centers content with proper spacing
- Includes loading states and error messages

## Error Handling

The component handles various error scenarios:
- Failed PDF loading → Shows error message with download option
- Failed Excel parsing → Shows error message with download option
- Failed Word conversion → Shows error message with download option
- Missing file → Shows error message
- Unsupported type → Shows fallback UI

## Performance Considerations

- **PDF.js**: Uses worker threads for non-blocking PDF rendering
- **Excel**: Only loads first sheet for performance (can be extended)
- **Word**: Converts to HTML once, cached in component state
- **Images**: Uses native browser rendering (fastest)

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- PDF.js requires Web Workers support
- File API support required for file selection

## Integration with Existing Code

The component has been integrated into:
- `DocumentsPage.jsx`: For previewing uploaded documents
- Can be used in any component that needs file preview functionality

## Example: Immediate Preview on File Selection

```jsx
const handleFileSelect = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    // Immediately show preview
    setPreviewFile(file);
    setShowPreview(true);
  }
};

// Later, upload the file
const handleUpload = async () => {
  if (previewFile) {
    const formData = new FormData();
    formData.append('file', previewFile);
    // Upload logic...
  }
};
```

## Troubleshooting

### PDF not loading
- Check that PDF.js worker is accessible
- Verify CORS settings if loading from different domain
- Check browser console for errors

### Excel/Word not rendering
- Ensure `xlsx` and `mammoth` packages are installed
- Check that file is valid format
- Verify file is not corrupted

### Preview not showing
- Check that either `file` or `fileUrl` prop is provided
- Verify `fileName` prop is set
- Check browser console for errors

## Future Enhancements

Potential improvements:
- Multi-page PDF navigation
- Multiple Excel sheet navigation
- Word document page navigation
- Zoom controls for images/PDFs
- Print functionality
- Full-screen mode




