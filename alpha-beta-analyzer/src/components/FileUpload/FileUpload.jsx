import { useState, useRef } from 'react';

const FileUpload = ({ onFileUpload, isLoading, validationReport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-blue-50'
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div>
            <p className="text-lg font-medium text-gray-700">
              {isLoading ? 'Processing...' : 'Drag & Drop CSV/XLSX file here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            <p className="font-medium">Required columns:</p>
            <p>Date (mm-dd-yyyy), Stock Prices, Market Index</p>
          </div>
        </div>
      </div>

      {validationReport && (
        <div className="mt-4">
          {validationReport.errors && validationReport.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
              <p className="font-medium text-red-800 mb-2">Errors:</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validationReport.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationReport.warnings && validationReport.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
              <p className="font-medium text-yellow-800 mb-2">Warnings:</p>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {validationReport.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validationReport.isValid && validationReport.stats && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-800 mb-2">File loaded successfully!</p>
              <div className="text-sm text-green-700 space-y-1">
                <p>Total rows: {validationReport.stats.validRows}</p>
                <p>Columns: {validationReport.stats.columnCount}</p>
                <p>
                  Date range: {validationReport.stats.dateRange.start?.toLocaleDateString()} -{' '}
                  {validationReport.stats.dateRange.end?.toLocaleDateString()}
                </p>
                <p>Years of data: {validationReport.stats.yearsOfData}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
