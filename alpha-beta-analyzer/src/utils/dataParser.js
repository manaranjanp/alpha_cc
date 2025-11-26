import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parse as parseDate } from 'date-fns';
import { DATE_FORMAT } from '../constants/config';

/**
 * Parse CSV file using Papa Parse
 * @param {File} file - The CSV file to parse
 * @returns {Promise<Object>} Parsed data object
 */
const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false, // Keep as strings to handle dates
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
};

/**
 * Parse XLSX file using SheetJS
 * @param {File} file - The XLSX file to parse
 * @returns {Promise<Array>} Parsed data array
 */
const parseXLSX = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false, // Keep as strings
          defval: '',
        });

        if (jsonData.length < 2) {
          reject(new Error('XLSX file must have header row and at least one data row'));
          return;
        }

        // Convert array format to object format with headers
        const headers = jsonData[0];
        const rows = jsonData.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        resolve(rows);
      } catch (error) {
        reject(new Error(`XLSX parsing error: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Detect available columns from parsed data
 * @param {Array} data - Parsed data array
 * @returns {Object} Available columns categorized
 */
const detectColumns = (data) => {
  if (!data || data.length === 0) {
    return { dateColumn: null, stockColumns: [], indexColumns: [] };
  }

  const headers = Object.keys(data[0]);

  // Detect date column (case-insensitive)
  const dateColumn = headers.find(h =>
    h.toLowerCase().includes('date') ||
    h.toLowerCase() === 'day' ||
    h.toLowerCase() === 'time'
  ) || headers[0]; // Default to first column if no date column found

  // Other columns are potential stock/index columns
  const valueColumns = headers.filter(h => h !== dateColumn);

  // Try to detect index columns (containing keywords like 'index', 'nifty', 's&p', 'market')
  const indexKeywords = ['index', 'nifty', 's&p', 'sp', 'market', 'benchmark'];
  const indexColumns = valueColumns.filter(col =>
    indexKeywords.some(keyword => col.toLowerCase().includes(keyword.toLowerCase()))
  );

  // Remaining columns are stock columns
  const stockColumns = valueColumns.filter(col => !indexColumns.includes(col));

  return {
    dateColumn,
    stockColumns,
    indexColumns: indexColumns.length > 0 ? indexColumns : valueColumns.slice(-1), // Last column as index if none detected
    allColumns: headers,
  };
};

/**
 * Parse and structure data from file
 * @param {Array} rawData - Raw parsed data
 * @param {Object} columnInfo - Column information
 * @returns {Object} Structured data object
 */
const structureData = (rawData, columnInfo) => {
  const { dateColumn, stockColumns, indexColumns } = columnInfo;

  // Initialize data structure
  const structuredData = {
    dates: [],
    columns: {},
    metadata: {
      startDate: null,
      endDate: null,
      totalRows: 0,
      dateColumn,
    },
  };

  // Initialize columns
  [...stockColumns, ...indexColumns].forEach(col => {
    structuredData.columns[col] = [];
  });

  // Parse each row
  rawData.forEach((row, index) => {
    const dateStr = row[dateColumn];
    if (!dateStr) return; // Skip rows with no date

    // Parse date
    try {
      const date = parseDate(dateStr, DATE_FORMAT, new Date());
      if (isNaN(date.getTime())) {
        // Invalid date, skip this row
        return;
      }

      structuredData.dates.push(date);

      // Parse price columns
      [...stockColumns, ...indexColumns].forEach(col => {
        const value = row[col];
        const numValue = value ? parseFloat(value.toString().replace(/,/g, '')) : null;
        structuredData.columns[col].push(numValue);
      });
    } catch (error) {
      // Skip invalid date rows
      return;
    }
  });

  // Set metadata
  if (structuredData.dates.length > 0) {
    structuredData.metadata.startDate = structuredData.dates[0];
    structuredData.metadata.endDate = structuredData.dates[structuredData.dates.length - 1];
    structuredData.metadata.totalRows = structuredData.dates.length;
  }

  return structuredData;
};

/**
 * Main function to parse file and return structured data
 * @param {File} file - The file to parse (CSV or XLSX)
 * @returns {Promise<Object>} Structured data object
 */
export const parseFile = async (file) => {
  try {
    const fileName = file.name.toLowerCase();
    let rawData;

    if (fileName.endsWith('.csv')) {
      rawData = await parseCSV(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      rawData = await parseXLSX(file);
    } else {
      throw new Error('Unsupported file type. Please upload CSV or XLSX file.');
    }

    // Detect columns
    const columnInfo = detectColumns(rawData);

    // Structure data
    const structuredData = structureData(rawData, columnInfo);

    return {
      ...structuredData,
      columnInfo,
      rawData, // Keep raw data for reference
    };
  } catch (error) {
    throw error;
  }
};

export default parseFile;
