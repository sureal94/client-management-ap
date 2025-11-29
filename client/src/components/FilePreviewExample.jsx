/**
 * Example Usage of FilePreview Component
 * 
 * This file demonstrates how to use the FilePreview component
 * with a file input button that shows immediate preview when a file is selected.
 */

import { useState, useRef } from 'react';
import FilePreview from './FilePreview';
import { Upload } from 'lucide-react';

const FilePreviewExample = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection - show preview immediately
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowPreview(true);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedFile.name;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Reset file selection
  const handleClose = () => {
    setShowPreview(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">File Preview Example</h2>
      
      {/* File Input Button */}
      <div className="mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.xlsx,.xls,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Select File to Preview
        </button>
      </div>

      {/* Show selected file info */}
      {selectedFile && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Selected:</strong> {selectedFile.name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
          <p className="text-sm text-gray-600">
            <strong>Type:</strong> {selectedFile.type || 'Unknown'}
          </p>
        </div>
      )}

      {/* File Preview Modal */}
      {showPreview && selectedFile && (
        <FilePreview
          file={selectedFile}
          fileUrl={null}
          fileName={selectedFile.name}
          onClose={handleClose}
          onDownload={handleDownload}
        />
      )}

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Supported File Types:</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li><strong>Images:</strong> JPG, PNG, GIF, BMP, WebP, SVG</li>
          <li><strong>PDFs:</strong> Rendered using PDF.js</li>
          <li><strong>Excel:</strong> .xlsx, .xls files rendered as HTML tables using SheetJS</li>
          <li><strong>Word:</strong> .docx files rendered as HTML using Mammoth.js</li>
          <li><strong>Unsupported:</strong> Shows fallback message with download option</li>
        </ul>
      </div>
    </div>
  );
};

export default FilePreviewExample;



