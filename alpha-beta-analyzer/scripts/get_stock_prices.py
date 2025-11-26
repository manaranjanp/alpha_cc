#!/usr/bin/env python3
"""
Stock Price Downloader for Alpha & Beta Analyzer

Downloads daily closing prices for stocks and market indices from Yahoo Finance.
Outputs data in the format required by the Stock Alpha & Beta Analyzer (mm-dd-yyyy).

Usage:
    python get_stock_prices.py -stocks RELIANCE.NS,TCS.NS,INFY.NS -index ^NSEI -from 01-01-2020 -to 12-31-2024 -output data.csv
"""

import argparse
import sys
from datetime import datetime
import pandas as pd

try:
    import yfinance as yf
except ImportError:
    print("Error: yfinance library not found. Install it with: pip install yfinance")
    sys.exit(1)


def parse_date(date_str):
    """Parse date string in mm-dd-yyyy format."""
    try:
        return datetime.strptime(date_str, '%m-%d-%Y')
    except ValueError:
        raise ValueError(f"Invalid date format: {date_str}. Expected mm-dd-yyyy")


def format_date(date):
    """Format date to mm-dd-yyyy string."""
    return date.strftime('%m-%d-%Y')


def download_stock_data(symbols, start_date, end_date):
    """
    Download closing prices for multiple symbols from Yahoo Finance.

    Args:
        symbols: List of ticker symbols
        start_date: Start date (datetime object)
        end_date: End date (datetime object)

    Returns:
        DataFrame with dates and closing prices
    """
    print(f"\nDownloading data from {format_date(start_date)} to {format_date(end_date)}...")
    print(f"Symbols: {', '.join(symbols)}")

    # Download data for all symbols
    data = yf.download(
        symbols,
        start=start_date,
        end=end_date,
        progress=True,
        group_by='ticker'
    )

    if data.empty:
        raise ValueError("No data downloaded. Check your ticker symbols and date range.")

    # Extract closing prices
    closing_prices = pd.DataFrame()

    if len(symbols) == 1:
        # Single symbol case
        closing_prices[symbols[0]] = data['Close']
    else:
        # Multiple symbols case
        for symbol in symbols:
            try:
                closing_prices[symbol] = data[symbol]['Close']
            except KeyError:
                print(f"Warning: No data found for {symbol}")

    # Reset index to make Date a column
    closing_prices.reset_index(inplace=True)

    # Rename Date column and format it
    closing_prices.rename(columns={'Date': 'Date'}, inplace=True)
    closing_prices['Date'] = closing_prices['Date'].apply(format_date)

    # Remove any rows with all NaN values (except Date)
    closing_prices.dropna(how='all', subset=closing_prices.columns[1:], inplace=True)

    return closing_prices


def clean_column_names(df, stocks, index_name):
    """
    Clean up column names by removing ticker suffixes.

    Args:
        df: DataFrame with stock data
        stocks: List of original stock ticker symbols
        index_name: Market index ticker symbol

    Returns:
        DataFrame with cleaned column names
    """
    rename_map = {}

    # Create a mapping to clean up ticker names
    for col in df.columns:
        if col == 'Date':
            continue

        # Remove common suffixes like .NS, .BO, ^NSEI, etc.
        clean_name = col.replace('.NS', '').replace('.BO', '').replace('^', '')

        # If it's the index, name it appropriately
        if col == index_name:
            clean_name = clean_name if '^' not in index_name else clean_name

        rename_map[col] = clean_name

    df.rename(columns=rename_map, inplace=True)
    return df


