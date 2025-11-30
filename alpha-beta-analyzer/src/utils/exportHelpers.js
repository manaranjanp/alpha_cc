import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of data objects
 * @param {Array} headers - Optional array of header names
 * @returns {string} CSV formatted string
 */
const arrayToCSV = (data, headers = null) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const headerRow = headers || Object.keys(data[0]);

  // Escape and quote cell values
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) {
      return '';
    }

    const cellStr = String(cell);

    // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }

    return cellStr;
  };

  // Build CSV
  const csvRows = [];

  // Add header row
  csvRows.push(headerRow.map(escapeCell).join(','));

  // Add data rows
  data.forEach(row => {
    const values = headerRow.map(header => escapeCell(row[header]));
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Generate filename with timestamp
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension (without dot)
 * @returns {string} Generated filename
 */
const generateFilename = (prefix, extension) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const sanitizedPrefix = prefix.replace(/[^a-z0-9_-]/gi, '_');
  return `${sanitizedPrefix}_${timestamp}.${extension}`;
};

/**
 * Export data as CSV file
 * @param {Array} data - Array of data objects
 * @param {string} filename - Desired filename (without extension)
 * @param {Array} headers - Optional custom headers
 */
export const exportToCSV = (data, filename, headers = null) => {
  try {
    const csvContent = arrayToCSV(data, headers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const fullFilename = filename.endsWith('.csv') ? filename : generateFilename(filename, 'csv');

    saveAs(blob, fullFilename);
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('Failed to export CSV file');
  }
};

/**
 * Export weekly returns table to CSV
 * @param {Array} weeklyReturnsData - Weekly returns data
 * @param {string} stockName - Name of the stock
 * @param {string} indexName - Name of the market index
 */
export const exportWeeklyReturnsCSV = (weeklyReturnsData, stockName, indexName) => {
  const data = weeklyReturnsData.map(week => ({
    'Week Ending Date': format(week.weekEndDate, 'dd/MM/yyyy'),
    [`${stockName} Price`]: week[stockName]?.price?.toFixed(2) || '',
    [`${stockName} Return (%)`]: week[stockName]?.return?.toFixed(2) || '',
    [`${indexName} Value`]: week[indexName]?.price?.toFixed(2) || '',
    [`${indexName} Return (%)`]: week[indexName]?.return?.toFixed(2) || '',
  }));

  exportToCSV(data, `weekly_returns_${stockName}`);
};

/**
 * Export rolling analysis table to CSV
 * @param {Array} rollingData - Rolling analysis data
 * @param {string} stockName - Name of the stock (optional, for filtering)
 */
export const exportRollingAnalysisCSV = (rollingData, stockName = null) => {
  const data = rollingData.map(item => ({
    'Quarter': item.quarter,
    'Stock Name': item.stockName,
    'Alpha (%)': item.alpha.toFixed(4),
    'Beta': item.beta.toFixed(4),
    'R-Squared': item.rSquared.toFixed(4),
    'Period Start': format(item.dataPeriodStart, 'dd/MM/yyyy'),
    'Period End': format(item.dataPeriodEnd, 'dd/MM/yyyy'),
  }));

  const filename = stockName
    ? `rolling_analysis_${stockName}`
    : 'rolling_analysis_all_stocks';

  exportToCSV(data, filename);
};

/**
 * Export comparison table to CSV
 * @param {Array} comparisonData - Comparison data for multiple stocks
 */
export const exportComparisonCSV = (comparisonData) => {
  const data = comparisonData.map(item => ({
    'Stock Name': item.stockName,
    'Alpha 3Y (%)': item.alpha3Y.toFixed(4),
    'Alpha 5Y (%)': item.alpha5Y.toFixed(4),
    'Beta 3Y': item.beta3Y.toFixed(4),
    'Beta 5Y': item.beta5Y.toFixed(4),
    'R-Squared': item.rSquared.toFixed(4),
    'Avg Rolling Alpha (%)': item.avgRollingAlpha.toFixed(4),
    'Alpha Trend': item.alphaTrend,
  }));

  exportToCSV(data, 'stock_comparison_report');
};

/**
 * Export chart as PNG image
 * @param {HTMLElement} chartElement - Chart element or container
 * @param {string} filename - Desired filename (without extension)
 * @returns {Promise} Promise that resolves when export is complete
 */
export const exportChartAsPNG = async (chartElement, filename) => {
  try {
    if (!chartElement) {
      throw new Error('Chart element not found');
    }

    // Capture the element as canvas
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
      logging: false,
      useCORS: true,
    });

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const fullFilename = filename.endsWith('.png') ? filename : generateFilename(filename, 'png');
      saveAs(blob, fullFilename);
    });
  } catch (error) {
    console.error('PNG export error:', error);
    throw new Error('Failed to export chart as PNG');
  }
};

/**
 * Export analysis results as comprehensive CSV report
 * @param {Object} analysisResults - Complete analysis results
 * @param {string} stockName - Name of the stock
 */
export const exportFullReport = (analysisResults, stockName) => {
  const { alpha, beta, rSquared, standardError, statistics } = analysisResults;

  const data = [
    { 'Metric': 'Alpha (%)', 'Value': alpha.toFixed(4) },
    { 'Metric': 'Beta', 'Value': beta.toFixed(4) },
    { 'Metric': 'R-Squared', 'Value': rSquared.toFixed(4) },
    { 'Metric': 'Standard Error', 'Value': standardError.toFixed(6) },
    { 'Metric': 'Mean Stock Return (%)', 'Value': statistics.meanStockReturn.toFixed(4) },
    { 'Metric': 'Mean Market Return (%)', 'Value': statistics.meanMarketReturn.toFixed(4) },
    { 'Metric': 'Stock Std Dev (%)', 'Value': statistics.stdStockReturn.toFixed(4) },
    { 'Metric': 'Market Std Dev (%)', 'Value': statistics.stdMarketReturn.toFixed(4) },
    { 'Metric': 'Correlation', 'Value': statistics.correlation.toFixed(4) },
    { 'Metric': 'Data Points', 'Value': statistics.dataPointsCount },
  ];

  exportToCSV(data, `full_report_${stockName}`);
};

export default {
  exportToCSV,
  exportWeeklyReturnsCSV,
  exportRollingAnalysisCSV,
  exportComparisonCSV,
  exportChartAsPNG,
  exportFullReport,
};
