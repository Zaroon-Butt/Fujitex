/**
 * Money is stored as integer paisas everywhere (1 PKR = 100 paisas) to dodge
 * float rounding — same convention as the web app and the DB.
 */
const PKR_FORMATTER = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

export function formatPKR(paisas: number): string {
  return PKR_FORMATTER.format(paisas / 100);
}

/** Discount percentage between a compare-at and selling price, rounded. */
export function discountPct(pricePaisas: number, comparePaisas?: number | null): number | null {
  if (!comparePaisas || comparePaisas <= pricePaisas) return null;
  return Math.round(((comparePaisas - pricePaisas) / comparePaisas) * 100);
}