def main():
    parser = argparse.ArgumentParser(
        description='Download stock prices from Yahoo Finance for Alpha & Beta Analyzer',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Download Indian stocks from NSE
  python get_stock_prices.py -stocks RELIANCE.NS,TCS.NS,INFY.NS -index ^NSEI -from 01-01-2020 -to 12-31-2024

  # Download US stocks from NYSE/NASDAQ
  python get_stock_prices.py -stocks AAPL,GOOGL,MSFT -index ^GSPC -from 01-01-2020 -to 12-31-2024

  # Download with custom output file
  python get_stock_prices.py -stocks TSLA,NVDA -index ^IXIC -from 01-01-2023 -to 12-31-2024 -output tech_stocks.csv

Common Index Symbols:
  ^NSEI  - NIFTY 50 (India)
  ^BSESN - BSE SENSEX (India)
  ^GSPC  - S&P 500 (USA)
  ^DJI   - Dow Jones Industrial Average (USA)
  ^IXIC  - NASDAQ Composite (USA)

Stock Symbol Format:
  Indian NSE: Add .NS suffix (e.g., RELIANCE.NS, TCS.NS)
  Indian BSE: Add .BO suffix (e.g., RELIANCE.BO, TCS.BO)
  US Stocks: Use regular ticker (e.g., AAPL, GOOGL, MSFT)
        """
    )

    parser.add_argument(
        '-stocks',
        '--stocks',
        required=True,
        help='Comma-separated list of stock ticker symbols (e.g., RELIANCE.NS,TCS.NS,INFY.NS)'
    )

    parser.add_argument(
        '-index',
        '--index',
        required=True,
        help='Market index ticker symbol (e.g., ^NSEI for NIFTY 50, ^GSPC for S&P 500)'
    )

    parser.add_argument(
        '-from',
        '--from-date',
        dest='from_date',
        required=True,
        help='Start date in mm-dd-yyyy format (e.g., 01-01-2020)'
    )

    parser.add_argument(
        '-to',
        '--to-date',
        dest='to_date',
        required=True,
        help='End date in mm-dd-yyyy format (e.g., 12-31-2024)'
    )

    parser.add_argument(
        '-output',
        '--output',
        default='stock_data.csv',
        help='Output CSV file name (default: stock_data.csv)'
    )

    parser.add_argument(
        '--keep-suffixes',
        action='store_true',
        help='Keep ticker suffixes (.NS, .BO, etc.) in column names'
    )

    args = parser.parse_args()

    try:
        # Parse inputs
        stock_list = [s.strip() for s in args.stocks.split(',')]
        index_symbol = args.index.strip()

        # Combine stocks and index into one list
        all_symbols = stock_list + [index_symbol]

        # Parse dates
        start_date = parse_date(args.from_date)
        end_date = parse_date(args.to_date)

        if start_date >= end_date:
            print("Error: Start date must be before end date")
            sys.exit(1)

        # Download data
        print("\n" + "="*60)
        print("Stock Price Downloader for Alpha & Beta Analyzer")
        print("="*60)

        df = download_stock_data(all_symbols, start_date, end_date)

        # Clean column names unless user wants to keep suffixes
        if not args.keep_suffixes:
            df = clean_column_names(df, stock_list, index_symbol)

        # Save to CSV
        df.to_csv(args.output, index=False)

        print("\n" + "="*60)
        print(f"✓ Data downloaded successfully!")
        print(f"✓ Saved to: {args.output}")
        print(f"✓ Date range: {df['Date'].iloc[0]} to {df['Date'].iloc[-1]}")
        print(f"✓ Total rows: {len(df)}")
        print(f"✓ Columns: {', '.join(df.columns.tolist())}")
        print("="*60)

        # Display first few rows
        print("\nPreview (first 5 rows):")
        print(df.head().to_string(index=False))

        # Display basic statistics
        print("\nData Summary:")
        print(f"  Total trading days: {len(df)}")
        print(f"  Date coverage: {(end_date - start_date).days} days")
        print(f"  Missing values per column:")
        for col in df.columns:
            if col != 'Date':
                missing = df[col].isna().sum()
                if missing > 0:
                    print(f"    {col}: {missing} ({missing/len(df)*100:.1f}%)")

        print("\n✓ File is ready to upload to Stock Alpha & Beta Analyzer!")
        print(f"  Upload {args.output} to the analyzer application.\n")

    except ValueError as e:
        print(f"\nError: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
