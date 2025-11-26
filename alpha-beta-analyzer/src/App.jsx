import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload/FileUpload';
import GlobalSettings from './components/GlobalSettings/GlobalSettings';
import { parseFile } from './utils/dataParser';
import { validateData, validateFile } from './utils/dataValidator';
import { calculateMultipleWeeklyReturns, alignWeeklyReturns, filterByPeriod } from './utils/returnCalculations';
import { performAlphaBetaAnalysis } from './utils/regressionEngine';
import { calculateRollingAlphaBeta, checkRollingDataSufficiency } from './utils/rollingCalculations';
import { DEFAULT_RISK_FREE_RATE, CALCULATION_PERIODS } from './constants/config';

function App() {
  // File and data state
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  // User settings
  const [stockColumns, setStockColumns] = useState([]);
  const [indexColumns, setIndexColumns] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('');
  const [riskFreeRate, setRiskFreeRate] = useState(DEFAULT_RISK_FREE_RATE);
  const [period, setPeriod] = useState(CALCULATION_PERIODS.FIVE_YEARS);

  // Analysis results
  const [weeklyReturnsData, setWeeklyReturnsData] = useState(null);
  const [alignedData, setAlignedData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [rollingResults, setRollingResults] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('static');

  // Handle file upload
  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setValidationReport(null);
    setParsedData(null);
    setAnalysisResults(null);
    setRollingResults(null);

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

        // Set available columns
        const stocks = data.columnInfo.stockColumns;
        const indices = data.columnInfo.indexColumns;

        setStockColumns(stocks);
        setIndexColumns(indices);

        // Auto-select first stock and index
        if (stocks.length > 0 && !selectedStock) {
          setSelectedStock(stocks[0]);
        }
        if (indices.length > 0 && !selectedIndex) {
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

  // Calculate weekly returns when data or selections change
  useEffect(() => {
    if (!parsedData || !selectedStock || !selectedIndex) {
      setWeeklyReturnsData(null);
      setAlignedData(null);
      return;
    }

    try {
      // Calculate weekly returns for selected stock and index
      const returns = calculateMultipleWeeklyReturns(
        parsedData.dates,
        {
          [selectedStock]: parsedData.columns[selectedStock],
          [selectedIndex]: parsedData.columns[selectedIndex],
        },
        false // Use simple returns, not log returns
      );

      // Align the returns
      const aligned = alignWeeklyReturns(returns);

      setWeeklyReturnsData(returns);
      setAlignedData(aligned);
    } catch (error) {
      console.error('Error calculating weekly returns:', error);
      setWeeklyReturnsData(null);
      setAlignedData(null);
    }
  }, [parsedData, selectedStock, selectedIndex]);

  // Perform static analysis when aligned data or settings change
  useEffect(() => {
    if (!alignedData || alignedData.length === 0 || !selectedStock || !selectedIndex) {
      setAnalysisResults(null);
      return;
    }

    try {
      // Filter data by period
      const filteredData = filterByPeriod(alignedData, period);

      if (filteredData.length < 2) {
        setAnalysisResults(null);
        return;
      }

      // Extract returns
      const stockReturns = filteredData.map(week => week[selectedStock].return);
      const marketReturns = filteredData.map(week => week[selectedIndex].return);

      // Perform analysis
      const results = performAlphaBetaAnalysis(
        stockReturns,
        marketReturns,
        parseFloat(riskFreeRate)
      );

      setAnalysisResults({
        ...results,
        weeklyData: filteredData,
        period,
        stockName: selectedStock,
        indexName: selectedIndex,
      });
    } catch (error) {
      console.error('Error performing analysis:', error);
      setAnalysisResults(null);
    }
  }, [alignedData, selectedStock, selectedIndex, riskFreeRate, period]);

  // Calculate rolling analysis
  useEffect(() => {
    if (!alignedData || alignedData.length === 0 || !selectedStock || !selectedIndex) {
      setRollingResults(null);
      return;
    }

    try {
      // Check if we have sufficient data
      const sufficiency = checkRollingDataSufficiency(alignedData);

      if (!sufficiency.isSufficient) {
        setRollingResults({ insufficient: true, message: sufficiency.message });
        return;
      }

      // Calculate rolling alpha and beta
      const rolling = calculateRollingAlphaBeta(
        alignedData,
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
    } catch (error) {
      console.error('Error calculating rolling analysis:', error);
      setRollingResults(null);
    }
  }, [alignedData, selectedStock, selectedIndex, riskFreeRate]);

  // Check if analysis is ready
  const isAnalysisReady = analysisResults !== null;
  const isRollingReady = rollingResults && !rollingResults.insufficient;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Stock Alpha & Beta Analyzer
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Calculate and visualize stock performance metrics using regression analysis
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* File Upload Section */}
        <div className="mb-6">
          <FileUpload
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            validationReport={validationReport}
          />
        </div>

        {/* Settings Section */}
        {parsedData && validationReport?.isValid && (
          <>
            <GlobalSettings
              stockColumns={stockColumns}
              indexColumns={indexColumns}
              selectedStock={selectedStock}
              setSelectedStock={setSelectedStock}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              riskFreeRate={riskFreeRate}
              setRiskFreeRate={setRiskFreeRate}
              period={period}
              setPeriod={setPeriod}
              disabled={isLoading}
            />

            {/* Tabs and Content */}
            {isAnalysisReady && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-4 px-4">
                    <button
                      onClick={() => setActiveTab('static')}
                      className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'static'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      Alpha & Beta Analysis
                    </button>
                    <button
                      onClick={() => setActiveTab('rolling')}
                      className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'rolling'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      Rolling Trends
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'static' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        {selectedStock} vs {selectedIndex} ({period / 52} Year Analysis)
                      </h2>

                      {/* Metrics Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Alpha</p>
                          <p className={`text-2xl font-bold ${analysisResults.alpha > 0 ? 'text-success' : 'text-danger'}`}>
                            {analysisResults.alpha > 0 ? '+' : ''}
                            {analysisResults.alpha.toFixed(2)}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {analysisResults.alpha > 0 ? 'Outperforming' : 'Underperforming'} market
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Beta</p>
                          <p className={`text-2xl font-bold ${analysisResults.beta > 1.2 || analysisResults.beta < 0.8 ? 'font-extrabold' : ''}`}>
                            {analysisResults.beta.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.abs((analysisResults.beta - 1) * 100).toFixed(0)}%{' '}
                            {analysisResults.beta > 1 ? 'more' : 'less'} volatile
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">R-Squared</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analysisResults.rSquared.toFixed(3)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(analysisResults.rSquared * 100).toFixed(0)}% variance explained
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Data Points</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analysisResults.statistics.dataPointsCount}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Weekly returns analyzed
                          </p>
                        </div>
                      </div>

                      {/* Statistics Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-blue-900 mb-2">Statistical Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-blue-700">Mean Stock Return</p>
                            <p className="font-medium text-blue-900">
                              {analysisResults.statistics.meanStockReturn.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-700">Mean Market Return</p>
                            <p className="font-medium text-blue-900">
                              {analysisResults.statistics.meanMarketReturn.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-700">Stock Volatility</p>
                            <p className="font-medium text-blue-900">
                              {analysisResults.statistics.stdStockReturn.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-700">Correlation</p>
                            <p className="font-medium text-blue-900">
                              {analysisResults.statistics.correlation.toFixed(3)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p className="mb-2">
                          <strong>Interpretation:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>
                            <strong>Alpha:</strong> {selectedStock}{' '}
                            {analysisResults.alpha > 0 ? 'generated' : 'lost'}{' '}
                            {Math.abs(analysisResults.alpha).toFixed(2)}% excess return compared to expected return.
                          </li>
                          <li>
                            <strong>Beta:</strong> {selectedStock} is{' '}
                            {Math.abs((analysisResults.beta - 1) * 100).toFixed(0)}%{' '}
                            {analysisResults.beta > 1 ? 'more' : 'less'} volatile than {selectedIndex}.
                          </li>
                          <li>
                            <strong>R²:</strong> {(analysisResults.rSquared * 100).toFixed(0)}% of {selectedStock}'s
                            price movement can be explained by {selectedIndex} movements.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'rolling' && (
                    <div>
                      {isRollingReady ? (
                        <>
                          <h2 className="text-xl font-semibold mb-4">
                            Rolling Alpha & Beta Trends for {selectedStock}
                          </h2>

                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800">
                              Rolling analysis uses a 3-year lookback window, calculated quarterly.
                              Each point represents the alpha/beta for the preceding 3 years.
                            </p>
                          </div>

                          {/* Rolling Data Table */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Quarter
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Alpha (%)
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Beta
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    R²
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Data Period
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {rollingResults.data.map((item, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                      {item.quarter}
                                    </td>
                                    <td className={`px-4 py-3 text-sm font-medium ${item.alpha > 0 ? 'text-success' : 'text-danger'}`}>
                                      {item.alpha > 0 ? '+' : ''}
                                      {item.alpha.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {item.beta.toFixed(3)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {item.rSquared.toFixed(3)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                      {item.dataPeriodStart.toLocaleDateString()} -{' '}
                                      {item.dataPeriodEnd.toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                          <p className="text-yellow-800 font-medium">
                            {rollingResults?.message || 'Insufficient data for rolling analysis'}
                          </p>
                          <p className="text-sm text-yellow-700 mt-2">
                            Rolling analysis requires at least 3 years (156 weeks) of historical data.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* No Data State */}
        {!parsedData && !isLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Loaded</h3>
            <p className="text-gray-600">
              Upload a CSV or XLSX file to begin analyzing stock alpha and beta metrics.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-600 text-center">
            Stock Alpha & Beta Analyzer - Client-side financial analysis tool
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
