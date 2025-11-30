// Configuration constants for Stock Alpha & Beta Analyzer

export const ROLLING_WINDOW_WEEKS = 156; // 3 years
export const ROLLING_INTERVAL_WEEKS = 13; // 3 months (quarterly)
export const MAX_STOCKS_COMPARISON = 5;
export const DEFAULT_RISK_FREE_RATE = 5; // 5%
export const DATE_FORMAT = 'dd/MM/yyyy';
export const WEEKS_PER_YEAR = 52;

// Calculation periods in weeks
export const CALCULATION_PERIODS = {
  THREE_YEARS: 156,
  FIVE_YEARS: 260,
};

// Chart colors (colorblind-friendly palette)
export const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // orange
  '#EF4444', // red
  '#8B5CF6', // purple
];

// Data validation rules
export const VALIDATION_RULES = {
  MIN_DATA_YEARS: 3,
  MAX_FILE_SIZE_MB: 10,
  RISK_FREE_RATE_MIN: 0,
  RISK_FREE_RATE_MAX: 20,
  SUPPORTED_FILE_TYPES: ['.csv', '.xlsx', '.xls'],
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Please upload a CSV or XLSX file.',
  FILE_TOO_LARGE: 'File size exceeds 10MB limit.',
  INVALID_DATE_FORMAT: 'Date format must be dd/mm/yyyy.',
  MISSING_COLUMNS: 'Required columns missing: Date, Stock Prices, and Market Index.',
  INSUFFICIENT_DATA: 'Minimum 3 years of data required for analysis.',
  INVALID_PRICE_DATA: 'Invalid price data detected (zero, negative, or non-numeric values).',
  CALCULATION_ERROR: 'Unable to calculate alpha and beta. Please check your data.',
};

// Chart.js default options
export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#ddd',
      borderWidth: 1,
    },
  },
};
