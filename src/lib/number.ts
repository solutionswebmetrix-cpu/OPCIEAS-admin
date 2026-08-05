export function safeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  return 0;
}

export function safeDecimal(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function safeLakhDisplay(value: unknown): string {
  const numericValue = safeNumber(value) / 100000;
  return `₹${numericValue.toFixed(1)}L`;
}
