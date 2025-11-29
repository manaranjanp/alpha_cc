import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { parseFile } from '../../utils/dataParser';
import { validateData, validateFile } from '../../utils/dataValidator';

const FileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const setCurrentStep = useStore(state => state.setCurrentStep);
  const setDataLoaded = useStore(state => state.setDataLoaded);
  const setParsedData = useStore(state => state.setParsedData);
  const setValidationReport = useStore(state => state.setValidationReport);
  const setStockColumns = useStore(state => state.setStockColumns);
  const setIndexColumns = useStore(state => state.setIndexColumns);
  const setSelectedStock = useStore(state => state.setSelectedStock);
  const setSelectedIndex = useStore(state => state.setSelectedIndex);
  const validationReport = useStore(state => state.validationReport);

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
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setValidationReport(null);
    setParsedData(null);

    try {
      // Validate file
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        setValidationReport({
          isValid: false,
          errors: fileValidation.errors,
          warnings: [],
        });
        setIsLoading(false);
        return;
      }

      // Parse file
      const data = await parseFile(file);

      // Validate parsed data
      const validation = validateData(data);
      setValidationReport(validation);

      if (validation.isValid || validation.warnings.length > 0) {
        setParsedData(data);
        setDataLoaded(true);

        // Set available columns
        const stocks = data.columnInfo.stockColumns;
        const indices = data.columnInfo.indexColumns;

        setStockColumns(stocks);
        setIndexColumns(indices);

        // Auto-select first stock and index
        if (stocks.length > 0) {
          setSelectedStock(stocks[0]);
        }
        if (indices.length > 0) {
          setSelectedIndex(indices[0]);
        }
      }
    } catch (error) {
      setValidationReport({
        isValid: false,
        errors: [error.message],
        warnings: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Price Data</h2>
      <p className="text-gray-600 mb-6">Upload a CSV or Excel file with historical price data. Your file must contain at least "Date" and "Closing Price" columns.</p>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">📌 Date format example:</span> yyyy-mm-dd (e.g., 2024-01-15)
          </p>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-primary-600 bg-primary-50'
            : 'border-gray-300 hover:border-primary-600 bg-gray-50'
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

        <div className="flex flex-col items-center">
          <svg
            className={`w-16 h-16 mb-4 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-xl font-semibold text-gray-900 mb-2">
            {isLoading ? 'Processing...' : 'Drop your file here or click to browse'}
          </p>
          <p className="text-gray-500 mb-4">Supports CSV and Excel files (max 10MB)</p>

          <button className="btn-primary">
            {isLoading ? 'Loading...' : 'Select File'}
          </button>
        </div>
      </div>

      {validationReport && (
        <div className="mt-6">
          {validationReport.errors && validationReport.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
              <p className="font-semibold text-red-800 mb-2">❌ Errors:</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validationReport.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationReport.warnings && validationReport.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
              <p className="font-semibold text-yellow-800 mb-2">⚠️ Warnings:</p>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {validationReport.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validationReport.isValid && validationReport.stats && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-800 mb-3">✅ File loaded successfully!</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Rows</p>
                  <p className="font-semibold text-gray-900">{validationReport.stats.validRows}</p>
                </div>
                <div>
                  <p className="text-gray-600">Columns</p>
                  <p className="font-semibold text-gray-900">{validationReport.stats.columnCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date Range</p>
                  <p className="font-semibold text-gray-900">
                    {validationReport.stats.dateRange.start?.toLocaleDateString()} - {validationReport.stats.dateRange.end?.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Years of Data</p>
                  <p className="font-semibold text-gray-900">{validationReport.stats.yearsOfData}</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setCurrentStep('configure')}
                  className="btn-primary w-full"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
