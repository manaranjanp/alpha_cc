import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { calculateMultipleWeeklyReturns, alignWeeklyReturns, filterByPeriod } from '../../utils/returnCalculations';
import { performAlphaBetaAnalysis } from '../../utils/regressionEngine';
import { calculateRollingAlphaBeta, checkRollingDataSufficiency } from '../../utils/rollingCalculations';
import { CALCULATION_PERIODS, ROLLING_WINDOW_WEEKS } from '../../constants/config';

function StrategyConfig() {
  const stockColumns = useStore(state => state.stockColumns);
  const indexColumns = useStore(state => state.indexColumns);
  const selectedStock = useStore(state => state.selectedStock);
  const selectedIndex = useStore(state => state.selectedIndex);
  const riskFreeRate = useStore(state => state.riskFreeRate);
  const period = useStore(state => state.period);
  const parsedData = useStore(state => state.parsedData);

  const setSelectedStock = useStore(state => state.setSelectedStock);
  const setSelectedIndex = useStore(state => state.setSelectedIndex);
  const setRiskFreeRate = useStore(state => state.setRiskFreeRate);
  const setPeriod = useStore(state => state.setPeriod);
  const setCurrentStep = useStore(state => state.setCurrentStep);
  const setWeeklyReturnsData = useStore(state => state.setWeeklyReturnsData);
  const setAlignedData = useStore(state => state.setAlignedData);
  const setAnalysisResults = useStore(state => state.setAnalysisResults);
  const setRollingResults = useStore(state => state.setRollingResults);
  const setSimulationResults = useStore(state => state.setSimulationResults);

  const handleContinue = (e) => {
    e.preventDefault();

    if (!selectedIndex) {
      alert('Please select a market index.');
      return;
    }

    if (!parsedData) {
      alert('No data available. Please upload a file first.');
      return;
    }

    // Perform calculations
    calculateAnalysis();
  };

  const calculateAnalysis = () => {
    if (!parsedData || !selectedIndex) return;

    try {
      // Prepare columns for calculation: all stocks + index
      const columnsToCalculate = {};
      stockColumns.forEach(stock => {
        columnsToCalculate[stock] = parsedData.columns[stock];
      });
      columnsToCalculate[selectedIndex] = parsedData.columns[selectedIndex];

      // Calculate weekly returns for all stocks and index
      const returns = calculateMultipleWeeklyReturns(
        parsedData.dates,
        columnsToCalculate,
        false
      );

      // Align the returns
      const aligned = alignWeeklyReturns(returns);

      setWeeklyReturnsData(returns);
      setAlignedData(aligned);

      // Filter data by period
      const filteredData = filterByPeriod(aligned, period);

      if (filteredData.length < 2) {
        alert('Insufficient data for the selected period. Please select a different period or upload more historical data.');
        return;
      }

      // Set the first stock as selected if no stock is selected
      const stockToAnalyze = selectedStock || stockColumns[0];
      if (!selectedStock && stockColumns.length > 0) {
        setSelectedStock(stockColumns[0]);
      }

      // Extract returns for the first stock
      const stockReturns = filteredData.map(week => week[stockToAnalyze].return);
      const marketReturns = filteredData.map(week => week[selectedIndex].return);

      // Perform analysis
      const results = performAlphaBetaAnalysis(
        stockReturns,
        marketReturns,
        parseFloat(riskFreeRate)
      );

      const analysisResults = {
        ...results,
        weeklyData: filteredData,
        period,
        stockName: stockToAnalyze,
        indexName: selectedIndex,
      };

      setAnalysisResults(analysisResults);

      // Calculate rolling analysis
      // Rolling needs full aligned data for lookback, but we want results for the selected period
      const rollingMinRequired = period + ROLLING_WINDOW_WEEKS;
      const sufficiency = {
        isSufficient: aligned.length >= rollingMinRequired,
        required: rollingMinRequired,
        available: aligned.length,
        message: aligned.length < rollingMinRequired
          ? `Insufficient data for rolling analysis in the selected period. Need ${rollingMinRequired} weeks (${period} weeks for selected period + ${ROLLING_WINDOW_WEEKS} weeks for lookback), have ${aligned.length} weeks.`
          : `Sufficient data available for rolling analysis.`,
      };

      if (sufficiency.isSufficient) {
        // Calculate rolling using full aligned dataset
        const rolling = calculateRollingAlphaBeta(
          aligned,
          stockToAnalyze,
          selectedIndex,
          parseFloat(riskFreeRate)
        );

        // Filter rolling results to only include those within the selected period
        const periodStartDate = filteredData.length > 0 ? filteredData[0].weekEndDate : null;
        const filteredRolling = periodStartDate
          ? rolling.filter(r => new Date(r.date) >= new Date(periodStartDate))
          : rolling;

        setRollingResults({
          insufficient: false,
          data: filteredRolling,
          stockName: stockToAnalyze,
          indexName: selectedIndex,
        });
      } else {
        setRollingResults({ insufficient: true, message: sufficiency.message });
      }

      // Set simulation results (for stepper logic)
      setSimulationResults([analysisResults]);

      // Move to results step
      setCurrentStep('results');
    } catch (error) {
      console.error('Error calculating analysis:', error);
      alert('Error calculating analysis: ' + error.message);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Strategies</h2>
      <p className="text-gray-600 mb-6">Select and configure strategies</p>

      <div className="space-y-6">
        {/* Configuration Row: Market Index and Risk-Free Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Market Index Selection */}
          <div>
            <label className="label">Select Market Index</label>
            <select
              className="input-field"
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
            >
              <option value="">-- Select Index --</option>
              {indexColumns.map((index) => (
                <option key={index} value={index}>
                  {index}
                </option>
              ))}
            </select>
          </div>

          {/* Risk-Free Rate */}
          <div>
            <label className="label">Annualized Risk-Free Rate (%)</label>
            <input
              type="number"
              className="input-field"
              value={riskFreeRate}
              onChange={(e) => setRiskFreeRate(parseFloat(e.target.value))}
              min="0"
              max="20"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">Annual risk-free rate (typically 3-6% for government bonds)</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setCurrentStep('upload')}
            className="btn-secondary flex-1"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="btn-primary flex-1"
            disabled={!selectedIndex}
          >
            Calculate Weekly Returns
          </button>
        </div>
      </div>
    </div>
  );
}

export default StrategyConfig;
