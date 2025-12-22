#!/usr/bin/env python3
"""
Tender Data Transformation Script (No Upload)

This script reads the Vietnamese CSV file, cleans the data, 
looks up User IDs from Supabase (Read-only), and exports the result to a JSON file.

Usage:
    python transform_tender_data.py --csv tender_data.csv --url YOUR_SUPABASE_URL --key YOUR_SERVICE_ROLE_KEY
"""

import csv
import sys
import argparse
import re
import json
from typing import Dict, Optional, List
from decimal import InvalidOperation
from supabase import create_client, Client

def clean_numeric(value: str) -> Optional[float]:
    """Clean and convert numeric values, handling Vietnamese formatting."""
    if not value or value.strip() == '' or value.strip() == ' ':
        return None
    
    # Remove spaces and commas (Vietnamese number formatting)
    cleaned = value.strip().replace(' ', '').replace(',', '')
    
    # Try to convert to float
    try:
        return float(cleaned)
    except (ValueError, InvalidOperation):
        return None

def clean_text(value: str) -> Optional[str]:
    """Clean text values, handling empty strings and whitespace."""
    if not value or value.strip() == '' or value.strip() == ' ':
        return None
    return value.strip()

def clean_integer(value: str) -> Optional[int]:
    """Clean and convert integer values."""
    if not value or value.strip() == '' or value.strip() == ' ':
        return None
    
    cleaned = value.strip().replace(' ', '').replace(',', '')
    try:
        return int(float(cleaned))  # Convert via float first to handle decimals
    except (ValueError, InvalidOperation):
        return None

def normalize_row_keys(row: Dict[str, str]) -> Dict[str, str]:
    """Normalize row keys by stripping whitespace."""
    return {k.strip(): v for k, v in row.items()}

def get_column_safe(normalized_row: Dict[str, str], column_name: str) -> str:
    """Safely get column value from normalized row."""
    return normalized_row.get(column_name, '')

def lookup_sale_id(supabase: Client, sale_identifier: str, profile_cache: Dict[str, str]) -> Optional[str]:
    """
    Look up sale_id (profile UUID) from various identifier formats.
    (Read-Only operation)
    """
    # Check cache first
    if sale_identifier in profile_cache:
        return profile_cache[sale_identifier]
    
    # If it's already a valid UUID format, try to use it directly
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if uuid_pattern.match(sale_identifier.strip()):
        # Verify it exists in profiles
        result = supabase.table('profiles').select('id').eq('id', sale_identifier.strip()).maybe_single().execute()
        if result.data:
            profile_cache[sale_identifier] = result.data['id']
            return result.data['id']
    
    # Try to find by email
    if '@' in sale_identifier:
        result = supabase.table('profiles').select('id').eq('email', sale_identifier.strip()).maybe_single().execute()
        if result.data:
            profile_cache[sale_identifier] = result.data['id']
            return result.data['id']
    
    # Try to find by username
    username = sale_identifier.split('@')[0].strip() if '@' in sale_identifier else sale_identifier.strip()
    
    result = supabase.table('profiles').select('id, email').ilike('email', f'{username}@%').limit(1).execute()
    if result.data and len(result.data) > 0:
        profile_id = result.data[0]['id']
        profile_cache[sale_identifier] = profile_id
        return profile_id
    
    return None

