# Product Requirements Document: Stock Alpha & Beta Analyzer

## Overview

A client-side dashboard application that enables users to upload historical stock and market index data, calculate alpha and beta metrics using regression analysis, and visualize rolling alpha/beta trends over time for comparative stock analysis.

---

## I. Data Input and Management

| Requirement | Details |
| :--- | :--- |
| **Data Upload** | The application must feature a prominent file upload area to accept historical trading data (CSV, XLSX). |
| **Required Data Fields** | The uploaded file must contain, at minimum: **Date** column (mm-dd-yyyy format), **one or more Stock Price columns** (daily closing prices), and a **Market Index column** (e.g., NIFTY, S&P 500). |
| **Column Auto-Detection** | Upon file upload, the application must automatically detect and list all available stock columns and the market index column. |
| **Data Validation** | The system must validate that: dates are in mm-dd-yyyy format, price values are numeric, no critical data gaps exist, and minimum data span requirements are met. |
| **Client-Side Only** | All file parsing, data processing, regression calculations, and visualization must occur entirely within the user's browser (no server/backend required). |

---

## II. User Interface & Configuration Inputs 🖱️

The interface must provide intuitive controls for users to configure their analysis parameters.

### A. Global Settings

| Requirement | Details |
| :--- | :--- |
| **Date Format** | All date inputs and displays must use **mm-dd-yyyy** format. Display format guidance clearly near date-related displays. |
| **Risk-Free Rate Input** | Must allow users to input an annualized risk-free rate (default: 5%) used in alpha calculations. Text input with validation (0-20% range). |

### B. Stock & Index Selection

| Requirement | Details |
| :--- | :--- |
| **Dynamic Stock Dropdown** | After data upload, must populate a dropdown with all detected stock columns for primary analysis. |
| **Market Index Selection** | Must allow user to confirm or select which column represents the market benchmark index. |

### C. Analysis Configuration

| Requirement | Details |
| :--- | :--- |
| **Calculation Period** | Must provide radio buttons or dropdown to select analysis timeframe: **3 Years** or **5 Years**. |
| **Data Frequency** | Must default to **Weekly Returns** for all calculations (converting daily prices to weekly returns). |
| **Rolling Window Settings** | For rolling analysis: Lookback period fixed at **3 Years** (156 weeks), calculation interval at **3 Months** (quarterly). |
| **Input Validation** | All inputs must be validated with appropriate error messages for invalid entries. |

---

## III. Calculation Engine 📐

### A. Return Calculations

| Requirement | Details |
| :--- | :--- |
| **Weekly Returns** | Convert daily closing prices to weekly returns using: `(Price_end - Price_start) / Price_start × 100`. Use Friday close or last trading day of week. |
| **Logarithmic Returns** | Optionally support log returns: `ln(Price_end / Price_start)` for more accurate compounding analysis. |
| **Decimal Precision** | All calculations must use `decimal.js` library to ensure floating-point accuracy. |

### B. Alpha & Beta Formulas

| Metric | Formula | Description |
| :--- | :--- | :--- |
| **Beta (β)** | `Covariance(Stock Returns, Market Returns) / Variance(Market Returns)` | Measures stock's volatility relative to market. β > 1 means more volatile than market. |
| **Alpha (α)** | `Mean(Stock Returns) - [Risk-Free Rate + β × (Mean(Market Returns) - Risk-Free Rate)]` | Excess return over expected return based on CAPM. Positive α indicates outperformance. |
| **R-Squared (R²)** | `Correlation(Stock, Market)²` | Indicates how much of stock's movement is explained by market movement. |

### C. Rolling Calculations

| Requirement | Details |
| :--- | :--- |
| **Sliding Window** | Use 3-year lookback window (156 weekly data points) sliding every 3 months (13 weeks). |
| **Start Point Logic** | If data spans 2017-2025, first rolling calculation uses 2017-2019 data to generate first alpha/beta point dated Q1 2020. |
| **Quarterly Points** | Generate alpha/beta data points every quarter: Q1 (Jan), Q2 (Apr), Q3 (Jul), Q4 (Oct). |
| **Minimum Data Check** | Must have at least 3 years of historical data before the analysis start date. Display warning if insufficient data. |

