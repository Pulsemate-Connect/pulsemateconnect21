import React, { useRef, useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

const FileUpload = ({
  label,
  name,
  description,
  required = false,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5, // MB
  onChange,
  value,
  error,
  multiple = false,
  showPreview = false, // New prop for image preview
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate file size
    const oversizedFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    if (multiple) {
      onChange(fileArray);
    } else {
      onChange(fileArray[0]);
      
      // Generate preview for image files
      if (showPreview && fileArray[0] && fileArray[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(fileArray[0]);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = (index) => {
    if (multiple && Array.isArray(value)) {
      const newValue = value.filter((_, i) => i !== index);
      onChange(newValue.length > 0 ? newValue : null);
    } else {
      onChange(null);
      setPreviewUrl(null);
    }
  };

  const files = multiple && Array.isArray(value) ? value : value ? [value] : [];
  const hasFiles = files.length > 0;

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : hasFiles
            ? 'border-green-300 bg-green-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
          ${showPreview && previewUrl ? 'p-0' : 'p-6'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {!hasFiles ? (
          <div className="text-center p-6">
            <Upload className={`mx-auto w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="mt-2 text-sm font-medium text-gray-700">
              Drag & drop or click to upload
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {accept.replace(/\./g, '').toUpperCase()} (Max {maxSize}MB)
            </p>
          </div>
        ) : showPreview && previewUrl ? (
          // Image Preview Mode
          <div className="relative group">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(0);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex items-center gap-2 text-white">
                <CheckCircle className="w-4 h-4" />
                <p className="text-xs font-medium truncate">{files[0]?.name}</p>
              </div>
            </div>
          </div>
        ) : (
          // List Mode (for PDFs or multiple files)
          <div className="space-y-2 p-6">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 flex-1">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name || 'Uploaded file'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.size ? formatFileSize(file.size) : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="ml-2 p-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
