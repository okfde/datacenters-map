function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(
  headers: readonly string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines = [
    headers.map(escapeCsvCell).join(";"),
    ...rows.map((row) => row.map(escapeCsvCell).join(";")),
  ];
  return `${lines.join("\n")}\n`;
}

// Excel needs a UTF-8 BOM for German CSV.
export const UTF8_BOM = "\uFEFF";

/** One preamble row (column A) with line breaks inside a quoted cell */
export function formatCsvLicensePreamble(lines: readonly string[]): string {
  return `${escapeCsvCell(lines.join("\n"))}\n\n`;
}
