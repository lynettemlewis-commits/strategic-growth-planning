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
import { convertToDisplayCurrency, formatCurrency, MARKET_CURRENCY, type DisplayCurrency } from "@/lib/currency";
import type { Project } from "@/lib/types";

/**
 * Portfolio Forecast — the clean rebuild of the historical "Waterfall"
 * concept. Combines the seeded sample portfolio and the visitor's own
 * projects into one 12-month, market-aware view of how the plan's
 * financial impact builds over the July–June planning period.
 *
 * Deliberately NOT restored: GAB terminology, a hardcoded historical
 * target line, or per-owner filtering — none of those survive translation
 * to a public, no-account demo (see the accompanying implementation
 * report for why). A target/goal overlay is flagged there as a possible
 * future enhancement rather than invented here.
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

export default function PortfolioForecast() {
  const projects = useProjects();
  const [displayCurrency] = useDisplayCurrency();

  const sampleProjects = projects.filter((p) => p.isSample);
  const yourProjects = projects.filter((p) => !p.isSample);

  const chartData = useMemo(() => {
    const sampleSeries = sampleProjects.map((p) => seriesFor(p, displayCurrency));
    const yourSeries = yourProjects.map((p) => seriesFor(p, displayCurrency));

    let cumulative = 0;
    return PLANNING_MONTHS.map((month, i) => {
      const sampleValue = sampleSeries.reduce((sum, s) => sum + s[i], 0);
      const yourValue = yourSeries.reduce((sum, s) => sum + s[i], 0);
      const monthTotal = sampleValue + yourValue;
      cumulative += monthTotal;
      return {
        month: month.name,
        quarter: month.quarter,
        "Sample Projects": Math.round(sampleValue),
        "Your Projects": Math.round(yourValue),
        "Cumulative Impact": Math.round(cumulative),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, displayCurrency]);

  const totalPlanningPeriodImpact = chartData[chartData.length - 1]?.["Cumulative Impact"] ?? 0;
  const yourTotal = chartData.reduce((sum, m) => sum + m["Your Projects"], 0);
  const sampleTotal = chartData.reduce((sum, m) => sum + m["Sample Projects"], 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Forecast</h1>
          <p className="text-gray-600 max-w-2xl">
            How the sample portfolio and your own projects build financial impact across the 12-month
            planning period, starting from a zero baseline.
          </p>
        </div>
        <DisplayCurrencyControl />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total planning-period impact"
          value={formatCurrency(totalPlanningPeriodImpact, displayCurrency)}
          accent="text-green-600"
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
        <div className="flex text-xs text-gray-400 mb-2 pl-10">
          {QUARTERS.map((q) => (
            <div key={q.quarter} className="flex-1 text-center">
              Q{q.quarter} &middot; {q.months.map((m) => m.name).join("/")}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatCurrency(v, displayCurrency).replace(/\.00$/, "")}
              width={80}
            />
            <Tooltip formatter={(value: number) => formatCurrency(value, displayCurrency)} />
            <Legend />
            <Bar dataKey="Sample Projects" stackId="impact" fill="#9ca3af" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Your Projects" stackId="impact" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="Cumulative Impact" stroke="#16a34a" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-3">
          Bars: monthly run-rate impact active that month (stacked, sample vs. yours). Line: cumulative
          impact generated to date across the planning period.
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
