#!/usr/bin/env python3
"""
Stock Data Validator and Cleaner

Validates and cleans stock price data files by:
1. Standardizing date formats to MM-dd-yyyy (handles multiple input formats)
2. Validating all dates can be parsed correctly
3. Imputing missing values using forward fill or backfill for 1-2 consecutive missing values
4. Creating a cleaned output file

Supported date input formats:
  - MM-dd-yyyy (e.g., 01-13-2015)
  - yyyy-MM-dd (e.g., 2015-01-13)
  - MM/dd/yyyy (e.g., 01/13/2015)
  - yyyy/MM/dd (e.g., 2015/01/13)
  - dd-MM-yyyy (e.g., 13-01-2015)
  - dd/MM/yyyy (e.g., 13/01/2015)

Usage:
    python validate_stock_data.py input_file.csv -output cleaned_file.csv
    python validate_stock_data.py data.csv  # Creates data_cleaned.csv by default
"""

import argparse
import sys
from datetime import datetime
import pandas as pd
import os


def parse_date_with_multiple_formats(date_str):
    """
    Parse date string trying multiple common formats.

    Args:
        date_str: Date string to parse

    Returns:
        datetime object or None if parsing fails
    """
    date_formats = [
        '%m-%d-%Y',    # MM-dd-yyyy (e.g., 01-13-2015)
        '%Y-%m-%d',    # yyyy-MM-dd (e.g., 2015-01-13)
        '%m/%d/%Y',    # MM/dd/yyyy (e.g., 01/13/2015)
        '%Y/%m/%d',    # yyyy/MM/dd (e.g., 2015/01/13)
        '%d-%m-%Y',    # dd-MM-yyyy (e.g., 13-01-2015)
        '%d/%m/%Y',    # dd/MM/yyyy (e.g., 13/01/2015)
    ]

    for fmt in date_formats:
        try:
            return datetime.strptime(str(date_str), fmt)
        except ValueError:
            continue

    return None


def validate_date_format(date_str):
    """
    Validate if date string can be parsed.

    Args:
        date_str: Date string to validate

    Returns:
        tuple: (is_valid, error_message)
    """
    parsed_date = parse_date_with_multiple_formats(date_str)
    if parsed_date:
        return True, None
    else:
        return False, f"Invalid date format: '{date_str}' (could not parse)"


def standardize_dates(df):
    """
    Standardize all dates in the Date column to MM-dd-yyyy format.

    Args:
        df: DataFrame with Date column

    Returns:
        tuple: (standardized_df, conversion_report)
    """
    df_std = df.copy()
    conversion_report = {
        'converted': 0,
        'already_standard': 0,
        'errors': []
    }

    standardized_dates = []
    for idx, date_val in enumerate(df['Date']):
        date_str = str(date_val)
        parsed_date = parse_date_with_multiple_formats(date_str)

        if parsed_date:
            # Convert to MM-dd-yyyy format
            standardized = parsed_date.strftime('%m-%d-%Y')
            standardized_dates.append(standardized)

            # Check if it was already in the standard format
            if date_str == standardized:
                conversion_report['already_standard'] += 1
            else:
                conversion_report['converted'] += 1
        else:
            # Keep original if parsing fails
            standardized_dates.append(date_str)
            conversion_report['errors'].append({
                'row': idx + 2,
                'value': date_str
            })

    df_std['Date'] = standardized_dates
    return df_std, conversion_report


def check_date_column(df):
    """
    Check all dates in the Date column for correct format.

    Args:
        df: DataFrame with Date column

    Returns:
        tuple: (all_valid, error_list)
    """
    errors = []
    for idx, date_val in enumerate(df['Date']):
        is_valid, error_msg = validate_date_format(str(date_val))
        if not is_valid:
            errors.append(f"Row {idx + 2}: {error_msg}")  # +2 for header and 0-indexing

    return len(errors) == 0, errors


def count_consecutive_missing(series, index):
    """
    Count consecutive missing values at a given position.

    Args:
        series: Pandas Series
        index: Current index position

    Returns:
        int: Count of consecutive missing values
    """
    count = 0
    for i in range(index, len(series)):
        if pd.isna(series.iloc[i]):
            count += 1
        else:
            break
    return count


