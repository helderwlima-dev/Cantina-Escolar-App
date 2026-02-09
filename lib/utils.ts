export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
};

export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

export const convertToCSV = <T extends Record<string, any>>(data: T[], columns?: { key: keyof T, header: string }[]): string => {
  if (data.length === 0) {
    return '';
  }

  const keys = columns ? columns.map(col => col.key) : Object.keys(data[0]);
  const headers = columns ? columns.map(col => col.header) : keys.map(key => key.toString().toUpperCase());

  const csvRows = [];
  csvRows.push(headers.join(',')); // Header row

  for (const row of data) {
    const values = keys.map(key => {
      const value = row[key];
      // Handle null, undefined, and values that might contain commas
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // Escape commas by wrapping in double quotes
      if (stringValue.includes(',')) {
        return `"${stringValue}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};
