export function downloadCsv(filename: string, headers: string[], rows: Array<Record<string, unknown> | string[]>) {
  const escapeValue = (value: unknown) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const csvRows = [headers.map(escapeValue).join(',')];
  rows.forEach((row) => {
    if (Array.isArray(row)) {
      csvRows.push(row.map(escapeValue).join(','));
      return;
    }

    const values = headers.map((header) => escapeValue(row[header]));
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
