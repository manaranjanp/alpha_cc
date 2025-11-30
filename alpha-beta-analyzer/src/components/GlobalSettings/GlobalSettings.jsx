import { DEFAULT_RISK_FREE_RATE, CALCULATION_PERIODS } from '../../constants/config';

const GlobalSettings = ({
  stockColumns,
  indexColumns,
  selectedStock,
  setSelectedStock,
  selectedIndex,
  setSelectedIndex,
  riskFreeRate,
  setRiskFreeRate,
  period,
  setPeriod,
  disabled = false,
}) => {
  const handleRiskFreeRateChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 20)) {
      setRiskFreeRate(value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-soft border border-dark-slate/10 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stock Selection */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark-slate mb-1">
            Stock
          </label>
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            disabled={disabled || stockColumns.length === 0}
            className="font-body w-full px-3 py-2 border border-dark-slate/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-orange focus:border-transparent disabled:bg-cream-dark disabled:cursor-not-allowed"
          >
            <option value="">Select Stock</option>
            {stockColumns.map((stock) => (
              <option key={stock} value={stock}>
                {stock}
              </option>
            ))}
          </select>
        </div>

        {/* Market Index Selection */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark-slate mb-1">
            Market Index
          </label>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(e.target.value)}
            disabled={disabled || indexColumns.length === 0}
            className="font-body w-full px-3 py-2 border border-dark-slate/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-orange focus:border-transparent disabled:bg-cream-dark disabled:cursor-not-allowed"
          >
            <option value="">Select Index</option>
            {indexColumns.map((index) => (
              <option key={index} value={index}>
                {index}
              </option>
            ))}
          </select>
        </div>

        {/* Risk-Free Rate */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark-slate mb-1">
            Risk-Free Rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="20"
            step="0.1"
            value={riskFreeRate}
            onChange={handleRiskFreeRateChange}
            disabled={disabled}
            className="font-body w-full px-3 py-2 border border-dark-slate/20 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-orange focus:border-transparent disabled:bg-cream-dark disabled:cursor-not-allowed"
            placeholder="5.0"
          />
        </div>

        {/* Period Selection */}
        <div>
          <label className="block font-heading text-sm font-medium text-dark-slate mb-1">
            Analysis Period
          </label>
          <div className="flex items-center space-x-4 h-10">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                value={CALCULATION_PERIODS.THREE_YEARS}
                checked={period === CALCULATION_PERIODS.THREE_YEARS}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                disabled={disabled}
                className="form-radio text-accent-orange focus:ring-accent-orange disabled:opacity-50"
              />
              <span className="ml-2 font-body text-sm text-dark-slate">3 Years</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                value={CALCULATION_PERIODS.FIVE_YEARS}
                checked={period === CALCULATION_PERIODS.FIVE_YEARS}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                disabled={disabled}
                className="form-radio text-accent-orange focus:ring-accent-orange disabled:opacity-50"
              />
              <span className="ml-2 font-body text-sm text-dark-slate">5 Years</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-3 font-body text-xs text-slate-light">
        <p>Date format: dd/mm/yyyy | Weekly returns are used for all calculations</p>
      </div>
    </div>
  );
};

export default GlobalSettings;
