# Stock Data Scripts

Python scripts for downloading and validating stock price data for use with the Stock Alpha & Beta Analyzer.

## Available Scripts

1. **get_stock_prices.py** - Download stock prices from Yahoo Finance
2. **validate_stock_data.py** - Validate and clean stock data files

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

or individually:

```bash
pip install yfinance pandas
```

## Usage

### Basic Usage

```bash
python get_stock_prices.py -stocks STOCK1,STOCK2,STOCK3 -index INDEX -from MM-DD-YYYY -to MM-DD-YYYY
```

### Examples

#### Download Indian Stocks (NSE)

```bash
python get_stock_prices.py \
  -stocks RELIANCE.NS,TCS.NS,INFY.NS \
  -index ^NSEI \
  -from 01-01-2020 \
  -to 12-31-2024
```

#### Download US Stocks

```bash
python get_stock_prices.py \
  -stocks AAPL,GOOGL,MSFT,TSLA \
  -index ^GSPC \
  -from 01-01-2020 \
  -to 12-31-2024
```

#### Custom Output File

```bash
python get_stock_prices.py \
  -stocks NVDA,AMD,INTC \
  -index ^IXIC \
  -from 01-01-2023 \
  -to 12-31-2024 \
  -output tech_stocks.csv
```

## Command Line Arguments

| Argument | Short | Required | Description | Example |
|----------|-------|----------|-------------|---------|
| `--stocks` | `-stocks` | Yes | Comma-separated list of stock ticker symbols | `RELIANCE.NS,TCS.NS` |
| `--index` | `-index` | Yes | Market index ticker symbol | `^NSEI` |
| `--from-date` | `-from` | Yes | Start date in mm-dd-yyyy format | `01-01-2020` |
| `--to-date` | `-to` | Yes | End date in mm-dd-yyyy format | `12-31-2024` |
| `--output` | `-output` | No | Output CSV filename (default: stock_data.csv) | `my_data.csv` |
| `--keep-suffixes` | | No | Keep ticker suffixes in column names | |

## Ticker Symbol Format

### Indian Stocks

- **NSE (National Stock Exchange)**: Add `.NS` suffix
  - Examples: `RELIANCE.NS`, `TCS.NS`, `INFY.NS`, `HDFC.NS`

- **BSE (Bombay Stock Exchange)**: Add `.BO` suffix
  - Examples: `RELIANCE.BO`, `TCS.BO`, `INFY.BO`

### US Stocks

- Use standard ticker symbols (no suffix needed)
- Examples: `AAPL`, `GOOGL`, `MSFT`, `TSLA`, `NVDA`, `AMZN`

## Common Market Indices

| Market | Index Name | Ticker Symbol |
|--------|------------|---------------|
| India | NIFTY 50 | `^NSEI` |
| India | BSE SENSEX | `^BSESN` |
| USA | S&P 500 | `^GSPC` |
| USA | Dow Jones Industrial Average | `^DJI` |
| USA | NASDAQ Composite | `^IXIC` |
| USA | Russell 2000 | `^RUT` |

## Output Format

The script generates a CSV file in the exact format required by the Stock Alpha & Beta Analyzer:

```csv
Date,STOCK1,STOCK2,STOCK3,INDEX
01-02-2020,1420.50,2145.30,715.40,12080.50
01-09-2020,1435.20,2198.75,728.65,12254.75
...
```

- **Date column**: Format is mm-dd-yyyy (e.g., 01-02-2020)
- **Stock columns**: Daily closing prices
- **Index column**: Market index closing prices

## Features

✓ Downloads daily closing prices from Yahoo Finance
✓ Automatically formats dates to mm-dd-yyyy
✓ Cleans up ticker suffixes for cleaner column names
✓ Handles missing data gracefully
✓ Shows download progress and data summary
✓ Ready to upload directly to the analyzer

## Tips

1. **Date Range**: For rolling analysis, download at least 3 years of data (plus the lookback period). For 5-year analysis with 3-year rolling window, download 8+ years of data.

2. **Trading Days**: The script downloads actual trading days only (excludes weekends and holidays).

3. **Missing Data**: If a stock has missing data, the script will report it in the summary. Consider choosing stocks with complete data for better analysis results.

4. **Ticker Symbols**: Always verify ticker symbols on Yahoo Finance before downloading. Some stocks may have different symbols across exchanges.

5. **Data Quality**: Yahoo Finance is free but may occasionally have data gaps or errors. For critical analysis, consider using premium data sources.

## Troubleshooting

