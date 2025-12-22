#!/usr/bin/env python3
"""
Tender Data Import Script for Supabase

This script reads the Vietnamese CSV file and imports it into Supabase tenders table.
It handles data transformation, cleaning, and batch insertion.

Usage:
    python import_tender_data.py --csv tender_data.csv --url YOUR_SUPABASE_URL --key YOUR_SERVICE_ROLE_KEY
"""

import csv
import sys
import argparse
import re
from typing import Dict, Optional
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
    """Normalize row keys by stripping whitespace (handles columns with leading/trailing spaces)."""
    return {k.strip(): v for k, v in row.items()}

def get_column_safe(normalized_row: Dict[str, str], column_name: str) -> str:
    """Safely get column value from normalized row."""
    return normalized_row.get(column_name, '')

def transform_row(row: Dict[str, str]) -> Optional[Dict]:
    """Transform a CSV row to match the database schema."""
    try:
        # Normalize keys to handle spaces in column names
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
        
        # Validate required fields
        if not month or not year:
            print(f"Warning: Skipping row - missing month/year: {row}")
            return None
        
        if not customer_name:
            print(f"Warning: Skipping row - missing customer name: {row}")
            return None
        
        if not tender_package_name:
            print(f"Warning: Skipping row - missing tender package name: {row}")
            return None
        
        if not winning_company:
            print(f"Warning: Skipping row - missing winning company: {row}")
            return None
        
        # Handle empty manufacturer (required field) - use "Unknown" as default
        if not manufacturer:
            manufacturer = "Unknown"
        
        if not product_name:
            print(f"Warning: Skipping row - missing product name: {row}")
            return None
        
        if not sales_username:
            print(f"Warning: Skipping row - missing sales username: {row}")
            return None
        
        # Build the database record
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
        
        # Add optional numeric fields (use 0 if None for required fields)
        record['capacity'] = capacity if capacity is not None else 0
        record['winning_quantity'] = winning_quantity if winning_quantity is not None else 0
        record['unit_price'] = unit_price if unit_price is not None else 0
        record['winning_value'] = winning_value if winning_value is not None else 0
        
        # Add optional text field
        if winning_config:
            record['winning_config'] = winning_config
        
        return record
        
    except Exception as e:
        print(f"Error transforming row: {e}")
        print(f"Row data: {row}")
        return None

