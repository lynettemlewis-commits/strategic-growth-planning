import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { MONTH_OPTIONS, monthName } from "@/lib/calendar";
import {
  iterationPercentageTotal,
  monthlyContributionSeries,
  singleLaunchTotal,
  totalPlanningPeriodValue,
} from "@/lib/launchTiming";
import { formatCurrency, MARKET_CURRENCY, type DisplayCurrency } from "@/lib/currency";
import type { Iteration, LaunchType, Market } from "@/lib/types";

interface LaunchStrategyStepProps {
  market: Market;
  monthlyValue: number; // native currency, from Business Impact step
  launchType: LaunchType;
  launchMonth: number;
  iterations: Iteration[];
  onChange: (updates: Partial<{ launchType: LaunchType; launchMonth: number; iterations: Iteration[] }>) => void;
  onBack: () => void;
  onComplete: () => void;
}

export function LaunchStrategyStep({
  market,
  monthlyValue,
  launchType,
  launchMonth,
  iterations,
  onChange,
  onBack,
  onComplete,
}: LaunchStrategyStepProps) {
  const currency = MARKET_CURRENCY[market];
  const value = Math.abs(monthlyValue);

  const singleTotal = useMemo(() => singleLaunchTotal(value, launchMonth), [value, launchMonth]);
  const iterativeSeries = useMemo(
    () => monthlyContributionSeries(value, "iterative", launchMonth, iterations),
    [value, launchMonth, iterations],
  );
  const iterativeTotal = useMemo(() => totalPlanningPeriodValue(iterativeSeries), [iterativeSeries]);
  const percentageTotal = iterationPercentageTotal(iterations);

  const handleAddIteration = () => {
    const count = iterations.length + 1;
    const even = Math.floor(100 / count);
    const remainder = 100 % count;
    const rebalanced = iterations.map((it, i) => ({
      ...it,
      valuePercentage: even + (i < remainder ? 1 : 0),
    }));
    onChange({
      iterations: [
        ...rebalanced,
        {
          name: `Phase ${count}`,
          launchMonth: Math.min(12, launchMonth + count - 1),
          valuePercentage: even + (iterations.length < remainder ? 1 : 0),
        },
      ],
    });
  };

  const handleRemoveIteration = (index: number) => {
    if (iterations.length <= 1) return;
    onChange({ iterations: iterations.filter((_, i) => i !== index) });
  };

  const handleIterationField = (index: number, updates: Partial<Iteration>) => {
    onChange({ iterations: iterations.map((it, i) => (i === index ? { ...it, ...updates } : it)) });
  };

  const handleComplete = () => {
    if (launchType === "iterative" && percentageTotal !== 100) {
      window.alert("Phase percentages must add up to 100% before completing this project.");
      return;
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-indigo-500 pl-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Launch Strategy</h2>
        <p className="text-gray-600">Launch everything at once, or roll it out in phases.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => onChange({ launchType: "single" })}
            className={`text-left p-4 border-2 rounded-lg transition-all ${
              launchType === "single" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-400"
            }`}
            data-testid="button-single-launch"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Single Launch</h4>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(singleTotal, currency)}</div>
            <div className="text-sm text-gray-600">Launch everything at once in {monthName(launchMonth)}</div>
          </button>

          <button
            onClick={() => onChange({ launchType: "iterative" })}
            className={`text-left p-4 border-2 rounded-lg transition-all ${
              launchType === "iterative" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-400"
            }`}
            data-testid="button-iterative-launch"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{iterations.length} Phase(s)</h4>
            <div className="text-2xl font-bold text-blue-600 mb-1">{formatCurrency(iterativeTotal, currency)}</div>
            <div className="text-sm text-gray-600">Gradual rollout starting {monthName(iterations[0]?.launchMonth ?? launchMonth)}</div>
          </button>
        </div>

        {launchType === "single" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Launch Month</label>
            <Select value={String(launchMonth)} onValueChange={(v) => onChange({ launchMonth: Number(v) })}>
              <SelectTrigger className="w-64" data-testid="select-launch-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {launchType === "iterative" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Phases</h3>
            <Button onClick={handleAddIteration} variant="outline" size="sm" data-testid="button-add-phase">
              <Plus className="w-4 h-4 mr-1" />
              Add Phase
            </Button>
          </div>

          <div className="space-y-4">
            {iterations.map((iteration, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phase Name</label>
                  <Input
                    value={iteration.name}
                    onChange={(e) => handleIterationField(index, { name: e.target.value })}
                    data-testid={`input-phase-name-${index}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Launch Month</label>
                  <Select
                    value={String(iteration.launchMonth)}
                    onValueChange={(v) => handleIterationField(index, { launchMonth: Number(v) })}
                  >
                    <SelectTrigger data-testid={`select-phase-month-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Value % ({iteration.valuePercentage}%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={iteration.valuePercentage}
                    onChange={(e) =>
                      handleIterationField(index, {
                        valuePercentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                    data-testid={`input-phase-percentage-${index}`}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency((value * iteration.valuePercentage) / 100, currency)}/mo once active
                  </div>
                </div>
                <div>
                  {iterations.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleRemoveIteration(index)}
                      data-testid={`button-remove-phase-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-4 text-sm font-medium ${percentageTotal === 100 ? "text-green-600" : "text-amber-600"}`}>
            Total allocated: {percentageTotal}%{percentageTotal !== 100 && " — phases must add up to 100%"}
          </div>

          <MonthlyBreakdownTable iterations={iterations} monthlyValue={value} currency={currency} />
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Planning-Period Total</h3>
        <div className="text-3xl font-bold text-green-600" data-testid="text-total-value">
          {formatCurrency(launchType === "single" ? singleTotal : iterativeTotal, currency)}
        </div>
        <div className="text-sm text-gray-600">Total impact across the 12-month planning period</div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2" data-testid="button-back-step4">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={handleComplete} className="flex items-center gap-2 bg-green-600 hover:bg-green-700" data-testid="button-complete-project">
          Complete Project
          <CheckCircle2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function MonthlyBreakdownTable({
  iterations,
  monthlyValue,
  currency,
}: {
  iterations: Iteration[];
  monthlyValue: number;
  currency: DisplayCurrency;
}) {
  const series = monthlyContributionSeries(monthlyValue, "iterative", 1, iterations);
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-blue-100">
            <th className="text-left p-2 font-medium text-blue-900">Month</th>
            {series.map((_, i) => (
              <th key={i} className="text-left p-2 font-medium text-blue-900">
                {monthName(i + 1).slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-blue-50 font-semibold">
            <td className="p-2 text-blue-900">Active value</td>
            {series.map((v, i) => (
              <td key={i} className="p-2 text-center text-blue-900">
                {formatCurrency(v, currency)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
