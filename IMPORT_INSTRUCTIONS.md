# Tender Data Import Instructions

This guide will help you import the `tender_data.csv` file into your Supabase database.

## Prerequisites

1. **Python 3.7+** installed on your system
2. **Supabase credentials**:
   - Your Supabase project URL
   - Your Supabase **Service Role Key** (not the anon key - this is important!)

## Why Service Role Key?

The Service Role Key bypasses Row Level Security (RLS) policies, which is necessary for bulk data imports. The anon key will be blocked by RLS policies.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements_import.txt
   ```

   Or install directly:
   ```bash
   pip install supabase
   ```

## Running the Import

1. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy your **Project URL** and **service_role key** (not the anon key)

2. **Run the import script:**
   ```bash
   python import_tender_data.py --csv tender_data.csv --url YOUR_SUPABASE_URL --key YOUR_SERVICE_ROLE_KEY
   ```

   Example:
   ```bash
   python import_tender_data.py --csv tender_data.csv --url https://abcdefgh.supabase.co --key eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Optional: Adjust batch size** (if you encounter timeout issues):
   ```bash
   python import_tender_data.py --csv tender_data.csv --url YOUR_SUPABASE_URL --key YOUR_SERVICE_ROLE_KEY --batch-size 50
   ```

## What the Script Does

1. **Reads the CSV file** with Vietnamese column headers
2. **Maps columns** to the database schema:
   - `Tháng` → `month`
   - `Năm` → `year`
   - `Tên Khách hàng` → `customer_name`
   - `Tên gói thầu` → `tender_package_name`
   - `Công ty trúng thầu` → `winning_company`
   - `Hãng SX` → `manufacturer`
   - `Tên mặt hàng dự thầu` → `product_name`
   - `Dung tích` → `capacity`
   - `Số lượng trúng thầu` → `winning_quantity`
   - `Đơn giá trúng thầu` → `unit_price`
   - `Giá trị trúng thầu` → `winning_value`
   - `Cấu hình trúng thầu` → `winning_config`
   - `Sale` → `sales_username`
   - `sale_id` (or `Sale` if no `sale_id` column) → `sale_id` (looks up profile UUID from username/email/UUID)

3. **Cleans the data**:
   - Removes spaces and commas from numbers (Vietnamese formatting)
   - Handles empty values
   - Validates required fields
   - Looks up `sale_id` (profile UUID) from CSV value (supports UUID, username, or email format)

4. **Inserts data in batches** (default: 100 records per batch) to avoid timeouts

## Troubleshooting

### Error: "Missing required fields"
- The script will skip rows that are missing required fields (month, year, customer_name, etc.)
- Check the console output for warnings about skipped rows

### Error: "RLS policy violation"
- Make sure you're using the **Service Role Key**, not the anon key
- The service role key bypasses RLS policies

### Error: "Connection timeout"
- Try reducing the batch size with `--batch-size 50` or `--batch-size 25`
- Check your internet connection

### Error: "Invalid numeric value"
- The script handles Vietnamese number formatting (spaces, commas)
- If you see this error, check the specific row mentioned in the error message

### Warning: "Could not find profile for sale identifier"
- The script will import the row without `sale_id` if it can't find the profile
- Make sure your CSV has a `sale_id` column (or uses the `Sale` column) with valid usernames/emails/UUIDs
- The script looks up profiles by: UUID, email, or username (email prefix)
- Ensure all sales users exist in the `profiles` table before importing

## Security Note

⚠️ **Important**: The Service Role Key has full access to your database. Keep it secure and never commit it to version control.

After importing, you can verify the data in your Supabase dashboard:
1. Go to Table Editor
2. Select the `tenders` table
3. Check that your data was imported correctly

