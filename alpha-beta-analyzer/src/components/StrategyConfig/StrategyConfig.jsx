import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { calculateMultipleWeeklyReturns, alignWeeklyReturns, filterByPeriod } from '../../utils/returnCalculations';
import { performAlphaBetaAnalysis } from '../../utils/regressionEngine';
import { calculateRollingAlphaBeta, checkRollingDataSufficiency } from '../../utils/rollingCalculations';
import { CALCULATION_PERIODS } from '../../constants/config';

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

  const handleContinue = () => {
    if (!selectedStock || !selectedIndex) {
      alert('Please select both a stock and a market index.');
      return;
    }

    // Perform calculations
    calculateAnalysis();
  };

  const calculateAnalysis = () => {
    if (!parsedData || !selectedStock || !selectedIndex) return;

    try {
      // Calculate weekly returns
      const returns = calculateMultipleWeeklyReturns(
        parsedData.dates,
        {
          [selectedStock]: parsedData.columns[selectedStock],
          [selectedIndex]: parsedData.columns[selectedIndex],
        },
        false
      );

      // Align the returns
      const aligned = alignWeeklyReturns(returns);

      setWeeklyReturnsData(returns);
      setAlignedData(aligned);

      // Filter data by period
      const filteredData = filterByPeriod(aligned, period);

      if (filteredData.length >= 2) {
        // Extract returns
        const stockReturns = filteredData.map(week => week[selectedStock].return);
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
          stockName: selectedStock,
          indexName: selectedIndex,
        };

        setAnalysisResults(analysisResults);

        // Calculate rolling analysis
        const sufficiency = checkRollingDataSufficiency(aligned);

        if (sufficiency.isSufficient) {
          const rolling = calculateRollingAlphaBeta(
            aligned,
            selectedStock,
            selectedIndex,
            parseFloat(riskFreeRate)
          );

          setRollingResults({
            insufficient: false,
            data: rolling,
            stockName: selectedStock,
            indexName: selectedIndex,
          });
        } else {
          setRollingResults({ insufficient: true, message: sufficiency.message });
        }

        // Set simulation results (for stepper logic)
        setSimulationResults([analysisResults]);

        // Move to results step
        setCurrentStep('results');
      }
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
        {/* Currency Selection (displayed but not functional in this version) */}
        <div>
          <label className="label">Currency</label>
          <select className="input-field" defaultValue="USD">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Stock Selection */}
        <div>
          <label className="label">Select Stock</label>
          <select
            className="input-field"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <option value="">-- Select Stock --</option>
            {stockColumns.map((stock) => (
              <option key={stock} value={stock}>
                {stock}
              </option>
            ))}
          </select>
        </div>

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
          <label className="label">Risk-Free Rate (%)</label>
          <input
            type="number"
            className="input-field"
            value={riskFreeRate}
            onChange={(e) => setRiskFreeRate(parseFloat(e.target.value))}
            min="0"
            max="20"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">Annualized risk-free rate (typically 3-6% for government bonds)</p>
        </div>

        {/* Analysis Period */}
        <div>
          <label className="label">Analysis Period</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="period"
                value={CALCULATION_PERIODS.THREE_YEARS}
                checked={period === CALCULATION_PERIODS.THREE_YEARS}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="mr-2"
              />
              <span>3 Years</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="period"
                value={CALCULATION_PERIODS.FIVE_YEARS}
                checked={period === CALCULATION_PERIODS.FIVE_YEARS}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="mr-2"
              />
              <span>5 Years</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setCurrentStep('upload')}
            className="btn-secondary flex-1"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            className="btn-primary flex-1"
            disabled={!selectedStock || !selectedIndex}
          >
            Continue to Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default StrategyConfig;
