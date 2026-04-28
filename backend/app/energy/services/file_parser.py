"""
Parser for energy data files.

Supports CSV, TXT (delimiter-auto-detected), JSON and XLSX.
Auto-detects column names for date, produced (kWh) and consumed (kWh).
Returns a list of dicts with keys: date (datetime.date), produced (float), consumed (float).
"""

import csv
import io
import json
from datetime import date, datetime


# ---------------------------------------------------------------------------
# Keywords used to detect which column maps to each concept
# ---------------------------------------------------------------------------

_DATE_KEYWORDS = ["date", "fecha", "timestamp", "day", "dia", "día", "time"]
_PRODUCED_KEYWORDS = [
    "produced",
    "produccion",
    "producción",
    "production",
    "producida",
    "energia_producida",
    "energy_produced",
    "kwh_produced",
    "produced_kwh",
]
_CONSUMED_KEYWORDS = [
    "consumed",
    "consumo",
    "consumption",
    "consumida",
    "energia_consumida",
    "energy_consumed",
    "kwh_consumed",
    "consumed_kwh",
]


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------


def _find_column(headers: list[str], keywords: list[str]) -> str | None:
    """Return the first header that contains any of the given keywords."""
    for kw in keywords:
        for h in headers:
            if kw in h.lower():
                return h
    return None


def _parse_date(value: str) -> date | None:
    """Try multiple date formats and return a date, or None on failure."""
    for fmt in (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d.%m.%Y",
    ):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None


def _parse_float(value) -> float:
    """Parse a numeric value, accepting commas as decimal separator."""
    try:
        return float(str(value).replace(",", ".").strip())
    except (ValueError, TypeError):
        return 0.0


# ---------------------------------------------------------------------------
# Format-specific parsers
# ---------------------------------------------------------------------------


def parse_csv_txt(content: str) -> list[dict]:
    """Parse CSV or whitespace/tab-delimited TXT with auto-detected delimiter."""
    sniffer = csv.Sniffer()
    try:
        dialect = sniffer.sniff(content[:2048])
        delimiter = dialect.delimiter
    except csv.Error:
        delimiter = ","

    reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
    rows = list(reader)
    if not rows:
        return []

    headers = list(rows[0].keys())
    date_col = _find_column(headers, _DATE_KEYWORDS)
    prod_col = _find_column(headers, _PRODUCED_KEYWORDS)
    cons_col = _find_column(headers, _CONSUMED_KEYWORDS)

    if not date_col:
        return []

    results = []
    for row in rows:
        parsed = _parse_date(str(row.get(date_col, "")))
        if not parsed:
            continue
        results.append(
            {
                "date": parsed,
                "produced": _parse_float(row.get(prod_col, 0)) if prod_col else 0.0,
                "consumed": _parse_float(row.get(cons_col, 0)) if cons_col else 0.0,
            }
        )
    return results


def parse_json_content(content: str) -> list[dict]:
    """Parse JSON — supports a list of records or common wrapper objects."""
    data = json.loads(content)

    # Normalise to a flat list
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = None
        for key in ("chart_data", "chartData", "data", "records", "energy_data"):
            val = data.get(key)
            if isinstance(val, list):
                items = val
                break
        if items is None:
            items = [data]
    else:
        return []

    results = []
    for item in items:
        if not isinstance(item, dict):
            continue

        keys = list(item.keys())
        date_key = _find_column(keys, _DATE_KEYWORDS)
        prod_key = _find_column(keys, _PRODUCED_KEYWORDS)
        cons_key = _find_column(keys, _CONSUMED_KEYWORDS)

        if not date_key:
            continue

        raw_date = item.get(date_key, "")
        if isinstance(raw_date, datetime):
            parsed = raw_date.date()
        elif isinstance(raw_date, date):
            parsed = raw_date
        else:
            parsed = _parse_date(str(raw_date))

        if not parsed:
            continue

        results.append(
            {
                "date": parsed,
                "produced": _parse_float(item.get(prod_key, 0)) if prod_key else 0.0,
                "consumed": _parse_float(item.get(cons_key, 0)) if cons_key else 0.0,
            }
        )
    return results


def parse_xlsx_content(content: bytes) -> list[dict]:
    """Parse XLSX using openpyxl (lazy import — optional dependency)."""
    import openpyxl  # noqa: PLC0415

    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.active

    rows_iter = ws.iter_rows(values_only=True)
    header_row = next(rows_iter, None)
    if header_row is None:
        wb.close()
        return []

    headers = [str(c).strip() if c is not None else "" for c in header_row]
    date_col = _find_column(headers, _DATE_KEYWORDS)
    prod_col = _find_column(headers, _PRODUCED_KEYWORDS)
    cons_col = _find_column(headers, _CONSUMED_KEYWORDS)

    if not date_col:
        wb.close()
        return []

    date_idx = headers.index(date_col)
    prod_idx = headers.index(prod_col) if prod_col else None
    cons_idx = headers.index(cons_col) if cons_col else None

    results = []
    for row in rows_iter:
        if date_idx >= len(row):
            continue

        raw_date = row[date_idx]
        if isinstance(raw_date, datetime):
            parsed = raw_date.date()
        elif isinstance(raw_date, date):
            parsed = raw_date
        elif isinstance(raw_date, str):
            parsed = _parse_date(raw_date)
        else:
            continue

        if not parsed:
            continue

        produced = (
            _parse_float(row[prod_idx])
            if prod_idx is not None and prod_idx < len(row)
            else 0.0
        )
        consumed = (
            _parse_float(row[cons_idx])
            if cons_idx is not None and cons_idx < len(row)
            else 0.0
        )
        results.append({"date": parsed, "produced": produced, "consumed": consumed})

    wb.close()
    return results
