import Decimal from 'decimal.js';
import { endOfWeek, isFriday, isAfter, isBefore, parseISO, format } from 'date-fns';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Group daily data by week
 * @param {Array} dates - Array of date objects
 * @param {Array} prices - Array of price values
 * @returns {Array} Array of weekly data points
 */
const groupByWeek = (dates, prices) => {
  const weeklyData = [];
  let currentWeek = null;
  let weekData = [];

  dates.forEach((date, index) => {
    const price = prices[index];

    if (price === null || price === undefined || isNaN(price)) {
      return; // Skip invalid prices
    }

    // Get end of week (Friday) for this date
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
    const weekKey = format(weekEnd, 'yyyy-MM-dd');

    if (currentWeek !== weekKey) {
      // New week, save previous week if exists
      if (weekData.length > 0) {
        weeklyData.push({
          weekEndDate: currentWeek,
          data: weekData,
        });
      }

      // Start new week
      currentWeek = weekKey;
      weekData = [];
    }

    weekData.push({ date, price });
  });

  // Add last week
  if (weekData.length > 0) {
    weeklyData.push({
      weekEndDate: currentWeek,
      data: weekData,
    });
  }

  return weeklyData;
};

/**
 * Calculate weekly returns from daily prices
 * @param {Array} dates - Array of date objects
 * @param {Array} prices - Array of price values
 * @param {boolean} useLogReturns - Whether to use logarithmic returns
 * @returns {Array} Array of weekly return data
 */
export const calculateWeeklyReturns = (dates, prices, useLogReturns = false) => {
  if (!dates || !prices || dates.length !== prices.length || dates.length === 0) {
    return [];
  }

  // Group data by week
  const weeklyData = groupByWeek(dates, prices);

  const weeklyReturns = [];

  for (let i = 1; i < weeklyData.length; i++) {
    const currentWeek = weeklyData[i];
    const previousWeek = weeklyData[i - 1];

    // Get last trading day price for each week
    const currentWeekPrice = currentWeek.data[currentWeek.data.length - 1].price;
    const previousWeekPrice = previousWeek.data[previousWeek.data.length - 1].price;

    if (previousWeekPrice <= 0 || currentWeekPrice <= 0) {
      continue; // Skip if invalid prices
    }

    // Calculate return using Decimal.js for precision
    let returnValue;

    if (useLogReturns) {
      // Logarithmic return: ln(P1 / P0)
      const ratio = new Decimal(currentWeekPrice).div(new Decimal(previousWeekPrice));
      returnValue = ratio.ln();
    } else {
      // Simple return: (P1 - P0) / P0 * 100
      const priceChange = new Decimal(currentWeekPrice).minus(new Decimal(previousWeekPrice));
      returnValue = priceChange.div(new Decimal(previousWeekPrice)).times(100);
    }

    weeklyReturns.push({
      weekEndDate: parseISO(currentWeek.weekEndDate),
      price: currentWeekPrice,
      return: returnValue.toNumber(),
      previousPrice: previousWeekPrice,
    });
  }

  return weeklyReturns;
};

/**
 * Calculate returns for multiple columns (stocks and index)
 * @param {Array} dates - Array of date objects
 * @param {Object} columns - Object with column names as keys and price arrays as values
 * @param {boolean} useLogReturns - Whether to use logarithmic returns
 * @returns {Object} Object with column names as keys and weekly returns as values
 */
export const calculateMultipleWeeklyReturns = (dates, columns, useLogReturns = false) => {
  const results = {};

  Object.keys(columns).forEach(columnName => {
    const prices = columns[columnName];
    results[columnName] = calculateWeeklyReturns(dates, prices, useLogReturns);
  });

  return results;
};

/**
 * Align weekly returns across multiple columns
 * Ensures all columns have returns for the same weeks
 * @param {Object} weeklyReturnsData - Object with column names as keys and weekly returns as values
 * @returns {Array} Array of aligned weekly data
 */
export const alignWeeklyReturns = (weeklyReturnsData) => {
  const columnNames = Object.keys(weeklyReturnsData);

  if (columnNames.length === 0) {
    return [];
  }

  // Get all unique week end dates
  const allDates = new Set();
  columnNames.forEach(col => {
    weeklyReturnsData[col].forEach(week => {
      allDates.add(week.weekEndDate.toISOString());
    });
  });

  // Convert to sorted array
  const sortedDates = Array.from(allDates)
    .map(d => new Date(d))
    .sort((a, b) => a - b);

  // Build aligned data structure
  const alignedData = [];

  sortedDates.forEach(date => {
    const weekData = {
      weekEndDate: date,
    };

    let hasAllColumns = true;

    // Check if all columns have data for this week
    columnNames.forEach(col => {
      const weekReturn = weeklyReturnsData[col].find(
        w => w.weekEndDate.toISOString() === date.toISOString()
      );

      if (weekReturn) {
        weekData[col] = {
          price: weekReturn.price,
          return: weekReturn.return,
        };
      } else {
        hasAllColumns = false;
      }
    });

    // Only include weeks where all columns have data
    if (hasAllColumns) {
      alignedData.push(weekData);
    }
  });

  return alignedData;
};

/**
 * Calculate summary statistics for returns
 * @param {Array} returns - Array of return values
 * @returns {Object} Summary statistics
 */
export const calculateReturnStatistics = (returns) => {
  if (!returns || returns.length === 0) {
    return {
      mean: 0,
      standardDeviation: 0,
      min: 0,
      max: 0,
      count: 0,
    };
  }

  // Calculate mean using Decimal.js
  const sum = returns.reduce((acc, val) => acc.plus(new Decimal(val)), new Decimal(0));
  const mean = sum.div(returns.length);

  // Calculate standard deviation
  const squaredDiffs = returns.map(val =>
    new Decimal(val).minus(mean).pow(2)
  );
  const variance = squaredDiffs.reduce((acc, val) => acc.plus(val), new Decimal(0)).div(returns.length);
  const standardDeviation = variance.sqrt();

  // Find min and max
  const numReturns = returns.map(r => Number(r));
  const min = Math.min(...numReturns);
  const max = Math.max(...numReturns);

  return {
    mean: mean.toNumber(),
    standardDeviation: standardDeviation.toNumber(),
    min,
    max,
    count: returns.length,
  };
};

/**
 * Filter weekly returns by period (number of weeks)
 * @param {Array} weeklyReturns - Array of weekly return data
 * @param {number} weeks - Number of weeks to include from the end
 * @returns {Array} Filtered weekly returns
 */
export const filterByPeriod = (weeklyReturns, weeks) => {
  if (!weeklyReturns || weeklyReturns.length === 0) {
    return [];
  }

  if (weeklyReturns.length <= weeks) {
    return weeklyReturns;
  }

  return weeklyReturns.slice(-weeks);
};

export default {
  calculateWeeklyReturns,
  calculateMultipleWeeklyReturns,
  alignWeeklyReturns,
  calculateReturnStatistics,
  filterByPeriod,
};
