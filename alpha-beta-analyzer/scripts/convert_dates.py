#!/usr/bin/env python3
import csv
import re
import sys
from datetime import datetime
from pathlib import Path


def parse_mixed_date(date_str: str) -> datetime:
    """
    Parse a date string that can be either:
      - YYYY-MM-DD  (e.g., 2015-01-01)
      - MM-DD-YYYY  (e.g., 01-13-2015)

    Returns a datetime.datetime object.

    Raises ValueError if the format does not match exactly one of the above.
    """
    s = date_str.strip()

    # Format 1: YYYY-MM-DD
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return datetime.strptime(s, "%Y-%d-%m")

    # Format 2: MM-DD-YYYY
    if re.fullmatch(r"\d{2}-\d{2}-\d{4}", s):
        return datetime.strptime(s, "%m-%d-%Y")

    raise ValueError(f"Unknown date format: {date_str!r}")


def convert_file(in_path: str, out_path: str) -> None:
    """
    Convert the first-column date in each row to DD/MM/YYYY
    without changing the row order.
    """
    in_path = Path(in_path)
    out_path = Path(out_path)

    with in_path.open(newline="", encoding="utf-8") as fin, out_path.open(
        "w", newline="", encoding="utf-8"
    ) as fout:

        reader = csv.reader(fin)
        writer = csv.writer(fout)

        for row in reader:
            if not row:
                continue

            first_field = row[0].strip()

            # Attempt to convert date formats
            try:
                dt = parse_mixed_date(first_field)
                row[0] = dt.strftime("%d/%m/%Y")
            except ValueError:
                # Not an expected date format -> leave row unchanged
                pass

            writer.writerow(row)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_dates.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    convert_file(input_file, output_file)

    print(f"Done. Converted file saved as: {output_file}")