def impute_missing_values(df, max_consecutive=2):
    """
    Impute missing values using forward fill and backfill for small gaps.

    Only imputes if there are 1-2 consecutive missing values.
    Larger gaps are left as-is and reported.

    Args:
        df: DataFrame with stock data
        max_consecutive: Maximum number of consecutive missing values to impute

    Returns:
        tuple: (cleaned_df, imputation_report)
    """
    df_clean = df.copy()
    report = {
        'imputed': {},
        'not_imputed': {}
    }

    # Process each column except Date
    for col in df_clean.columns:
        if col == 'Date':
            continue

        imputed_positions = []
        not_imputed_positions = []

        # Find missing values
        missing_mask = df_clean[col].isna()
        missing_indices = missing_mask[missing_mask].index.tolist()

        if not missing_indices:
            continue

        # Group consecutive missing values
        i = 0
        while i < len(missing_indices):
            start_idx = missing_indices[i]
            consecutive_count = 1

            # Count consecutive missing
            while i + 1 < len(missing_indices) and missing_indices[i + 1] == missing_indices[i] + 1:
                consecutive_count += 1
                i += 1

            end_idx = missing_indices[i]

            # Impute if within threshold
            if consecutive_count <= max_consecutive:
                # Get the range including context for filling
                context_start = max(0, start_idx - 1)
                context_end = min(len(df_clean) - 1, end_idx + 1)

                # Create a temporary series with context
                temp_series = df_clean.loc[context_start:context_end, col].copy()

                # Apply forward fill first
                temp_series = temp_series.ffill()

                # Then backfill any remaining (handles start of series)
                temp_series = temp_series.bfill()

                # Update only the missing values range
                df_clean.loc[start_idx:end_idx, col] = temp_series.loc[start_idx:end_idx]

                imputed_positions.append({
                    'rows': f"{start_idx + 2}-{end_idx + 2}" if start_idx != end_idx else str(start_idx + 2),
                    'count': consecutive_count
                })
            else:
                not_imputed_positions.append({
                    'rows': f"{start_idx + 2}-{end_idx + 2}",
                    'count': consecutive_count
                })

            i += 1

        if imputed_positions:
            report['imputed'][col] = imputed_positions
        if not_imputed_positions:
            report['not_imputed'][col] = not_imputed_positions

    return df_clean, report


def print_report(date_conversion_report, date_errors, imputation_report, original_df, cleaned_df):
    """Print validation and cleaning report."""
    print("\n" + "="*70)
    print("STOCK DATA VALIDATION AND CLEANING REPORT")
    print("="*70)

    # Date standardization
    print("\n1. DATE FORMAT STANDARDIZATION")
    print("-" * 70)
    if date_conversion_report:
        total = date_conversion_report['converted'] + date_conversion_report['already_standard']
        print(f"✓ Processed {total} dates:")
        print(f"  - {date_conversion_report['already_standard']} already in MM-dd-yyyy format")
        print(f"  - {date_conversion_report['converted']} converted to MM-dd-yyyy format")

        if date_conversion_report['errors']:
            print(f"\n✗ Failed to parse {len(date_conversion_report['errors'])} date(s):")
            for error in date_conversion_report['errors'][:10]:
                print(f"  - Row {error['row']}: {error['value']}")
            if len(date_conversion_report['errors']) > 10:
                print(f"  ... and {len(date_conversion_report['errors']) - 10} more errors")

    # Date validation
    print("\n2. DATE FORMAT VALIDATION (mm-dd-yyyy)")
    print("-" * 70)
    if not date_errors:
        print("✓ All dates are in correct format")
    else:
        print(f"✗ Found {len(date_errors)} date format error(s):")
        for error in date_errors[:10]:  # Show first 10 errors
            print(f"  - {error}")
        if len(date_errors) > 10:
            print(f"  ... and {len(date_errors) - 10} more errors")

    # Missing values analysis
    print("\n3. MISSING VALUES ANALYSIS")
    print("-" * 70)

    columns_to_check = [col for col in original_df.columns if col != 'Date']
    missing_before = {}
    missing_after = {}

    for col in columns_to_check:
        before = original_df[col].isna().sum()
        after = cleaned_df[col].isna().sum()
        if before > 0:
            missing_before[col] = before
            missing_after[col] = after

    if not missing_before:
        print("✓ No missing values found in the dataset")
    else:
        print("Missing values summary:")
        print(f"\n  {'Column':<15} {'Before':<10} {'After':<10} {'Imputed':<10}")
        print("  " + "-" * 50)
        for col in missing_before:
            before = missing_before[col]
            after = missing_after[col]
            imputed = before - after
            print(f"  {col:<15} {before:<10} {after:<10} {imputed:<10}")

    # Imputation details
    if imputation_report['imputed']:
        print("\n4. IMPUTATION DETAILS")
        print("-" * 70)
        print("Values imputed using forward fill / backfill:")
        for col, positions in imputation_report['imputed'].items():
            print(f"\n  {col}:")
            for pos in positions:
                print(f"    - Row(s) {pos['rows']}: {pos['count']} value(s) imputed")

    # Non-imputed gaps
    if imputation_report['not_imputed']:
        print("\n5. GAPS NOT IMPUTED (>2 consecutive missing values)")
        print("-" * 70)
        print("⚠ The following gaps were NOT imputed (manual review recommended):")
        for col, positions in imputation_report['not_imputed'].items():
            print(f"\n  {col}:")
            for pos in positions:
                print(f"    - Rows {pos['rows']}: {pos['count']} consecutive missing values")
        print("\nℹ  These larger gaps should be manually reviewed and filled if needed.")

    print("\n" + "="*70)


