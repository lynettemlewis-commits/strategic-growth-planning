import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useProjects } from "@/hooks/use-projects";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { DisplayCurrencyControl } from "@/components/DisplayCurrencyControl";
import { PLANNING_MONTHS, QUARTERS } from "@/lib/calendar";
import { monthlyContributionSeries } from "@/lib/launchTiming";
import { existingBusinessMonthlyRevenue } from "@/lib/growthModel";
import { MARKET_BASELINES } from "@/lib/marketBaselines";
import { convertToDisplayCurrency, formatCurrency, MARKET_CURRENCY, type DisplayCurrency } from "@/lib/currency";
import type { Market, Project } from "@/lib/types";

/**
 * Portfolio Forecast — the clean rebuild of the historical "Waterfall"
 * concept. Combines the seeded sample portfolio and the visitor's own
 * projects into one 12-month, market-aware view of how the plan's
 * financial impact builds over the July–June planning period, on top of
 * an "Existing Business" baseline.
 *
 * Existing Business = each market's monthly net-new booking revenue with
 * zero project adjustments (`existingBusinessMonthlyRevenue`, in
 * growthModel.ts) — i.e. exactly the baseline every project's own
 * incremental impact is already computed against, not a separately
 * invented number. It's a flat monthly floor (the fictional baselines
 * carry no organic-growth/seasonality assumption, so holding it constant
 * is the only supportable choice, not a simplification of something more
 * sophisticated). North America and Australia are each computed in their
 * own native currency, then converted into the selected display currency
 * with the same fixed planning FX rate used everywhere else, and summed.
 *
 * Deliberately NOT restored: GAB terminology, a hardcoded historical
 * target line, or per-owner filtering. A target/goal overlay is flagged
 * in the implementation report as a possible future enhancement rather
 * than invented here.
 */

function seriesFor(project: Project, displayCurrency: DisplayCurrency): number[] {
  const nativeSeries = monthlyContributionSeries(
    Math.abs(project.monthlyValue),
    project.launchType,
    project.launchMonth,
    project.iterations,
  );
  const from = MARKET_CURRENCY[project.market];
  return nativeSeries.map((v) => convertToDisplayCurrency(v, from, displayCurrency));
}

function totalExistingBusiness(displayCurrency: DisplayCurrency): number {
  return (Object.keys(MARKET_BASELINES) as Market[]).reduce((sum, market) => {
    const native = existingBusinessMonthlyRevenue(MARKET_BASELINES[market]);
    return sum + convertToDisplayCurrency(native, MARKET_CURRENCY[market], displayCurrency);
  }, 0);
}

export default function PortfolioForecast() {
  const projects = useProjects();
  const [displayCurrency] = useDisplayCurrency();

  const sampleProjects = projects.filter((p) => p.isSample);
  const yourProjects = projects.filter((p) => !p.isSample);

  const existingBusiness = useMemo(() => totalExistingBusiness(displayCurrency), [displayCurrency]);

  const chartData = useMemo(() => {
    const sampleSeries = sampleProjects.map((p) => seriesFor(p, displayCurrency));
    const yourSeries = yourProjects.map((p) => seriesFor(p, displayCurrency));

    let cumulativeIncremental = 0;
    return PLANNING_MONTHS.map((month, i) => {
      const sampleValue = sampleSeries.reduce((sum, s) => sum + s[i], 0);
      const yourValue = yourSeries.reduce((sum, s) => sum + s[i], 0);
      cumulativeIncremental += sampleValue + yourValue;
      return {
        month: month.name,
        quarter: month.quarter,
        "Existing Business": Math.round(existingBusiness),
        "Sample Projects": Math.round(sampleValue),
        "Your Projects": Math.round(yourValue),
        "Projected Business": Math.round(existingBusiness + sampleValue + yourValue),
        "Cumulative Incremental Impact": Math.round(cumulativeIncremental),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, displayCurrency, existingBusiness]);

  const totalIncrementalImpact =
    chartData[chartData.length - 1]?.["Cumulative Incremental Impact"] ?? 0;
  const yourTotal = chartData.reduce((sum, m) => sum + m["Your Projects"], 0);
  const sampleTotal = chartData.reduce((sum, m) => sum + m["Sample Projects"], 0);
  const finalMonthProjectedBusiness = chartData[chartData.length - 1]?.["Projected Business"] ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Forecast</h1>
          <p className="text-gray-600 max-w-2xl">
            Existing Business (each market's current net-new booking revenue, unchanged) plus the
            sample portfolio and your own projects, across the 12-month planning period.
          </p>
        </div>
        <DisplayCurrencyControl />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Existing Business (monthly)"
          value={formatCurrency(existingBusiness, displayCurrency)}
          accent="text-gray-700"
          hint="North America + Australia, zero project adjustments"
        />
        <SummaryCard
          label="Projected Business (fully ramped)"
          value={formatCurrency(finalMonthProjectedBusiness, displayCurrency)}
          accent="text-indigo-600"
          hint="Existing Business + all active project impact, final month"
        />
        <SummaryCard
          label="From sample projects"
          value={formatCurrency(sampleTotal, displayCurrency)}
          accent="text-gray-600"
        />
        <SummaryCard
          label="From your projects"
          value={formatCurrency(yourTotal, displayCurrency)}
          accent="text-blue-600"
          hint={yourProjects.length === 0 ? "Create a project to see it added here" : undefined}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {/* Supplementary quarter labels — hidden below `sm` where there isn't
            room for 4 columns of text without overlapping; the chart's own
            month axis still conveys the timeline at every width. */}
        <div className="hidden sm:flex text-xs text-gray-400 mb-2 pl-10">
          {QUARTERS.map((q) => (
            <div key={q.quarter} className="flex-1 text-center truncate px-1">
              Q{q.quarter} &middot; {q.months.map((m) => m.name).join("/")}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatCurrency(v, displayCurrency)}
              width={90}
            />
            <Tooltip formatter={(value: number) => formatCurrency(value, displayCurrency)} />
            <Legend />
            <Bar dataKey="Existing Business" stackId="business" fill="#d1d5db" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Sample Projects" stackId="business" fill="#9ca3af" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Your Projects" stackId="business" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="Cumulative Incremental Impact"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-3">
          Bars: Existing Business (flat) + that month's active project impact, stacked — the bar height
          is Projected Business for that month. Line: cumulative incremental project impact generated
          to date (Existing Business is a recurring monthly floor, not summed cumulatively, so it's kept
          out of this line to avoid mixing a flow with an accumulated total).
        </p>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}
