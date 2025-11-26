import { format, addWeeks, startOfQuarter, addQuarters } from 'date-fns';
import { ROLLING_WINDOW_WEEKS, ROLLING_INTERVAL_WEEKS } from '../constants/config';
import { performAlphaBetaAnalysis } from './regressionEngine';

/**
 * Extract returns for a specific column from aligned data
 * @param {Array} alignedData - Aligned weekly returns data
 * @param {string} columnName - Name of the column to extract
 * @returns {Array} Array of return values
 */
const extractReturns = (alignedData, columnName) => {
  return alignedData
    .filter(week => week[columnName] && week[columnName].return !== null)
    .map(week => week[columnName].return);
};

/**
 * Get quarterly calculation points
 * @param {Date} startDate - Start date of the rolling analysis
 * @param {Date} endDate - End date of the rolling analysis
 * @returns {Array} Array of quarterly dates
 */
const getQuarterlyPoints = (startDate, endDate) => {
  const quarterlyDates = [];
  let currentDate = startOfQuarter(startDate);

  while (currentDate <= endDate) {
    if (currentDate >= startDate) {
      quarterlyDates.push(currentDate);
    }
    currentDate = addQuarters(currentDate, 1);
  }

  return quarterlyDates;
};

/**
 * Format quarter label
 * @param {Date} date - Date to format
 * @returns {string} Formatted quarter label (e.g., "Q1 2020")
 */
const formatQuarter = (date) => {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const year = date.getFullYear();
  return `Q${quarter} ${year}`;
};

/**
 * Calculate rolling alpha and beta for a single stock
 * @param {Array} alignedData - Aligned weekly returns data
 * @param {string} stockName - Name of the stock column
 * @param {string} indexName - Name of the market index column
 * @param {number} riskFreeRate - Annual risk-free rate (%)
 * @returns {Array} Array of rolling analysis results
 */
export const calculateRollingAlphaBeta = (
  alignedData,
  stockName,
  indexName,
  riskFreeRate
) => {
  if (!alignedData || alignedData.length < ROLLING_WINDOW_WEEKS) {
    return [];
  }

  const rollingResults = [];

  // Start from the first point where we have enough data for a full window
  // Calculate at quarterly intervals
  for (let i = ROLLING_WINDOW_WEEKS; i <= alignedData.length; i += ROLLING_INTERVAL_WEEKS) {
    // Get the window of data (lookback period)
    const windowStart = i - ROLLING_WINDOW_WEEKS;
    const windowEnd = i;
    const windowData = alignedData.slice(windowStart, windowEnd);

    if (windowData.length < ROLLING_WINDOW_WEEKS) {
      continue; // Skip if we don't have enough data
    }

    // Extract returns for this window
    const stockReturns = extractReturns(windowData, stockName);
    const marketReturns = extractReturns(windowData, indexName);

    if (stockReturns.length < 2 || marketReturns.length < 2) {
      continue; // Skip if insufficient data
    }

    try {
      // Perform alpha/beta analysis for this window
      const analysis = performAlphaBetaAnalysis(stockReturns, marketReturns, riskFreeRate);

      const calculationDate = alignedData[windowEnd - 1].weekEndDate;
      const dataPeriodStart = windowData[0].weekEndDate;
      const dataPeriodEnd = windowData[windowData.length - 1].weekEndDate;

      rollingResults.push({
        quarter: formatQuarter(calculationDate),
        date: calculationDate,
        dataPeriodStart,
        dataPeriodEnd,
        alpha: analysis.alpha,
        beta: analysis.beta,
        rSquared: analysis.rSquared,
        stockName,
        dataPoints: stockReturns.length,
      });
    } catch (error) {
      // Skip this window if calculation fails
      console.warn(`Rolling calculation failed for ${stockName} at index ${i}:`, error.message);
      continue;
    }
  }

  return rollingResults;
};