---

## IV. Simulation Output & Reporting 📊

### A. Tab 1: Static Alpha & Beta Analysis

#### Summary Metrics Panel

| Requirement | Details |
| :--- | :--- |
| **Metrics Display** | Must display calculated metrics in prominent cards/panels: **Alpha (annualized %)**, **Beta**, **R-Squared**, **Standard Error**. |
| **Interpretation Labels** | Each metric must include a brief interpretation (e.g., Beta: "1.25 - Stock is 25% more volatile than market"). |
| **Period Indicator** | Clearly display the selected calculation period (3Y or 5Y) and date range used. |

#### Regression Scatter Plot

| Requirement | Details |
| :--- | :--- |
| **Chart Type** | Scatter plot with Market Returns (X-axis) vs Stock Returns (Y-axis). |
| **Regression Line** | Overlay best-fit regression line showing the relationship. |
| **Data Points** | Each weekly return pair displayed as a point. |
| **Axis Labels** | Clear axis labels with percentage format (e.g., "-5%" to "+5%"). |
| **Tooltip** | On hover, show date, stock return %, and market return % for each point. |

#### Detailed Returns Table

| Requirement | Details |
| :--- | :--- |
| **Weekly Returns Log** | Scrollable table showing: **Week Ending Date** (mm-dd-yyyy), **Stock Price**, **Stock Weekly Return (%)**, **Market Index**, **Market Weekly Return (%)**. |
| **Sortable Columns** | Allow sorting by any column. |
| **Export Option** | Download button to export table as CSV. |

---

### B. Tab 2: Rolling Alpha & Beta Trends

#### Stock Selection for Comparison

| Requirement | Details |
| :--- | :--- |
| **Add Stock Button** | A prominent **"+ Add Stock"** button that opens a dropdown/modal to select a stock from available columns. |
| **Stock Chips/Tags** | Each added stock appears as a removable chip/tag below the button showing stock name and color indicator. |
| **Remove Stock** | Each stock chip must have an "×" button to remove it from the comparison chart. |
| **Maximum Stocks** | Allow up to 5 stocks for comparison clarity. Disable "Add Stock" button when limit reached. |
| **Metric Toggle** | Radio buttons to switch between viewing **Rolling Alpha** or **Rolling Beta** trend. |
| **Reference Lines** | Horizontal reference line at Alpha = 0 (break-even) and Beta = 1 (market-neutral). |

#### Rolling Trend Line Chart

| Requirement | Details |
| :--- | :--- |
| **Chart Type** | Multi-line time series chart with Date (X-axis, mm-dd-yyyy) and Alpha/Beta value (Y-axis). |
| **Multiple Series** | Each added stock displayed as a separate colored line matching its chip color. |
| **Quarterly Markers** | Data points marked at each quarterly calculation point. |
| **Tooltip** | On hover, show date, stock name, alpha value, and beta value. |
| **Zoom/Pan** | Allow users to zoom into specific time periods for detailed analysis. |
| **Dynamic Updates** | Chart updates immediately when stocks are added or removed. |

#### Rolling Data Table

| Requirement | Details |
| :--- | :--- |
| **Quarterly Log** | Table showing: **Quarter**, **Stock Name**, **Rolling Alpha**, **Rolling Beta**, **R-Squared**, **Data Period Used**. |
| **Filter by Stock** | Dropdown to filter table by specific stock. |
| **Export Option** | Download complete rolling analysis data as CSV. |

---

### C. Chart Features (Both Tabs)

| Requirement | Details |
| :--- | :--- |
| **Chart Export** | Users must be able to download charts as PNG image files. |
| **Responsive Design** | Charts must resize appropriately for different screen sizes. |
| **Color Coding** | Consistent, distinguishable colors for each stock series. Use colorblind-friendly palette. |
| **Legend** | Clear legend identifying each data series with toggle visibility option. |

