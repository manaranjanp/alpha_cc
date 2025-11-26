import { differenceInYears } from 'date-fns';
import { VALIDATION_RULES } from '../constants/config';

/**
 * Validate date values
 * @param {Array} dates - Array of date objects
 * @returns {Object} Validation result
 */
const validateDates = (dates) => {
  const errors = [];
  const warnings = [];

  if (!dates || dates.length === 0) {
    errors.push('No valid dates found in the data.');
    return { isValid: false, errors, warnings };
  }

  // Check for invalid dates
  const invalidDateIndices = [];
  dates.forEach((date, index) => {
    if (!date || isNaN(date.getTime())) {
      invalidDateIndices.push(index + 2); // +2 for 1-based index and header row
    }
  });

  if (invalidDateIndices.length > 0) {
    errors.push(`Invalid dates found in rows: ${invalidDateIndices.slice(0, 10).join(', ')}${invalidDateIndices.length > 10 ? '...' : ''}`);
  }

  return {
    isValid: invalidDateIndices.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate price values
 * @param {Object} columns - Object with column data
 * @returns {Object} Validation result
 */
const validatePrices = (columns) => {
  const errors = [];
  const warnings = [];

  const columnNames = Object.keys(columns);

  if (columnNames.length === 0) {
    errors.push('No price columns found in the data.');
    return { isValid: false, errors, warnings };
  }

  // Check each column for invalid values
  columnNames.forEach(colName => {
    const values = columns[colName];
    const invalidIndices = [];
    const missingIndices = [];

    values.forEach((value, index) => {
      if (value === null || value === undefined || value === '') {
        missingIndices.push(index + 2);
      } else if (isNaN(value) || value <= 0) {
        invalidIndices.push(index + 2);
      }
    });

    if (invalidIndices.length > 0) {
      errors.push(`Invalid price values in column "${colName}" (rows: ${invalidIndices.slice(0, 5).join(', ')}${invalidIndices.length > 5 ? '...' : ''})`);
    }

    if (missingIndices.length > 0) {
      const percentage = (missingIndices.length / values.length * 100).toFixed(1);
      warnings.push(`Missing values in column "${colName}": ${missingIndices.length} rows (${percentage}%)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Check data span requirements
 * @param {Date} startDate - First date in data
 * @param {Date} endDate - Last date in data
 * @returns {Object} Validation result
 */
const validateDataSpan = (startDate, endDate) => {
  const errors = [];
  const warnings = [];

  if (!startDate || !endDate) {
    errors.push('Unable to determine data date range.');
    return { isValid: false, errors, warnings, yearsOfData: 0 };
  }

  const yearsOfData = differenceInYears(endDate, startDate);

  if (yearsOfData < VALIDATION_RULES.MIN_DATA_YEARS) {
    warnings.push(`Only ${yearsOfData} years of data available. Minimum ${VALIDATION_RULES.MIN_DATA_YEARS} years recommended for rolling analysis.`);
  }

  return {
    isValid: true,
    errors,
    warnings,
    yearsOfData,
  };
};

/**
 * Detect data gaps
 * @param {Array} dates - Array of date objects
 * @returns {Object} Gap analysis
 */
const detectGaps = (dates) => {
  const warnings = [];

  if (!dates || dates.length < 2) {
    return { warnings };
  }

  // Calculate average gap between dates
  const gaps = [];
  for (let i = 1; i < dates.length; i++) {
    const gap = Math.abs(dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24); // Days
    gaps.push(gap);
  }

  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

  // Find large gaps (more than 2x average)
  const largeGaps = gaps.filter(gap => gap > avgGap * 2).length;

  if (largeGaps > 0) {
    warnings.push(`Detected ${largeGaps} significant gaps in data. This may affect accuracy of calculations.`);
  }

  return { warnings };
};

/**
 * Main validation function
 * @param {Object} parsedData - Parsed data object from dataParser
 * @returns {Object} Comprehensive validation report
 */
export const validateData = (parsedData) => {
  if (!parsedData) {
    return {
      isValid: false,
      errors: ['No data provided for validation.'],
      warnings: [],
      stats: null,
    };
  }

  const { dates, columns, metadata } = parsedData;

  // Collect all validation results
  const allErrors = [];
  const allWarnings = [];

  // Validate dates
  const dateValidation = validateDates(dates);
  allErrors.push(...dateValidation.errors);
  allWarnings.push(...dateValidation.warnings);

  // Validate prices
  const priceValidation = validatePrices(columns);
  allErrors.push(...priceValidation.errors);
  allWarnings.push(...priceValidation.warnings);

  // Validate data span
  const spanValidation = validateDataSpan(metadata.startDate, metadata.endDate);
  allErrors.push(...spanValidation.errors);
  allWarnings.push(...spanValidation.warnings);

  // Detect gaps
  const gapAnalysis = detectGaps(dates);
  allWarnings.push(...gapAnalysis.warnings);

  // Calculate valid rows
  const validRows = dates.length;
  const totalRows = metadata.totalRows;

  // Build statistics
  const stats = {
    totalRows,
    validRows,
    invalidRows: totalRows - validRows,
    dateRange: {
      start: metadata.startDate,
      end: metadata.endDate,
    },
    yearsOfData: spanValidation.yearsOfData || 0,
    columns: Object.keys(columns),
    columnCount: Object.keys(columns).length,
  };

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    stats,
  };
};

/**
 * Validate risk-free rate input
 * @param {number} rate - Risk-free rate percentage
 * @returns {Object} Validation result
 */
export const validateRiskFreeRate = (rate) => {
  const numRate = parseFloat(rate);

  if (isNaN(numRate)) {
    return {
      isValid: false,
      error: 'Risk-free rate must be a number.',
    };
  }

  if (numRate < VALIDATION_RULES.RISK_FREE_RATE_MIN || numRate > VALIDATION_RULES.RISK_FREE_RATE_MAX) {
    return {
      isValid: false,
      error: `Risk-free rate must be between ${VALIDATION_RULES.RISK_FREE_RATE_MIN}% and ${VALIDATION_RULES.RISK_FREE_RATE_MAX}%.`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
};

/**
 * Validate file before parsing
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('No file selected.');
    return { isValid: false, errors };
  }

  // Check file type
  const fileName = file.name.toLowerCase();
  const validType = VALIDATION_RULES.SUPPORTED_FILE_TYPES.some(type => fileName.endsWith(type));

  if (!validType) {
    errors.push(`Invalid file type. Supported types: ${VALIDATION_RULES.SUPPORTED_FILE_TYPES.join(', ')}`);
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > VALIDATION_RULES.MAX_FILE_SIZE_MB) {
    errors.push(`File size (${fileSizeMB.toFixed(2)}MB) exceeds ${VALIDATION_RULES.MAX_FILE_SIZE_MB}MB limit.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default validateData;