### Error: "yfinance library not found"
```bash
pip install yfinance
```

### Error: "No data downloaded"
- Check if ticker symbols are correct
- Verify date range (some stocks may not have data for older dates)
- Try adding exchange suffix (e.g., `.NS` for Indian stocks)

### Invalid Date Format
- Ensure dates are in mm-dd-yyyy format
- Use leading zeros (e.g., `01-05-2020`, not `1-5-2020`)

### Stock Not Found
- Verify ticker symbol on [Yahoo Finance](https://finance.yahoo.com/)
- Check if correct exchange suffix is used
- Some stocks may have been delisted

## Advanced Usage

### Download Multiple Time Periods

```bash
# Download 2020-2022
python get_stock_prices.py -stocks AAPL,GOOGL -index ^GSPC -from 01-01-2020 -to 12-31-2022 -output data_2020_2022.csv

# Download 2023-2024
python get_stock_prices.py -stocks AAPL,GOOGL -index ^GSPC -from 01-01-2023 -to 12-31-2024 -output data_2023_2024.csv
```

### Keep Ticker Suffixes

If you want to keep the original ticker symbols with their suffixes:

```bash
python get_stock_prices.py \
  -stocks RELIANCE.NS,TCS.NS \
  -index ^NSEI \
  -from 01-01-2020 \
  -to 12-31-2024 \
  --keep-suffixes
```

## Data Sources

This script uses **Yahoo Finance** via the `yfinance` library:
- Free and widely used
- Historical data for global markets
- Daily OHLCV data (Open, High, Low, Close, Volume)
- The analyzer uses only closing prices

---

# Stock Data Validation Script

## Overview

`validate_stock_data.py` validates and cleans stock price data files by:
1. Checking that all dates are in mm-dd-yyyy format
2. Identifying and reporting missing values
3. Imputing 1-2 consecutive missing values using forward fill / backfill
4. Creating a cleaned output file

## Usage

### Basic Usage

```bash
python validate_stock_data.py input_file.csv
```

This creates `input_file_cleaned.csv` with validated and cleaned data.

### Specify Output File

```bash
python validate_stock_data.py data.csv -output clean_data.csv
```

### Change Maximum Consecutive Imputation

By default, the script only imputes 1-2 consecutive missing values. To change this:

```bash
python validate_stock_data.py data.csv -max-consecutive 3
```

### Skip Date Validation

If you want to skip date format validation:

```bash
python validate_stock_data.py data.csv --skip-date-validation
```

## Examples

### Example 1: Clean a Data File

```bash
python validate_stock_data.py stock_data.csv
```

Output:
```
Reading file: stock_data.csv
✓ Loaded 231 rows and 5 columns

======================================================================
STOCK DATA VALIDATION AND CLEANING REPORT
======================================================================

1. DATE FORMAT VALIDATION (mm-dd-yyyy)
----------------------------------------------------------------------
✓ All dates are in correct format

2. MISSING VALUES ANALYSIS
----------------------------------------------------------------------
✓ No missing values found in the dataset

======================================================================

✓ Cleaned data saved to: stock_data_cleaned.csv
✓ Output contains 231 rows

✓ All validation checks passed!
```

### Example 2: File with Issues

For a file with missing values and date format errors:

```bash
python validate_stock_data.py problematic_data.csv
```

The script will:
- Report date format errors (e.g., "2020-02-06" should be "02-06-2020")
- Show which values were imputed
- Warn about gaps too large to impute automatically
- Create a cleaned file with imputed values

## Command Line Arguments

| Argument | Required | Description | Default |
|----------|----------|-------------|---------|
| `input_file` | Yes | Input CSV file to validate and clean | - |
| `-output` | No | Output CSV filename | `input_file_cleaned.csv` |
| `-max-consecutive` | No | Maximum consecutive missing values to impute | 2 |
| `--skip-date-validation` | No | Skip date format validation | False |

## What the Script Does

### 1. Date Format Validation

The script checks that all dates in the Date column are in **mm-dd-yyyy** format:

✓ Valid: `01-02-2020`, `12-31-2024`
✗ Invalid: `2020-01-02`, `1-2-2020`, `01/02/2020`

### 2. Missing Value Detection

The script identifies missing values in all data columns (excluding Date).

### 3. Smart Imputation

For **1-2 consecutive missing values**, the script automatically imputes using:
- **Forward fill**: Uses the previous valid value
- **Backfill**: If forward fill isn't possible (e.g., at start of series), uses the next valid value

**Example:**
```csv
Date,STOCK_A
01-02-2020,100.50
01-09-2020,      # Missing - will be filled with 100.50
01-16-2020,102.30
```

### 4. Large Gap Reporting

For **3+ consecutive missing values**, the script:
- Does NOT impute automatically (to avoid introducing errors)
- Reports these gaps for manual review
- Preserves the missing values in the output file

### 5. Output Report

The script generates a comprehensive report showing:
- Date format errors (if any)
- Missing values before and after cleaning
- Which specific values were imputed
- Large gaps requiring manual attention

## Understanding the Report

### Section 1: Date Format Validation

```
1. DATE FORMAT VALIDATION (mm-dd-yyyy)
----------------------------------------------------------------------
✓ All dates are in correct format
```

or

```
1. DATE FORMAT VALIDATION (mm-dd-yyyy)
----------------------------------------------------------------------
✗ Found 1 date format error(s):
  - Row 7: Invalid date format: '2020-02-06' (expected mm-dd-yyyy)
```

### Section 2: Missing Values Summary

```
2. MISSING VALUES ANALYSIS
----------------------------------------------------------------------
Missing values summary:

  Column          Before     After      Imputed
  --------------------------------------------------
  STOCK_A         2          0          2
  STOCK_B         5          0          5
  STOCK_C         3          0          3
```

- **Before**: Number of missing values in original file
- **After**: Number of missing values in cleaned file
- **Imputed**: Number of values successfully filled in

### Section 3: Imputation Details

```
3. IMPUTATION DETAILS
----------------------------------------------------------------------
Values imputed using forward fill / backfill:

  STOCK_A:
    - Row(s) 12-13: 2 value(s) imputed

  STOCK_B:
    - Row(s) 3: 1 value(s) imputed
    - Row(s) 10: 1 value(s) imputed
```

Shows exactly which rows had values imputed for each column.

### Section 4: Large Gaps (If Any)

```
4. GAPS NOT IMPUTED (>2 consecutive missing values)
----------------------------------------------------------------------
⚠ The following gaps were NOT imputed (manual review recommended):

  STOCK_C:
    - Rows 15-19: 5 consecutive missing values
```

These require manual review and correction.

## Best Practices

1. **Always review the report** - Check what was imputed and whether it makes sense
2. **Fix date format errors** - Correct any dates not in mm-dd-yyyy format in the original file
3. **Handle large gaps manually** - For 3+ consecutive missing values, decide whether to:
   - Remove those dates entirely
   - Find the correct values from another source
   - Use more sophisticated imputation methods
4. **Verify imputed values** - Spot-check a few imputed values to ensure they're reasonable
5. **Keep original file** - The script creates a new cleaned file and preserves your original data

## When to Use This Script

Use this script when:
- ✓ You've manually created a CSV file
- ✓ You've combined data from multiple sources
- ✓ You suspect there may be missing values
- ✓ You want to verify date formats before uploading to the analyzer
- ✓ You've downloaded data from sources other than Yahoo Finance

You may NOT need this script if:
- You're using `get_stock_prices.py` (it already formats dates correctly)
- Your data source guarantees complete, clean data
- You've already validated your data

## Troubleshooting

### Issue: "No module named 'pandas'"

```bash
pip install pandas
```

### Issue: "File not found"

Make sure the file path is correct. Use:
```bash
# Linux/Mac
python validate_stock_data.py /full/path/to/file.csv

# Or navigate to the directory first
cd /path/to/directory
python validate_stock_data.py file.csv
```

### Issue: "CSV file must have a 'Date' column"

Your CSV file must have a column named exactly `Date` (case-sensitive).

### Issue: Too many values are being imputed

If you want to be more conservative, reduce the maximum consecutive imputation:

```bash
python validate_stock_data.py data.csv -max-consecutive 1
```

This will only impute single missing values, not pairs.

### Issue: Script reports missing values but doesn't impute them

This happens when there are more than 2 consecutive missing values. These are reported in Section 4 of the report and require manual correction.

## Integration with get_stock_prices.py

The validation script works great as a second step after downloading:

```bash
# Step 1: Download data
python get_stock_prices.py -stocks AAPL,GOOGL -index ^GSPC -from 01-01-2020 -to 12-31-2024 -output raw_data.csv

# Step 2: Validate and clean (optional, but recommended if you suspect issues)
python validate_stock_data.py raw_data.csv -output final_data.csv

# Step 3: Upload final_data.csv to the Stock Alpha & Beta Analyzer
```

## License

This script is provided as-is for use with the Stock Alpha & Beta Analyzer.
