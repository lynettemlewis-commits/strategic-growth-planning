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

const INTL_LOCALE: Record<DisplayCurrency, string> = {
  USD: "en-US",
  AUD: "en-AU",
};

const INTL_CODE: Record<DisplayCurrency, string> = {
  USD: "USD",
  AUD: "AUD",
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

/** Format an amount, already in the given display currency, for display. */
export function formatCurrency(
  amount: number,
  currency: DisplayCurrency,
  opts: { showSign?: boolean } = {},
): string {
  const formatted = new Intl.NumberFormat(INTL_LOCALE[currency], {
    style: "currency",
    currency: INTL_CODE[currency],
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  if (opts.showSign) {
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
}