---

## V. Summary Comparison Panel

| Requirement | Details |
| :--- | :--- |
| **Multi-Stock Table** | When multiple stocks are analyzed, display side-by-side comparison table. |
| **Comparison Metrics** | For each stock: **Alpha (3Y)**, **Alpha (5Y)**, **Beta (3Y)**, **Beta (5Y)**, **R-Squared**, **Avg Rolling Alpha**, **Alpha Trend** (↑/↓/→). |
| **Visual Indicators** | Color code: Green for positive alpha, Red for negative alpha, Bold for beta > 1.2 or < 0.8. |
| **Export All** | Download full comparison report as CSV. |

---

## VI. Error Handling & Edge Cases

| Scenario | Handling |
| :--- | :--- |
| **Insufficient Data** | Display warning: "Minimum 3 years of data required for rolling analysis. Current data: X years." |
| **Missing Values** | Handle missing price data by interpolation or exclusion with user notification. |
| **Zero/Negative Prices** | Reject and highlight rows with invalid price data. |
| **Single Stock File** | Disable "Add Stock" button in Tab 2 after single stock is added; proceed with single analysis. |
| **Date Parsing Errors** | Display specific rows where date parsing failed. Expected format: mm-dd-yyyy. |
| **Invalid Date Format** | Show error message: "Date format must be mm-dd-yyyy. Found invalid dates in rows: [list]." |

---

## VII. Technical and Architectural Requirements

| Requirement | Details |
| :--- | :--- |
| **Architecture** | Must be built as a single-file application (HTML, CSS, JavaScript bundled together). |
| **Embeddability** | The application must be fully functional and embeddable using an `<iframe>` on a blog or static website. |
| **Performance** | Calculation engine must handle 10+ years of daily data (2,500+ rows) without browser lag. |
| **Browser Support** | Must support Chrome, Firefox, Safari, Edge (latest 2 versions). |
| **Responsive Design** | Must be usable on desktop (1024px+) and tablet (768px+) screens. |

---

## VIII. Technology Stack & Core Libraries 🛠️

| Component | Tool / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React** (with Hooks) | Provides component-based structure for the tabbed UI and state management. |
| **Build Tool** | **Vite** + **`vite-plugin-singlefile`** | Ultra-fast development and bundles entire application into a single embeddable HTML file. |
| **Styling** | **Tailwind CSS** | Utility-first, responsive styling for clean dashboard interface. |
| **CSV Parsing** | **Papa Parse** | Client-side parsing of CSV data with header detection. |
| **Excel Parsing** | **SheetJS** (`xlsx`) | Client-side parsing of Excel files (.xlsx, .xls). |
| **Financial Accuracy** | **`decimal.js`** | Ensures precise calculations for returns, variance, covariance, and regression coefficients. |
| **Statistical Functions** | **Simple-statistics** (or custom implementation) | Linear regression, standard deviation, correlation calculations. |
| **Charting Library** | **Chart.js** (with `chartjs-plugin-zoom`) | Visualization for scatter plots, line charts, with zoom/pan capabilities. |
| **Date Handling** | **date-fns** | Reliable date parsing (mm-dd-yyyy), formatting, and week/quarter calculations. |
| **Export Functionality** | **html2canvas** + **FileSaver.js** | Chart image export and CSV file generation. |

---

