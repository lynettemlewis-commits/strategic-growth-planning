import type { Market } from "./types";

/**
 * Currency configuration.
 *
 * Each market's projects carry native-currency economics: North America in
 * USD, Australia in AUD. There is no live FX dependency. A single, clearly
 * fictional planning exchange rate is used ONLY when the visitor chooses to
 * view the combined portfolio in one display currency — it never touches a
 * project's underlying native-market inputs or assumptions.
 *
 * This rate is a demo/planning assumption, not a claim about any real
 * exchange rate (historical or current). Change it here if you want a
 * different assumption — nothing else in the app hardcodes it.
 */
export const PLANNING_FX_RATE_USD_TO_AUD = 1.5; // US$1 = A$1.50 (fictional planning assumption)

export const DISPLAY_CURRENCIES = ["USD", "AUD"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const MARKET_CURRENCY: Record<Market, DisplayCurrency> = {
  north_america: "USD",
  australia: "AUD",
};

export const MARKET_LABEL: Record<Market, string> = {
  north_america: "North America",
  australia: "Australia",
};

export const CURRENCY_SYMBOL: Record<DisplayCurrency, string> = {
  USD: "US$",
  AUD: "A$",
};

/**
 * Convert a native-currency amount into the selected display currency using
 * the fixed planning FX rate. A no-op when the amount is already in the
 * target currency.
 */
export function convertToDisplayCurrency(
  amount: number,
  from: DisplayCurrency,
  to: DisplayCurrency,
): number {
  if (from === to) return amount;
  if (from === "USD" && to === "AUD") return amount * PLANNING_FX_RATE_USD_TO_AUD;
  if (from === "AUD" && to === "USD") return amount / PLANNING_FX_RATE_USD_TO_AUD;
  return amount;
}

/**
 * Format an amount, already in the given display currency, for display.
 *
 * Deliberately does NOT use `Intl.NumberFormat`'s `style: "currency"` symbol
 * — depending on locale/ICU data it renders AUD as a plain "$", visually
 * indistinguishable from USD wherever North America and Australia figures
 * appear side by side (the Projects table, mixed-market matrix, etc). We
 * always prepend our own explicit "US$"/"A$" prefix (CURRENCY_SYMBOL) and
 * use Intl only for the number's digit grouping.
 */
export function formatCurrency(
  amount: number,
  currency: DisplayCurrency,
  opts: { showSign?: boolean } = {},
): string {
  const number = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.abs(Math.round(amount)));
  const formatted = `${CURRENCY_SYMBOL[currency]}${number}`;

  if (opts.showSign) {
    // Round before checking sign — otherwise a value that's mathematically
    // zero but landed a hair below it from floating-point error (e.g. an
    // unchanged retention calc computing 1-(1-x) instead of x exactly)
    // displays as a confusing "-$0" instead of "+$0".
    return Math.round(amount) < 0 ? `-${formatted}` : `+${formatted}`;
  }
  return formatted;
}
