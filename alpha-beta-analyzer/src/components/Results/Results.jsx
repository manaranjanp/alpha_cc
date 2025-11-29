import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

function Results() {
  const [activeTab, setActiveTab] = useState('static');
  const analysisResults = useStore(state => state.analysisResults);
  const rollingResults = useStore(state => state.rollingResults);
  const selectedStock = useStore(state => state.selectedStock);
  const selectedIndex = useStore(state => state.selectedIndex);
  const setCurrentStep = useStore(state => state.setCurrentStep);

  if (!analysisResults) {
    return (
      <div className="card">
        <p className="text-gray-600">No analysis results available.</p>
      </div>
    );
  }

  const isRollingReady = rollingResults && !rollingResults.insufficient;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Alpha</p>
          <p className={`text-3xl font-bold ${analysisResults.alpha > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analysisResults.alpha > 0 ? '+' : ''}
            {analysisResults.alpha.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {analysisResults.alpha > 0 ? 'Outperforming' : 'Underperforming'} market
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Beta</p>
          <p className={`text-3xl font-bold text-gray-900 ${analysisResults.beta > 1.2 || analysisResults.beta < 0.8 ? 'font-extrabold' : ''}`}>
            {analysisResults.beta.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.abs((analysisResults.beta - 1) * 100).toFixed(0)}% {analysisResults.beta > 1 ? 'more' : 'less'} volatile
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">R-Squared</p>
          <p className="text-3xl font-bold text-gray-900">
            {analysisResults.rSquared.toFixed(3)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(analysisResults.rSquared * 100).toFixed(0)}% variance explained
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Data Points</p>
          <p className="text-3xl font-bold text-gray-900">
            {analysisResults.statistics.dataPointsCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Weekly returns analyzed
          </p>
        </div>
      </div>

      {/* Statistical Summary */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Statistical Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600">Mean Stock Return</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {analysisResults.statistics.meanStockReturn.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mean Market Return</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {analysisResults.statistics.meanMarketReturn.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Stock Volatility</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {analysisResults.statistics.stdStockReturn.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Correlation</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {analysisResults.statistics.correlation.toFixed(3)}
            </p>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Interpretation</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>Alpha:</strong> {selectedStock} {analysisResults.alpha > 0 ? 'generated' : 'lost'}{' '}
            {Math.abs(analysisResults.alpha).toFixed(2)}% excess return compared to expected return.
          </li>
          <li>
            <strong>Beta:</strong> {selectedStock} is {Math.abs((analysisResults.beta - 1) * 100).toFixed(0)}%{' '}
            {analysisResults.beta > 1 ? 'more' : 'less'} volatile than {selectedIndex}.
          </li>
          <li>
            <strong>R²:</strong> {(analysisResults.rSquared * 100).toFixed(0)}% of {selectedStock}'s price movement can be explained by {selectedIndex} movements.
          </li>
        </ul>
      </div>

      {/* Tabs for Static and Rolling Analysis */}
      <div className="card">
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('static')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'static'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Static Analysis
            </button>
            <button
              onClick={() => setActiveTab('rolling')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'rolling'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Rolling Trends
            </button>
          </nav>
        </div>

        {activeTab === 'static' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {selectedStock} vs {selectedIndex} ({analysisResults.period / 52} Year Analysis)
            </h3>
            <p className="text-gray-600">
              This analysis shows the static alpha and beta calculated over the selected period using weekly returns.
            </p>
          </div>
        )}

        {activeTab === 'rolling' && (
          <div>
            {isRollingReady ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Rolling Alpha & Beta Trends for {selectedStock}
                </h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Rolling analysis uses a 3-year lookback window, calculated quarterly. Each point represents the alpha/beta for the preceding 3 years.
                  </p>
                </div>

                {/* Rolling Data Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quarter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Alpha (%)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Beta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          R²
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data Period
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rollingResults.data.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.quarter}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${item.alpha > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.alpha > 0 ? '+' : ''}
                            {item.alpha.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.beta.toFixed(3)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.rSquared.toFixed(3)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.dataPeriodStart.toLocaleDateString()} - {item.dataPeriodEnd.toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="font-semibold text-yellow-800">
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

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep('configure')}
          className="btn-secondary"
        >
          Back to Configuration
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to start over?')) {
              useStore.getState().reset();
            }
          }}
          className="btn-primary"
        >
          Start New Analysis
        </button>
      </div>
    </div>
  );
}

export default Results;
