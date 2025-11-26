# Stock Price Download Script

Python script to download daily closing prices from Yahoo Finance for use with the Stock Alpha & Beta Analyzer.

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

## License

This script is provided as-is for use with the Stock Alpha & Beta Analyzer.
