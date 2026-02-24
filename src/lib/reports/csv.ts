export type CsvColumn<T> = {
  header: string;
  get: (row: T) => string | number | boolean | null | undefined;
};

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",");

  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const value = column.get(row);
        if (value === null || value === undefined) return "";
        return escapeCsvCell(String(value));
      })
      .join(","),
  );

  return [header, ...lines].join("\n");
}
