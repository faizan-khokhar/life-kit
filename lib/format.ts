/**
 * Formats amounts as "Rs 250,000" using Western thousands grouping.
 * en-PK would produce Pakistani grouping (2,50,000), which does not
 * match the LifeKit UI examples.
 */
export function formatPKR(amount: number): string {
  const absolute = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(absolute);
  return `Rs ${formatted}`;
}

export function formatSignedPKR(amount: number): string {
  if (amount > 0) return `+${formatPKR(amount)}`;
  if (amount < 0) return `-${formatPKR(amount)}`;
  return formatPKR(0);
}

export function formatPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
