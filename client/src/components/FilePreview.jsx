import { useState, useEffect, useRef } from "react";
import { File, Download, X, Loader2 } from "lucide-react";
import * as XLSX from "xlsx"; // STATIC import (required for Vite)

const FilePreview = ({ file, fileUrl, fileName, onClose, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [imageObjectURL, setImageObjectURL] = useState(null);
  const [pdfObjectURL, setPdfObjectURL] = useState(null);
  const previewContainerRef = useRef(null);

  /** Detect File Type */
  const detectFileType = (name, fileObj) => {
    const lower = (name || "").toLowerCase();
    const mime = fileObj?.type || "";

    if (lower.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) || mime.startsWith("image/")) return "image";

    if (lower.endsWith(".pdf") || mime === "application/pdf") return "pdf";

    if (lower.match(/\.(xlsx|xls)$/)) return "excel";

    if (lower.endsWith(".docx") || mime.includes("wordprocessingml")) return "word";

    return "unsupported";
  };

  /** PDF Preview (FIXED — No download popup) */
  const loadPDF = async (fileObj, url) => {
    try {
      let pdfURL = url;

      if (fileObj) {
        const buffer = await fileObj.arrayBuffer();
        const blob = new Blob([buffer], { type: "application/pdf" });
        const objURL = URL.createObjectURL(blob);
        setPdfObjectURL(objURL);
        pdfURL = objURL;
      }

      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.src = pdfURL;
        iframe.style.width = "100%";
        iframe.style.height = "calc(90vh - 120px)";
        iframe.style.border = "none";
        previewContainerRef.current.appendChild(iframe);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load PDF");
      setLoading(false);
    }
  };

  /** Excel Preview (FIXED — Uses static XLSX import) */
  const loadExcel = async (fileObj, url) => {
    try {
      let buffer;

      if (fileObj) buffer = await fileObj.arrayBuffer();
      else if (url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
        }
        buffer = await response.arrayBuffer();
      }
      else throw new Error("No file data");

      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheet];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const table = document.createElement("table");
      table.style.borderCollapse = "collapse";
      table.style.width = "100%";

      if (json.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 1;
        td.textContent = "No data in this Excel file";
        td.style.padding = "20px";
        td.style.textAlign = "center";
        tr.appendChild(td);
        table.appendChild(tr);
      } else {
        json.forEach((row, index) => {
          const tr = document.createElement("tr");
          if (!Array.isArray(row) || row.length === 0) {
            const td = document.createElement("td");
            td.textContent = "";
            td.style.border = "1px solid #ddd";
            td.style.padding = "8px";
            tr.appendChild(td);
          } else {
            row.forEach((cell) => {
              const td = document.createElement(index === 0 ? "th" : "td");
              td.textContent = cell != null ? String(cell) : "";
              td.style.border = "1px solid #ddd";
              td.style.padding = "8px";
              if (index === 0) td.style.background = "#f3f3f3";
              tr.appendChild(td);
            });
          }
          table.appendChild(tr);
        });
      }

      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = "";
        previewContainerRef.current.appendChild(table);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load Excel file");
      setLoading(false);
    }
  };

  /** Word Preview */
  const loadWord = async (fileObj, url) => {
    try {
      // Import mammoth - use standard import
      const mammothModule = await import("mammoth");
      const mammoth = mammothModule.default || mammothModule;
      
      if (!mammoth || typeof mammoth.convertToHtml !== 'function') {
        throw new Error('Failed to load mammoth');
      }

      let buffer;

      if (fileObj) buffer = await fileObj.arrayBuffer();
      else if (url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch Word document: ${response.status} ${response.statusText}`);
        }
        buffer = await response.arrayBuffer();
      }
      else throw new Error("No file data");

      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });

      const div = document.createElement("div");
      div.className = "prose max-w-none p-4";
      div.innerHTML = result.value;

      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = "";
        previewContainerRef.current.appendChild(div);
      }

      setLoading(false);
    } catch (err) {
      setError("Unable to preview Word document");
      setLoading(false);
    }
  };

  /** Load Preview */
  useEffect(() => {
    if (!file && !fileUrl) {
      setError("No file provided");
      setLoading(false);
      return;
    }

    const type = detectFileType(fileName || file?.name, file);
    setFileType(type);
    setLoading(true);
    setError(null);

    if (previewContainerRef.current) previewContainerRef.current.innerHTML = "";

    const load = async () => {
      switch (type) {
        case "image":
          setLoading(false);
          break;

        case "pdf":
          await loadPDF(file, fileUrl);
          break;

        case "excel":
          await loadExcel(file, fileUrl);
          break;

        case "word":
          await loadWord(file, fileUrl);
          break;

        default:
          setError("Unsupported file type");
          setLoading(false);
          break;
      }
    };

    load();
  }, [file, fileUrl, fileName]);

  /** Image Source */
  const getImageSrc = () => {
    if (fileUrl) return fileUrl;
    if (imageObjectURL) return imageObjectURL;
    return null;
  };

  useEffect(() => {
    if (fileType === "image" && file && !imageObjectURL) {
      try {
        const url = URL.createObjectURL(file);
        setImageObjectURL(url);
      } catch (err) {
        console.error('Error creating object URL for image:', err);
        setError('Failed to load image');
      }
    }
  }, [file, fileType, imageObjectURL]);

  /** Cleanup */
  useEffect(() => {
    return () => {
      if (imageObjectURL) URL.revokeObjectURL(imageObjectURL);
      if (pdfObjectURL) URL.revokeObjectURL(pdfObjectURL);
    };
  }, [imageObjectURL, pdfObjectURL]);

  /** Render Content */
  const renderPreview = () => {
    if (loading)
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      );

    if (error)
      return (
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">{error}</p>
          {onDownload && (
            <button onClick={onDownload} className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Download File
            </button>
          )}
        </div>
      );

    if (fileType === "image") {
      const imageSrc = getImageSrc();
      if (!imageSrc) {
        return (
          <div className="text-center p-8">
            <p className="text-gray-600">Failed to load image</p>
          </div>
        );
      }
      return (
        <div className="flex justify-center p-4">
          <img 
            src={imageSrc} 
            className="max-h-[80vh] object-contain" 
            alt="preview"
            onError={(e) => {
              console.error('Image load error');
              setError('Failed to load image');
            }}
          />
        </div>
      );
    }

    return <div ref={previewContainerRef} className="p-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">{fileName || file?.name || "File Preview"}</h3>
          <div className="flex gap-2">
            {onDownload && (
              <button className="p-2 text-blue-600" onClick={onDownload}>
                <Download />
              </button>
            )}
            <button className="p-2 text-gray-600" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-50 overflow-auto">{renderPreview()}</div>
      </div>
    </div>
  );
};

export default FilePreview;
