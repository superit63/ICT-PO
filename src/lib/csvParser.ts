export interface TenderRecord {
  month: number;
  year: number;
  customer_name: string;
  tender_package_name: string;
  winning_company: string;
  manufacturer: string;
  product_name: string;
  capacity: number;
  winning_quantity: number;
  unit_price: number;
  winning_value: number;
  winning_config: string;
  sales_username: string;
}

export function parseTenderCSV(csvText: string): TenderRecord[] {
  let cleanedText = csvText;

  if (cleanedText.charCodeAt(0) === 0xFEFF) {
    cleanedText = cleanedText.slice(1);
  }

  const lines = cleanedText.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const columnMap: Record<string, string> = {};
  headers.forEach((header, index) => {
    const cleaned = header.trim();
    if (cleaned === 'Tháng') columnMap['month'] = index.toString();
    if (cleaned === 'Năm') columnMap['year'] = index.toString();
    if (cleaned === 'Tên Khách hàng') columnMap['customer_name'] = index.toString();
    if (cleaned === 'Tên gói thầu') columnMap['tender_package_name'] = index.toString();
    if (cleaned === 'Công ty trúng thầu') columnMap['winning_company'] = index.toString();
    if (cleaned === 'Hãng SX') columnMap['manufacturer'] = index.toString();
    if (cleaned === 'Tên mặt hàng dự thầu') columnMap['product_name'] = index.toString();
    if (cleaned === 'Dung tích') columnMap['capacity'] = index.toString();
    if (cleaned === 'Số lượng trúng thầu') columnMap['winning_quantity'] = index.toString();
    if (cleaned === 'Đơn giá trúng thầu') columnMap['unit_price'] = index.toString();
    if (cleaned === 'Giá trị trúng thầu') columnMap['winning_value'] = index.toString();
    if (cleaned === 'Cấu hình trúng thầu') columnMap['winning_config'] = index.toString();
    if (cleaned === 'Sale') columnMap['sales_username'] = index.toString();
  });

  const records: TenderRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    try {
      const record: TenderRecord = {
        month: parseInt(values[parseInt(columnMap['month'])] || '0'),
        year: parseInt(values[parseInt(columnMap['year'])] || '0'),
        customer_name: (values[parseInt(columnMap['customer_name'])] || '').trim(),
        tender_package_name: (values[parseInt(columnMap['tender_package_name'])] || '').trim(),
        winning_company: (values[parseInt(columnMap['winning_company'])] || '').trim(),
        manufacturer: (values[parseInt(columnMap['manufacturer'])] || '').trim(),
        product_name: (values[parseInt(columnMap['product_name'])] || '').trim(),
        capacity: parseFloat(values[parseInt(columnMap['capacity'])] || '0'),
        winning_quantity: parseFloat(values[parseInt(columnMap['winning_quantity'])] || '0'),
        unit_price: parseFloat(values[parseInt(columnMap['unit_price'])] || '0'),
        winning_value: parseFloat(values[parseInt(columnMap['winning_value'])] || '0'),
        winning_config: (values[parseInt(columnMap['winning_config'])] || '').trim(),
        sales_username: (values[parseInt(columnMap['sales_username'])] || '').trim(),
      };

      if (record.customer_name && record.product_name) {
        records.push(record);
      }
    } catch (error) {
      console.warn(`Skipping invalid row ${i}:`, error);
    }
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);

  return result;
}