/**
 * Calculate rolling alpha and beta for multiple stocks
 * @param {Array} alignedData - Aligned weekly returns data
 * @param {Array} stockNames - Array of stock column names
 * @param {string} indexName - Name of the market index column
 * @param {number} riskFreeRate - Annual risk-free rate (%)
 * @returns {Object} Object with stock names as keys and rolling results as values
 */
export const calculateMultipleRollingAlphaBeta = (
  alignedData,
  stockNames,
  indexName,
  riskFreeRate
) => {
  const results = {};

  stockNames.forEach(stockName => {
    results[stockName] = calculateRollingAlphaBeta(
      alignedData,
      stockName,
      indexName,
      riskFreeRate
    );
  });

  return results;
};

/**
 * Calculate trend for alpha values (increasing, decreasing, or stable)
 * @param {Array} rollingData - Array of rolling analysis results
 * @returns {string} Trend indicator: '↑' (increasing), '↓' (decreasing), '→' (stable)
 */
export const calculateAlphaTrend = (rollingData) => {
  if (!rollingData || rollingData.length < 2) {
    return '→';
  }

  // Take first and last 3 points for comparison
  const firstPoints = rollingData.slice(0, Math.min(3, rollingData.length));
  const lastPoints = rollingData.slice(Math.max(0, rollingData.length - 3));

  const avgFirst = firstPoints.reduce((sum, item) => sum + item.alpha, 0) / firstPoints.length;
  const avgLast = lastPoints.reduce((sum, item) => sum + item.alpha, 0) / lastPoints.length;

  const change = avgLast - avgFirst;
  const threshold = 0.5; // 0.5% threshold for trend

  if (change > threshold) {
    return '↑';
  } else if (change < -threshold) {
    return '↓';
  } else {
    return '→';
  }
};

/**
 * Calculate average rolling alpha
 * @param {Array} rollingData - Array of rolling analysis results
 * @returns {number} Average alpha
 */
export const calculateAverageRollingAlpha = (rollingData) => {
  if (!rollingData || rollingData.length === 0) {
    return 0;
  }

  const sum = rollingData.reduce((acc, item) => acc + item.alpha, 0);
  return sum / rollingData.length;
};

/**
 * Get comparison data for multiple stocks
 * @param {Object} rollingResults - Object with stock names as keys and rolling results as values
 * @param {Object} staticResults - Object with stock names as keys and static analysis results
 * @returns {Array} Array of comparison data objects
 */
export const getComparisonData = (rollingResults, staticResults) => {
  const comparisonData = [];

  Object.keys(rollingResults).forEach(stockName => {
    const rollingData = rollingResults[stockName];
    const staticData = staticResults[stockName] || {};

    comparisonData.push({
      stockName,
      alpha3Y: staticData.alpha3Y || 0,
      alpha5Y: staticData.alpha5Y || 0,
      beta3Y: staticData.beta3Y || 0,
      beta5Y: staticData.beta5Y || 0,
      rSquared: staticData.rSquared5Y || 0,
      avgRollingAlpha: calculateAverageRollingAlpha(rollingData),
      alphaTrend: calculateAlphaTrend(rollingData),
    });
  });

  return comparisonData;
};

/**
 * Check if there's sufficient data for rolling analysis
 * @param {Array} alignedData - Aligned weekly returns data
 * @returns {Object} Sufficiency check result
 */
export const checkRollingDataSufficiency = (alignedData) => {
  const required = ROLLING_WINDOW_WEEKS;
  const available = alignedData ? alignedData.length : 0;

  return {
    isSufficient: available >= required,
    required,
    available,
    message: available < required
      ? `Insufficient data for rolling analysis. Need ${required} weeks, have ${available} weeks.`
      : `Sufficient data available for rolling analysis.`,
  };
};

export default {
  calculateRollingAlphaBeta,
  calculateMultipleRollingAlphaBeta,
  calculateAlphaTrend,
  calculateAverageRollingAlpha,
  getComparisonData,
  checkRollingDataSufficiency,
};