## IX. User Interface Mockup Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  📈 Stock Alpha & Beta Analyzer                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  📁 Drag & Drop CSV/XLSX file here                      │    │
│  │     or click to browse                                  │    │
│  │     (Required: Date, Stock Prices, Market Index)        │    │
│  │     Date format: mm-dd-yyyy                             │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  Stock: [RELIANCE ▼]  Index: [NIFTY50 ▼]  Period: ○3Y ●5Y      │
│  Risk-Free Rate: [5.0 %]                                        │
├─────────────────────────────────────────────────────────────────┤
│  [Tab 1: Alpha & Beta]  [Tab 2: Rolling Trends]                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Alpha    │ │ Beta     │ │ R²       │ │ Std Err  │           │
│  │ +2.34%   │ │ 1.15     │ │ 0.72     │ │ 0.023    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Regression Scatter Plot                    │    │
│  │                    [Chart Area]                         │    │
│  │                                              [📥 PNG]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Weekly Returns Data                            [📥 CSV]        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Week End   │ Stock Price │ Stock Ret │ Index │ Index Ret│    │
│  │ 12-27-2024 │ 2,456.50    │ +1.23%    │ 24150 │ +0.85%   │    │
│  │ ...        │ ...         │ ...       │ ...   │ ...      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Tab 2: Rolling Trends Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  [Tab 1: Alpha & Beta]  [Tab 2: Rolling Trends]                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [+ Add Stock]                                                  │
│                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │ 🔵 RELIANCE ×│ │ 🟢 TCS      ×│ │ 🟠 INFY     ×│         │
│  └───────────────┘ └───────────────┘ └───────────────┘         │
│                                                                 │
│  View: ● Rolling Alpha  ○ Rolling Beta                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Rolling Alpha Trend Chart                  │    │
│  │  α                                                      │    │
│  │  3%│    🔵              🔵                              │    │
│  │  2%│ 🔵    🔵    🟢  🟢    🔵  🟢                       │    │
│  │  1%│    🟢    🟢              🟢    🔵                  │    │
│  │  0%│─────────────────────────────────────── (ref line)  │    │
│  │ -1%│ 🟠  🟠    🟠    🟠    🟠    🟠    🟠              │    │
│  │    └──────────────────────────────────────────────────  │    │
│  │      Q1'20  Q2'20  Q3'20  Q4'20  Q1'21  Q2'21  Q3'21    │    │
│  │                                              [📥 PNG]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Rolling Data                    Filter: [All Stocks ▼] [📥CSV] │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Quarter  │ Stock    │ Alpha  │ Beta │ R²   │ Period     │    │
│  │ Q1 2020  │ RELIANCE │ +1.85% │ 1.12 │ 0.68 │ 2017-2019  │    │
│  │ Q1 2020  │ TCS      │ +2.10% │ 0.95 │ 0.71 │ 2017-2019  │    │
│  │ ...      │ ...      │ ...    │ ...  │ ...  │ ...        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## X. Glossary

| Term | Definition |
| :--- | :--- |
| **Alpha (α)** | Risk-adjusted excess return compared to benchmark. Positive alpha indicates outperformance. |
| **Beta (β)** | Measure of systematic risk/volatility relative to market. β=1 means same volatility as market. |
| **R-Squared (R²)** | Coefficient of determination. Shows % of stock variance explained by market movement (0-1). |
| **CAPM** | Capital Asset Pricing Model. Framework for calculating expected returns based on beta. |
| **Rolling Window** | Moving calculation period that slides forward in time to show metric evolution. |
| **Risk-Free Rate** | Return on theoretically zero-risk investment (typically government bond yield). |

---

## XI. Acceptance Criteria

- [ ] User can upload CSV/XLSX with multiple stock columns and one market index column
- [ ] Application correctly parses dates in mm-dd-yyyy format
- [ ] Application correctly identifies and lists all stock columns in dropdown
- [ ] Alpha and beta calculations match manual verification within 0.01% tolerance
- [ ] Rolling calculations correctly use 3-year lookback with 3-month intervals
- [ ] "Add Stock" button correctly adds stocks to rolling trend chart with unique colors
- [ ] Stock chips display correctly and can be removed with × button
- [ ] Charts render correctly with all interactive features (hover, zoom, export)
- [ ] All data exports produce valid, properly formatted CSV files
- [ ] Application functions entirely offline after initial load
- [ ] Single HTML file builds successfully and embeds in iframe without errors
- [ ] Performance: 5-year daily data processes in under 2 seconds
