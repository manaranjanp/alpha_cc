import Decimal from 'decimal.js';
import * as ss from 'simple-statistics';
import { WEEKS_PER_YEAR } from '../constants/config';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate covariance between two arrays
 * @param {Array} x - First array of values
 * @param {Array} y - Second array of values
 * @returns {number} Covariance
 */
const calculateCovariance = (x, y) => {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Arrays must have the same non-zero length');
  }

  const n = x.length;

  // Calculate means using Decimal.js
  const meanX = x.reduce((sum, val) => sum.plus(new Decimal(val)), new Decimal(0)).div(n);
  const meanY = y.reduce((sum, val) => sum.plus(new Decimal(val)), new Decimal(0)).div(n);

  // Calculate covariance
  const covariance = x.reduce((sum, xVal, i) => {
    const diffX = new Decimal(xVal).minus(meanX);
    const diffY = new Decimal(y[i]).minus(meanY);
    return sum.plus(diffX.times(diffY));
  }, new Decimal(0)).div(n);

  return covariance.toNumber();
};

/**
 * Calculate variance of an array
 * @param {Array} values - Array of values
 * @returns {number} Variance
 */
const calculateVariance = (values) => {
  if (values.length === 0) {
    throw new Error('Array must have non-zero length');
  }

  const n = values.length;

  // Calculate mean using Decimal.js
  const mean = values.reduce((sum, val) => sum.plus(new Decimal(val)), new Decimal(0)).div(n);

  // Calculate variance
  const variance = values.reduce((sum, val) => {
    const diff = new Decimal(val).minus(mean);
    return sum.plus(diff.pow(2));
  }, new Decimal(0)).div(n);

  return variance.toNumber();
};

/**
 * Calculate mean of an array
 * @param {Array} values - Array of values
 * @returns {number} Mean
 */
const calculateMean = (values) => {
  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce((acc, val) => acc.plus(new Decimal(val)), new Decimal(0));
  return sum.div(values.length).toNumber();
};

/**
 * Calculate standard deviation
 * @param {Array} values - Array of values
 * @returns {number} Standard deviation
 */
const calculateStandardDeviation = (values) => {
  const variance = calculateVariance(values);
  return Math.sqrt(variance);
};

/**
 * Calculate Pearson correlation coefficient
 * @param {Array} x - First array of values
 * @param {Array} y - Second array of values
 * @returns {number} Correlation coefficient (-1 to 1)
 */
const calculateCorrelation = (x, y) => {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Arrays must have the same non-zero length');
  }

  const covariance = calculateCovariance(x, y);
  const stdX = calculateStandardDeviation(x);
  const stdY = calculateStandardDeviation(y);

  if (stdX === 0 || stdY === 0) {
    return 0;
  }

  return covariance / (stdX * stdY);
};

/**
 * Calculate beta (β)
 * Beta = Covariance(Stock Returns, Market Returns) / Variance(Market Returns)
 * @param {Array} stockReturns - Array of stock return values
 * @param {Array} marketReturns - Array of market return values
 * @returns {number} Beta
 */
export const calculateBeta = (stockReturns, marketReturns) => {
  if (stockReturns.length !== marketReturns.length || stockReturns.length === 0) {
    throw new Error('Stock and market returns must have the same non-zero length');
  }

  const covariance = calculateCovariance(stockReturns, marketReturns);
  const marketVariance = calculateVariance(marketReturns);

  if (marketVariance === 0) {
    throw new Error('Market variance is zero - cannot calculate beta');
  }

  const beta = new Decimal(covariance).div(new Decimal(marketVariance));

  return beta.toNumber();
};

/**
 * Calculate alpha (α) using CAPM
 * Alpha = Mean(Stock Returns) - [Risk-Free Rate + β × (Mean(Market Returns) - Risk-Free Rate)]
 * @param {Array} stockReturns - Array of stock return values (weekly %)
 * @param {Array} marketReturns - Array of market return values (weekly %)
 * @param {number} beta - Beta coefficient
 * @param {number} riskFreeRate - Annual risk-free rate (%)
 * @returns {number} Annualized alpha (%)
 */
export const calculateAlpha = (stockReturns, marketReturns, beta, riskFreeRate) => {
  // Calculate mean returns
  const meanStockReturn = calculateMean(stockReturns);
  const meanMarketReturn = calculateMean(marketReturns);

  // Convert annual risk-free rate to weekly
  const weeklyRiskFreeRate = riskFreeRate / WEEKS_PER_YEAR;

  // Calculate expected return using CAPM
  // E(R) = Rf + β × (E(Rm) - Rf)
  const expectedReturn = new Decimal(weeklyRiskFreeRate)
    .plus(new Decimal(beta).times(new Decimal(meanMarketReturn).minus(weeklyRiskFreeRate)));

  // Alpha = Actual Return - Expected Return
  const weeklyAlpha = new Decimal(meanStockReturn).minus(expectedReturn);

  // Annualize alpha
  const annualizedAlpha = weeklyAlpha.times(WEEKS_PER_YEAR);

  return annualizedAlpha.toNumber();
};

