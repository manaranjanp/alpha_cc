# Stock Alpha & Beta Analyzer

A client-side web application for analyzing stock performance metrics using regression analysis. Calculate alpha, beta, R-squared, and visualize rolling trends over time.

## Features

- **Client-Side Only**: All processing happens in your browser - no data is sent to any server
- **File Upload**: Support for CSV and XLSX files with multiple stocks and market indices
- **Alpha & Beta Calculation**: Calculate risk-adjusted returns using CAPM methodology
- **Rolling Analysis**: 3-year lookback window with quarterly calculations
- **Data Visualization**: Interactive charts and comprehensive data tables
- **Single HTML File**: Entire application bundles into one embeddable HTML file
- **Export Capabilities**: Download results as CSV files

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (creates single HTML file)
npm run build
```

### Usage

1. **Upload Data**: Drag and drop or select a CSV/XLSX file containing:
   - Date column (mm-dd-yyyy format)
   - One or more stock price columns
   - Market index column (e.g., NIFTY50, S&P 500)

2. **Configure Settings**:
   - Select stock and market index
   - Set risk-free rate (default: 5%)
   - Choose analysis period (3 or 5 years)

3. **View Analysis**:
   - **Tab 1**: Static alpha/beta analysis with metrics summary
   - **Tab 2**: Rolling trends showing how metrics evolve over time

## Data Format

Your CSV/XLSX file should have the following structure:

```csv
Date,STOCK1,STOCK2,MARKETINDEX
01-02-2020,1420.50,2145.30,12080.50
01-09-2020,1435.20,2198.75,12254.75
...
```

**Requirements**:
- Date format must be mm-dd-yyyy
- At least 3 years of historical data for rolling analysis
- Daily or weekly price data
- All price values must be positive numbers

## Sample Data

A sample data file is included in `public/sample_data.csv` with 5 years of historical data for RELIANCE, TCS, INFY, and NIFTY50.

## Downloading Stock Data

A Python script is provided to download stock prices from Yahoo Finance:

```bash
# Install dependencies
pip install -r scripts/requirements.txt

# Download Indian stocks
python scripts/get_stock_prices.py \
  -stocks RELIANCE.NS,TCS.NS,INFY.NS \
  -index ^NSEI \
  -from 01-01-2020 \
  -to 12-31-2024

# Download US stocks
python scripts/get_stock_prices.py \
  -stocks AAPL,GOOGL,MSFT \
  -index ^GSPC \
  -from 01-01-2020 \
  -to 12-31-2024 \
  -output us_stocks.csv
```

See [scripts/README.md](scripts/README.md) for detailed usage instructions and examples.

## Key Metrics

### Alpha (α)
- Excess return compared to expected return based on CAPM
- Positive alpha indicates outperformance
- Formula: `Mean(Stock Returns) - [Risk-Free Rate + β × (Mean(Market Returns) - Risk-Free Rate)]`

### Beta (β)
- Measure of stock volatility relative to market
- β = 1: Same volatility as market
- β > 1: More volatile than market
- Formula: `Covariance(Stock, Market) / Variance(Market)`

### R-Squared (R²)
- Percentage of stock variance explained by market movement
- Values range from 0 to 1
- Higher values indicate stronger correlation with market

### Rolling Analysis
- Uses 3-year lookback window (156 weeks)
- Calculated quarterly (every 3 months)
- Shows how metrics evolve over time

## Technology Stack

- **Framework**: React with Hooks
- **Build Tool**: Vite with vite-plugin-singlefile
- **Styling**: Tailwind CSS
- **Data Parsing**: Papa Parse (CSV), SheetJS (XLSX)
- **Calculations**: decimal.js (precision), simple-statistics (regression)
- **Date Handling**: date-fns
- **Export**: FileSaver.js

## Architecture

```
src/
├── components/          # React components
│   ├── FileUpload/      # File upload component
│   └── GlobalSettings/  # Settings configuration
├── utils/               # Utility functions
│   ├── dataParser.js    # CSV/XLSX parsing
│   ├── dataValidator.js # Data validation
│   ├── returnCalculations.js  # Weekly returns
│   ├── regressionEngine.js    # Alpha/Beta calculations
│   ├── rollingCalculations.js # Rolling analysis
│   └── exportHelpers.js       # CSV/PNG export
├── constants/
│   └── config.js        # Application constants
└── App.jsx              # Main application component
```

## Calculations

### Weekly Returns
Converts daily prices to weekly returns using last trading day of each week:
```
Return = (Price_end - Price_start) / Price_start × 100
```

### Linear Regression
Used to calculate beta (slope of regression line):
```
Y (Stock Returns) = α + β × X (Market Returns) + ε
```

### CAPM Expected Return
```
E(R) = Rf + β × (E(Rm) - Rf)
```

Where:
- E(R) = Expected return
- Rf = Risk-free rate
- β = Beta
- E(Rm) = Expected market return

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Performance

- Handles 10+ years of daily data (2,500+ rows)
- Processes 5-year analysis in under 2 seconds
- Single HTML file size: ~656 KB (~216 KB gzipped)

## Building for Production

```bash
npm run build
```

This creates a single HTML file in `dist/index.html` that can be:
- Embedded in an iframe on any website
- Hosted on any static file server
- Shared directly as a file

### Running with Python HTTP Server

The easiest way to test or deploy the built application:

```bash
# Build the app
npm run build

# Navigate to dist directory
cd dist

# Start Python HTTP server
python3 -m http.server 8000

# Open browser to http://localhost:8000
```

For detailed deployment instructions (Nginx, Apache, static hosting, etc.), see [DEPLOYMENT.md](DEPLOYMENT.md).

## Limitations

- Minimum 3 years of data required for rolling analysis
- Date format must be mm-dd-yyyy (strictly enforced)
- All calculations use weekly returns (converted from daily prices)
- Client-side processing only (no backend/database support)

## License

This project is provided as-is for educational and analysis purposes.

## Contributing

This is an implementation based on the PRD and implementation plan. For issues or enhancements, please refer to the project documentation.

## Acknowledgments

Built following the comprehensive PRD for Stock Alpha & Beta Analyzer, implementing:
- Client-side-only architecture
- Single-file deployment capability
- Precise financial calculations using decimal.js
- Rolling window analysis methodology
- CAPM-based alpha calculations