def transform_row(row: Dict[str, str], supabase: Client, profile_cache: Dict[str, str]) -> Optional[Dict]:
    """Transform a CSV row to match the database schema."""
    try:
        normalized = normalize_row_keys(row)
        
        # Map Vietnamese columns to database fields
        month = clean_integer(get_column_safe(normalized, 'Tháng'))
        year = clean_integer(get_column_safe(normalized, 'Năm'))
        customer_name = clean_text(get_column_safe(normalized, 'Tên Khách hàng'))
        tender_package_name = clean_text(get_column_safe(normalized, 'Tên gói thầu'))
        winning_company = clean_text(get_column_safe(normalized, 'Công ty trúng thầu'))
        manufacturer = clean_text(get_column_safe(normalized, 'Hãng SX'))
        product_name = clean_text(get_column_safe(normalized, 'Tên mặt hàng dự thầu'))
        capacity = clean_numeric(get_column_safe(normalized, 'Dung tích'))
        winning_quantity = clean_numeric(get_column_safe(normalized, 'Số lượng trúng thầu'))
        unit_price = clean_numeric(get_column_safe(normalized, 'Đơn giá trúng thầu'))
        winning_value = clean_numeric(get_column_safe(normalized, 'Giá trị trúng thầu'))
        winning_config = clean_text(get_column_safe(normalized, 'Cấu hình trúng thầu'))
        sales_username = clean_text(get_column_safe(normalized, 'Sale'))
        
        sale_id_value = clean_text(get_column_safe(normalized, 'sale_id')) or sales_username
        
        # Validate required fields
        if not month or not year:
            return None # Skip silently or log as needed
        if not customer_name:
            return None
        if not tender_package_name:
            return None
        if not winning_company:
            return None
        
        if not manufacturer:
            manufacturer = "Unknown"
        
        if not product_name:
            return None
        if not sales_username:
            return None
        
        # Look up sale_id from sale identifier
        sale_id = None
        if sale_id_value:
            sale_id = lookup_sale_id(supabase, sale_id_value, profile_cache)
            if not sale_id:
                print(f"Warning: Could not find profile for '{sale_id_value}'")
        
        record = {
            'month': month,
            'year': year,
            'customer_name': customer_name,
            'tender_package_name': tender_package_name,
            'winning_company': winning_company,
            'manufacturer': manufacturer,
            'product_name': product_name,
            'sales_username': sales_username,
        }
        
        if sale_id:
            record['sale_id'] = sale_id
        
        record['capacity'] = capacity if capacity is not None else 0
        record['winning_quantity'] = winning_quantity if winning_quantity is not None else 0
        record['unit_price'] = unit_price if unit_price is not None else 0
        record['winning_value'] = winning_value if winning_value is not None else 0
        
        if winning_config:
            record['winning_config'] = winning_config
        
        return record
        
    except Exception as e:
        print(f"Error transforming row: {e}")
        return None

def process_and_export_data(
    csv_file: str,
    supabase_url: str,
    supabase_key: str,
    output_file: str = "cleaned_tenders.json"
):
    """Read CSV, transform data, and export to JSON (No DB Upload)."""
    
    # Initialize Supabase client (Only for lookups, not inserts)
    supabase: Client = create_client(supabase_url, supabase_key)
    profile_cache: Dict[str, str] = {}
    
    records = []
    skipped = 0
    total_rows = 0
    
    print(f"Reading CSV file: {csv_file}")
    
    try:
        with open(csv_file, 'r', encoding='utf-8-sig') as f:
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(
                f, 
                delimiter=delimiter,
                quoting=csv.QUOTE_MINIMAL,
                skipinitialspace=True
            )
            
            for row in reader:
                total_rows += 1
                if total_rows % 100 == 0:
                    print(f"Processing row {total_rows}...")
                
                transformed = transform_row(row, supabase, profile_cache)
                
                if transformed:
                    records.append(transformed)
                else:
                    skipped += 1
        
        # EXPORT TO JSON instead of Supabase Insert
        print(f"\nWriting {len(records)} records to {output_file}...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
            
        print(f"✓ Export completed successfully!")
        print(f"  Total rows processed: {total_rows}")
        print(f"  Successfully transformed: {total_rows - skipped}")
        print(f"  Skipped: {skipped}")
        print(f"  Output file: {output_file}")
        
    except FileNotFoundError:
        print(f"Error: CSV file not found: {csv_file}")
        sys.exit(1)
    except Exception as e:
        print(f"Error during processing: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(
        description='Transform tender data from CSV to JSON (No Upload)',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('--csv', required=True, help='Path to the CSV file')
    parser.add_argument('--url', required=True, help='Supabase project URL (for ID lookup)')
    parser.add_argument('--key', required=True, help='Supabase service role key (for ID lookup)')
    parser.add_argument('--output', default='cleaned_tenders.json', help='Output JSON file name')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Tender Data Transformation (Local Export)")
    print("=" * 60)
    print()
    
    process_and_export_data(
        csv_file=args.csv,
        supabase_url=args.url,
        supabase_key=args.key,
        output_file=args.output
    )

if __name__ == '__main__':
    main()