/**
 * Calculate R-squared (R²)
 * R² = Correlation(Stock, Market)²
 * @param {Array} stockReturns - Array of stock return values
 * @param {Array} marketReturns - Array of market return values
 * @returns {number} R-squared (0 to 1)
 */
export const calculateRSquared = (stockReturns, marketReturns) => {
  const correlation = calculateCorrelation(stockReturns, marketReturns);
  return Math.pow(correlation, 2);
};

/**
 * Perform linear regression
 * @param {Array} x - Independent variable (market returns)
 * @param {Array} y - Dependent variable (stock returns)
 * @returns {Object} Regression results
 */
export const performLinearRegression = (x, y) => {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Arrays must have the same non-zero length');
  }

  // Use simple-statistics for linear regression
  const data = x.map((xVal, i) => [xVal, y[i]]);
  const regression = ss.linearRegression(data);
  const regressionLine = ss.linearRegressionLine(regression);

  return {
    slope: regression.m,
    intercept: regression.b,
    equation: `y = ${regression.m.toFixed(4)}x + ${regression.b.toFixed(4)}`,
    regressionLine,
  };
};

/**
 * Calculate standard error of regression
 * @param {Array} stockReturns - Array of stock return values
 * @param {Array} marketReturns - Array of market return values
 * @param {Object} regression - Regression results
 * @returns {number} Standard error
 */
export const calculateStandardError = (stockReturns, marketReturns, regression) => {
  const n = stockReturns.length;

  // Calculate residuals
  const residuals = stockReturns.map((y, i) => {
    const predicted = regression.slope * marketReturns[i] + regression.intercept;
    return y - predicted;
  });

  // Calculate sum of squared residuals
  const sumSquaredResiduals = residuals.reduce((sum, residual) => {
    return sum.plus(new Decimal(residual).pow(2));
  }, new Decimal(0));

  // Standard error = sqrt(SSR / (n - 2))
  const standardError = sumSquaredResiduals.div(n - 2).sqrt();

  return standardError.toNumber();
};

/**
 * Main function to perform complete alpha and beta analysis
 * @param {Array} stockReturns - Array of stock return values (weekly %)
 * @param {Array} marketReturns - Array of market return values (weekly %)
 * @param {number} riskFreeRate - Annual risk-free rate (%)
 * @returns {Object} Complete analysis results
 */
export const performAlphaBetaAnalysis = (stockReturns, marketReturns, riskFreeRate) => {
  try {
    if (!stockReturns || !marketReturns || stockReturns.length === 0 || marketReturns.length === 0) {
      throw new Error('Stock and market returns must be non-empty arrays');
    }

    if (stockReturns.length !== marketReturns.length) {
      throw new Error('Stock and market returns must have the same length');
    }

    if (stockReturns.length < 2) {
      throw new Error('At least 2 data points required for analysis');
    }

    // Calculate beta
    const beta = calculateBeta(stockReturns, marketReturns);

    // Calculate alpha
    const alpha = calculateAlpha(stockReturns, marketReturns, beta, riskFreeRate);

    // Calculate R-squared
    const rSquared = calculateRSquared(stockReturns, marketReturns);

    // Perform linear regression
    const regression = performLinearRegression(marketReturns, stockReturns);

    // Calculate standard error
    const standardError = calculateStandardError(stockReturns, marketReturns, regression);

    // Prepare data points for scatter plot
    const dataPoints = stockReturns.map((stockReturn, i) => ({
      x: marketReturns[i],
      y: stockReturn,
    }));

    return {
      alpha,
      beta,
      rSquared,
      standardError,
      regression,
      dataPoints,
      statistics: {
        meanStockReturn: calculateMean(stockReturns),
        meanMarketReturn: calculateMean(marketReturns),
        stdStockReturn: calculateStandardDeviation(stockReturns),
        stdMarketReturn: calculateStandardDeviation(marketReturns),
        correlation: calculateCorrelation(stockReturns, marketReturns),
        dataPointsCount: stockReturns.length,
      },
    };
  } catch (error) {
    throw new Error(`Alpha/Beta calculation error: ${error.message}`);
  }
};

export default {
  calculateBeta,
  calculateAlpha,
  calculateRSquared,
  performLinearRegression,
  calculateStandardError,
  performAlphaBetaAnalysis,
};
