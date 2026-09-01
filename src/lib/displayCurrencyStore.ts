import { DISPLAY_CURRENCIES, type DisplayCurrency } from "./currency";

/**
 * The portfolio-level "view in US$ / A$" control. This affects ONLY how
 * cross-market financial values are presented and aggregated in Portfolio
 * Forecast and Effort/Impact — it never touches a project's own native
 * currency or underlying inputs (see currency.ts).
 *
 * Persisted to sessionStorage purely as a per-tab UI convenience (so it
 * survives navigating between pages); it carries no project data.
 */

const STORAGE_KEY = "growth_planning_engine.display_currency.v1";
const DEFAULT_CURRENCY: DisplayCurrency = "USD";

type Listener = () => void;
const listeners = new Set<Listener>();

function isValidCurrency(value: string | null): value is DisplayCurrency {
  return !!value && (DISPLAY_CURRENCIES as readonly string[]).includes(value);
}

function read(): DisplayCurrency {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return isValidCurrency(stored) ? stored : DEFAULT_CURRENCY;
}

export function getDisplayCurrency(): DisplayCurrency {
  return read();
}

export function setDisplayCurrency(currency: DisplayCurrency): void {
  sessionStorage.setItem(STORAGE_KEY, currency);
  listeners.forEach((l) => l());
}

export function subscribeDisplayCurrency(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
