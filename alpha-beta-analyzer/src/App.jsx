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
      {/* Hero Header */}
      <header className="gradient-mesh geometric-grid relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          {/* Animated title */}
          <div className="text-center space-y-6">
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white opacity-0 animate-fade-in-up">
              <span className="block">Stock Alpha & Beta</span>
              <span className="block mt-2 bg-gradient-to-r from-cyan-light via-cyan to-cyan-dark bg-clip-text text-transparent">
                Analyzer
              </span>
            </h1>

            <p className="font-body text-lg sm:text-xl text-slate-custom max-w-3xl mx-auto opacity-0 animate-fade-in-up delay-200">
              Calculate and visualize stock performance metrics using regression analysis
            </p>

            {/* Decorative elements */}
            <div className="flex justify-center gap-8 mt-8 opacity-0 animate-fade-in-up delay-300">
              <div className="flex items-center gap-2 text-cyan-light">
                <div className="w-2 h-2 bg-cyan rounded-full animate-pulse"></div>
                <span className="text-sm font-body font-medium">Alpha Analysis</span>
              </div>
              <div className="flex items-center gap-2 text-gold-light">
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                <span className="text-sm font-body font-medium">Beta Calculation</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-light">
                <div className="w-2 h-2 bg-cyan rounded-full animate-pulse"></div>
                <span className="text-sm font-body font-medium">Regression Engine</span>
              </div>
            </div>
          </div>

          {/* Floating decorative shapes */}
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-cyan/20 rounded-lg rotate-12 float-animation hidden lg:block"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 border-2 border-gold/20 rounded-full float-animation" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-20 w-12 h-12 border-2 border-cyan/20 rounded-lg -rotate-12 float-animation" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 sm:h-16">
            <path d="M0,0 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,120 L0,120 Z" fill="#f8fafc" opacity="0.8"></path>
          </svg>
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

        {/* Getting Started Guide - Only show when no data */}
        {!parsedData && !isLoading && (
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg border border-gray-200 p-8">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                Get Started with Alpha & Beta Analysis
              </h3>

              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Upload Data</h4>
                  <p className="text-sm text-gray-600">
                    Upload CSV or XLSX with dates, stock prices, and market index
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Configure Settings</h4>
                  <p className="text-sm text-gray-600">
                    Select stocks, indices, risk-free rate, and analysis period
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. View Results</h4>
                  <p className="text-sm text-gray-600">
                    Analyze alpha, beta, and rolling trends with detailed metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="gradient-mesh mt-12 relative">
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="text-center space-y-3">
            <p className="text-sm font-body text-slate-custom">
              Stock Alpha & Beta Analyzer
            </p>
            <p className="text-xs font-body text-slate-custom/70">
              Client-side financial analysis tool powered by advanced regression analytics
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <span className="text-xs text-cyan-light font-medium">Secure</span>
              <span className="text-cyan/30">•</span>
              <span className="text-xs text-cyan-light font-medium">Private</span>
              <span className="text-cyan/30">•</span>
              <span className="text-xs text-cyan-light font-medium">Powerful</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
