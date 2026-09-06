/** Hardcoded quick-amount chips by category keyword (normalized name). */
const PRESET_RULES: { match: RegExp; amounts: number[] }[] = [
  { match: /fuel|petrol|gas|diesel/, amounts: [4000, 5000, 10000] },
  { match: /fast\s*food|food|lunch|dinner|snack/, amounts: [1000, 2000, 3000] },
  { match: /grocer|market/, amounts: [2000, 5000, 10000] },
  { match: /transport|uber|careem|rickshaw/, amounts: [500, 1000, 2000] },
  { match: /rent|utility|bill/, amounts: [10000, 20000, 50000] },
];

const DEFAULT_PRESETS = [1000, 2000, 5000];

/**
 * Preset amounts for a category, optionally prepended with the last
 * expense amount for that category when it is not already in the list.
 */
export function getAmountPresets(
  categoryName: string,
  lastAmount?: number,
): number[] {
  const key = categoryName.trim().toLowerCase();
  const rule = PRESET_RULES.find((r) => r.match.test(key));
  const base = [...(rule?.amounts ?? DEFAULT_PRESETS)];

  if (
    lastAmount != null &&
    Number.isFinite(lastAmount) &&
    lastAmount > 0 &&
    !base.includes(lastAmount)
  ) {
    return [lastAmount, ...base].slice(0, 4);
  }
  return base;
}

/** Most recent expense amount for a category name (case-insensitive). */
export function lastExpenseAmountForCategory(
  categoryName: string,
  entries: { category: string; amount: number; type: string; occurredAt: Date }[],
): number | undefined {
  const key = categoryName.trim().toLowerCase();
  const match = entries
    .filter(
      (e) =>
        e.type === "expense" && e.category.trim().toLowerCase() === key,
    )
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0];
  return match?.amount;
}
