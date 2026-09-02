import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Save, AlertCircle } from "lucide-react";
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
  isEditing?: boolean;
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
  isEditing = false,
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
    // New phase starts out on the same month as the last existing phase
    // (rather than a computed later month) — a visible, obviously-a-default
    // starting point the visitor is expected to move, not a guess at intent.
    const previousMonth = iterations[iterations.length - 1]?.launchMonth ?? launchMonth;
    onChange({
      iterations: [
        ...rebalanced,
        {
          name: `Phase ${count}`,
          launchMonth: previousMonth,
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

  const percentagesValid = launchType !== "iterative" || percentageTotal === 100;

  // Final phase's month — the comparison scenario for "what if this had
  // waited for one complete launch instead of rolling out in phases?"
  const finalPhaseMonth = useMemo(
    () => Math.max(...iterations.map((it) => it.launchMonth), 1),
    [iterations],
  );
  const singleOnFinalPhaseSeries = useMemo(
    () => monthlyContributionSeries(value, "single", finalPhaseMonth, []),
    [value, finalPhaseMonth],
  );
  const singleOnFinalPhaseTotal = useMemo(
    () => totalPlanningPeriodValue(singleOnFinalPhaseSeries),
    [singleOnFinalPhaseSeries],
  );
  const additionalValueFromIteration = iterativeTotal - singleOnFinalPhaseTotal;

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
            onClick={() => {
              // Carry the single-launch month forward onto the final phase —
              // switching to phases shouldn't silently change when the
              // project is fully live by, only how it gets there.
              const lastIndex = iterations.length - 1;
              const carried =
                lastIndex >= 0 && iterations[lastIndex].launchMonth !== launchMonth
                  ? iterations.map((it, i) => (i === lastIndex ? { ...it, launchMonth } : it))
                  : iterations;
              onChange({ launchType: "iterative", iterations: carried });
            }}
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
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
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

          <IterativeVsSingleComparison
            iterativeSeries={iterativeSeries}
            singleOnFinalPhaseSeries={singleOnFinalPhaseSeries}
            iterativeTotal={iterativeTotal}
            singleOnFinalPhaseTotal={singleOnFinalPhaseTotal}
            additionalValue={additionalValueFromIteration}
            finalPhaseMonth={finalPhaseMonth}
            currency={currency}
          />
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Planning-Period Total</h3>
        <div className="text-3xl font-bold text-green-600" data-testid="text-total-value">
          {formatCurrency(launchType === "single" ? singleTotal : iterativeTotal, currency)}
        </div>
        <div className="text-sm text-gray-600">Total impact across the 12-month planning period</div>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2" data-testid="button-back-step4">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {!percentagesValid && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Phase percentages must add up to 100% ({percentageTotal}% currently)
            </span>
          )}
          <Button
            onClick={onComplete}
            disabled={!percentagesValid}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            data-testid="button-complete-project"
          >
            {isEditing ? "Save Changes" : "Complete Project"}
            {isEditing ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IterativeVsSingleComparison({
  iterativeSeries,
  singleOnFinalPhaseSeries,
  iterativeTotal,
  singleOnFinalPhaseTotal,
  additionalValue,
  finalPhaseMonth,
  currency,
}: {
  iterativeSeries: number[];
  singleOnFinalPhaseSeries: number[];
  iterativeTotal: number;
  singleOnFinalPhaseTotal: number;
  additionalValue: number;
  finalPhaseMonth: number;
  currency: DisplayCurrency;
}) {
  const incremental = iterativeSeries.map((v, i) => v - singleOnFinalPhaseSeries[i]);

  return (
    <div className="mt-6">
      <h4 className="font-semibold text-gray-900 mb-1">Iterative vs. Single Launch</h4>
      <p className="text-xs text-gray-500 mb-3">
        What iterative delivery is worth, compared with waiting and launching everything at once in{" "}
        {monthName(finalPhaseMonth)} — the date of the final phase.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-blue-100">
              <th className="text-left p-2 font-medium text-blue-900">Month</th>
              {iterativeSeries.map((_, i) => (
                <th key={i} className="text-left p-2 font-medium text-blue-900">
                  {monthName(i + 1).slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-blue-50">
              <td className="p-2 font-medium text-blue-900">Iterative Launch</td>
              {iterativeSeries.map((v, i) => (
                <td key={i} className="p-2 text-center text-blue-900">
                  {formatCurrency(v, currency)}
              </td>
            ))}
            </tr>
            <tr>
              <td className="p-2 font-medium text-gray-700">Single Launch</td>
              {singleOnFinalPhaseSeries.map((v, i) => (
                <td key={i} className="p-2 text-center text-gray-700">
                  {formatCurrency(v, currency)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-blue-200">
              <td className="p-2 font-medium text-green-700">Incremental Value of Iteration</td>
              {incremental.map((v, i) => (
                <td key={i} className="p-2 text-center text-green-700">
                  {v === 0 ? "—" : formatCurrency(v, currency, { showSign: true })}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-700 uppercase tracking-wide">FY value — Iterative Launch</div>
          <div className="text-lg font-bold text-blue-900">{formatCurrency(iterativeTotal, currency)}</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 uppercase tracking-wide">FY value — Single Launch</div>
          <div className="text-lg font-bold text-gray-800">{formatCurrency(singleOnFinalPhaseTotal, currency)}</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs text-green-700 uppercase tracking-wide">Additional FY value from iteration</div>
          <div className="text-lg font-bold text-green-800">{formatCurrency(additionalValue, currency, { showSign: true })}</div>
        </div>
      </div>
    </div>
  );
}
