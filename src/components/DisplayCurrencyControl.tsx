import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCY_SYMBOL, DISPLAY_CURRENCIES } from "@/lib/currency";

/**
 * Portfolio-level "view in US$ / A$" control. Changes how cross-market
 * financial values are presented and aggregated on this page only — it
 * never alters a project's native-market inputs or economics.
 */
export function DisplayCurrencyControl() {
  const [currency, setCurrency] = useDisplayCurrency();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 whitespace-nowrap">Display currency</span>
      <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
        <SelectTrigger className="w-28" data-testid="select-display-currency">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DISPLAY_CURRENCIES.map((c) => (
            <SelectItem key={c} value={c}>
              {CURRENCY_SYMBOL[c]} {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
