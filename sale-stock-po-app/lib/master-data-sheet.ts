type SheetColumn = {
  key: string;
  label: string;
};

type SheetRow = Record<string, unknown>;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export async function readSheetRows(file: File): Promise<SheetRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
    defval: "",
    raw: false,
  });
}

export async function exportSheet({
  rows,
  columns,
  filename,
  sheetName,
}: {
  rows: SheetRow[];
  columns: SheetColumn[];
  filename: string;
  sheetName: string;
}) {
  const XLSX = await import("xlsx");
  const header = columns.map((column) => column.label);
  const data = rows.map((row) => columns.map((column) => row[column.key] ?? ""));
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  worksheet["!cols"] = columns.map((column, index) => ({
    wch: Math.max(
      column.label.length,
      ...data.map((row) => String(row[index] ?? "").length),
      10
    ) + 2,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

export function readSheetText(row: SheetRow, aliases: string[]) {
  for (const [key, value] of Object.entries(row)) {
    if (aliases.includes(normalizeHeader(key))) {
      return String(value ?? "").trim();
    }
  }
  return "";
}

export function readSheetNumber(row: SheetRow, aliases: string[], fallback = 0) {
  const value = readSheetText(row, aliases);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