def main():
    parser = argparse.ArgumentParser(
        description='Validate and clean stock price data files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Clean a data file (creates input_cleaned.csv)
  python validate_stock_data.py data.csv

  # Specify output filename
  python validate_stock_data.py data.csv -output clean_data.csv

  # Change maximum consecutive values to impute
  python validate_stock_data.py data.csv -max-consecutive 3

What this script does:
  1. Standardizes all dates to MM-dd-yyyy format (auto-detects input format)
  2. Validates all dates can be parsed correctly
  3. Identifies missing values in stock price columns
  4. Imputes 1-2 consecutive missing values using forward/backfill
  5. Reports larger gaps that need manual review
  6. Creates a cleaned output file
        """
    )

    parser.add_argument(
        'input_file',
        help='Input CSV file path'
    )

    parser.add_argument(
        '-output',
        '--output',
        help='Output CSV file path (default: input_file_cleaned.csv)'
    )

    parser.add_argument(
        '-max-consecutive',
        '--max-consecutive',
        type=int,
        default=2,
        help='Maximum consecutive missing values to impute (default: 2)'
    )

    parser.add_argument(
        '--skip-date-validation',
        action='store_true',
        help='Skip date format validation'
    )

    args = parser.parse_args()

    # Check if input file exists
    if not os.path.exists(args.input_file):
        print(f"Error: Input file '{args.input_file}' not found")
        sys.exit(1)

    # Determine output filename
    if args.output:
        output_file = args.output
    else:
        base_name = os.path.splitext(args.input_file)[0]
        output_file = f"{base_name}_cleaned.csv"

    try:
        # Read the CSV file
        print(f"\nReading file: {args.input_file}")
        df = pd.read_csv(args.input_file)

        # Validate required columns
        if 'Date' not in df.columns:
            print("Error: CSV file must have a 'Date' column")
            sys.exit(1)

        if len(df.columns) < 2:
            print("Error: CSV file must have at least one data column besides Date")
            sys.exit(1)

        print(f"✓ Loaded {len(df)} rows and {len(df.columns)} columns")

        # Standardize date formats to MM-dd-yyyy
        print("Standardizing date formats...")
        df_standardized, date_conversion_report = standardize_dates(df)

        # Validate date formats after standardization
        date_errors = []
        if not args.skip_date_validation:
            all_valid, date_errors = check_date_column(df_standardized)

        # Impute missing values
        df_clean, imputation_report = impute_missing_values(df_standardized, args.max_consecutive)

        # Print report
        print_report(date_conversion_report, date_errors, imputation_report, df, df_clean)

        # Save cleaned data
        df_clean.to_csv(output_file, index=False)

        print(f"\n✓ Cleaned data saved to: {output_file}")
        print(f"✓ Output contains {len(df_clean)} rows")

        # Exit with error code if there are issues
        if date_errors or imputation_report['not_imputed']:
            print("\n⚠  Warning: Some issues were found. Please review the report above.")
            if date_errors:
                print("   - Date format errors need to be corrected")
            if imputation_report['not_imputed']:
                print("   - Large gaps in data need manual review")
            sys.exit(0)  # Still exit successfully as we created the cleaned file
        else:
            print("\n✓ All validation checks passed!")

    except pd.errors.EmptyDataError:
        print("Error: The CSV file is empty")
        sys.exit(1)
    except pd.errors.ParserError as e:
        print(f"Error: Failed to parse CSV file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