def lookup_sale_id(supabase: Client, sale_identifier: str, profile_cache: Dict[str, str]) -> Optional[str]:
    """
    Look up sale_id (profile UUID) from various identifier formats.
    Handles: UUID, username, email, or username@domain format.
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
    
    # Try to find by email (if identifier contains @)
    if '@' in sale_identifier:
        result = supabase.table('profiles').select('id').eq('email', sale_identifier.strip()).maybe_single().execute()
        if result.data:
            profile_cache[sale_identifier] = result.data['id']
            return result.data['id']
    
    # Try to find by username (extract username from email or use as-is)
    username = sale_identifier.split('@')[0].strip() if '@' in sale_identifier else sale_identifier.strip()
    
    # Query auth.users to find user by email prefix (username)
    # We need to construct the email and check profiles
    # First, try to find profiles where email starts with username@
    result = supabase.table('profiles').select('id, email').ilike('email', f'{username}@%').limit(1).execute()
    if result.data and len(result.data) > 0:
        profile_id = result.data[0]['id']
        profile_cache[sale_identifier] = profile_id
        return profile_id
    
    # If not found, return None (will be handled in transform_row)
    return None

def transform_row(row: Dict[str, str], supabase: Client, profile_cache: Dict[str, str]) -> Optional[Dict]:
    """Transform a CSV row to match the database schema."""
    try:
        # Normalize keys to handle spaces in column names
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
        
        # Get sale_id from CSV - try 'sale_id' column first, then 'Sale' column
        sale_id_value = clean_text(get_column_safe(normalized, 'sale_id')) or sales_username
        
        # Validate required fields
        if not month or not year:
            print(f"Warning: Skipping row - missing month/year")
            return None
        
        if not customer_name:
            print(f"Warning: Skipping row - missing customer name")
            return None
        
        if not tender_package_name:
            print(f"Warning: Skipping row - missing tender package name")
            return None
        
        if not winning_company:
            print(f"Warning: Skipping row - missing winning company")
            return None
        
        # Handle empty manufacturer (required field) - use "Unknown" as default
        if not manufacturer:
            manufacturer = "Unknown"
        
        if not product_name:
            print(f"Warning: Skipping row - missing product name")
            return None
        
        if not sales_username:
            print(f"Warning: Skipping row - missing sales username")
            return None
        
        # Look up sale_id from sale identifier
        sale_id = None
        if sale_id_value:
            sale_id = lookup_sale_id(supabase, sale_id_value, profile_cache)
            if not sale_id:
                print(f"Warning: Could not find profile for sale identifier '{sale_id_value}'. Row will be imported without sale_id.")
        
        # Build the database record
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
        
        # Add sale_id if found
        if sale_id:
            record['sale_id'] = sale_id
        
        # Add optional numeric fields (use 0 if None for required fields)
        record['capacity'] = capacity if capacity is not None else 0
        record['winning_quantity'] = winning_quantity if winning_quantity is not None else 0
        record['unit_price'] = unit_price if unit_price is not None else 0
        record['winning_value'] = winning_value if winning_value is not None else 0
        
        # Add optional text field
        if winning_config:
            record['winning_config'] = winning_config
        
        return record
        
    except Exception as e:
        print(f"Error transforming row: {e}")
        return None

def import_csv_to_supabase(
    csv_file: str,
    supabase_url: str,
    supabase_key: str,
    batch_size: int = 100
):
    """Import CSV data to Supabase in batches."""
    
    # Initialize Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Cache for profile lookups (username/email -> UUID)
    profile_cache: Dict[str, str] = {}
    
    # Read and process CSV
    records = []
    skipped = 0
    total_rows = 0
    
    print(f"Reading CSV file: {csv_file}")
    
    try:
        with open(csv_file, 'r', encoding='utf-8-sig') as f:
            # Detect delimiter
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            # Use csv.QUOTE_MINIMAL and handle multiline fields
            reader = csv.DictReader(
                f, 
                delimiter=delimiter,
                quoting=csv.QUOTE_MINIMAL,
                skipinitialspace=True
            )
            
            # Process each row
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                total_rows += 1
                if total_rows % 100 == 0:
                    print(f"Processing row {total_rows}...")
                transformed = transform_row(row, supabase, profile_cache)
                
                if transformed:
                    records.append(transformed)
                else:
                    skipped += 1
                
                # Insert in batches
                if len(records) >= batch_size:
                    print(f"Inserting batch of {len(records)} records...")
                    result = supabase.table('tenders').insert(records).execute()
                    print(f"✓ Inserted {len(records)} records")
                    records = []
        
        # Insert remaining records
        if records:
            print(f"Inserting final batch of {len(records)} records...")
            result = supabase.table('tenders').insert(records).execute()
            print(f"✓ Inserted {len(records)} records")
        
        print(f"\n✓ Import completed!")
        print(f"  Total rows processed: {total_rows}")
        print(f"  Successfully imported: {total_rows - skipped}")
        print(f"  Skipped: {skipped}")
        
    except FileNotFoundError:
        print(f"Error: CSV file not found: {csv_file}")
        sys.exit(1)
    except Exception as e:
        print(f"Error during import: {e}")
        if records:
            print(f"Note: {len(records)} records were not inserted due to the error.")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(
        description='Import tender data from CSV to Supabase',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example:
  python import_tender_data.py --csv tender_data.csv --url https://xxx.supabase.co --key YOUR_SERVICE_ROLE_KEY

Note: Use the SERVICE_ROLE_KEY (not the anon key) to bypass RLS policies during import.
        """
    )
    
    parser.add_argument(
        '--csv',
        required=True,
        help='Path to the CSV file to import'
    )
    
    parser.add_argument(
        '--url',
        required=True,
        help='Supabase project URL'
    )
    
    parser.add_argument(
        '--key',
        required=True,
        help='Supabase service role key (required to bypass RLS)'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Number of records to insert per batch (default: 100)'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Tender Data Import Script")
    print("=" * 60)
    print()
    
    import_csv_to_supabase(
        csv_file=args.csv,
        supabase_url=args.url,
        supabase_key=args.key,
        batch_size=args.batch_size
    )

if __name__ == '__main__':
    main()

