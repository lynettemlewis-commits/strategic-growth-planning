import { useSyncExternalStore } from "react";
import {
  getDisplayCurrency,
  setDisplayCurrency,
  subscribeDisplayCurrency,
} from "@/lib/displayCurrencyStore";
import type { DisplayCurrency } from "@/lib/currency";

export function useDisplayCurrency(): [DisplayCurrency, (c: DisplayCurrency) => void] {
  const currency = useSyncExternalStore(
    subscribeDisplayCurrency,
    getDisplayCurrency,
    getDisplayCurrency,
  );
  return [currency, setDisplayCurrency];
}
