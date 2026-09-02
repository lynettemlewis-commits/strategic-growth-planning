import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useProjects } from "@/hooks/use-projects";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { DisplayCurrencyControl } from "@/components/DisplayCurrencyControl";
import { PLANNING_MONTHS } from "@/lib/calendar";
import { monthlyContributionSeries } from "@/lib/launchTiming";
import { baselineForecastNative, baselineRunRateAtMonth, startingRunRateNative } from "@/lib/baselineForecast";
import { convertToDisplayCurrency, formatCurrency, MARKET_CURRENCY, type DisplayCurrency } from "@/lib/currency";
import { REGION_OPTIONS, marketsForRegion, projectMatchesRegion, type Region } from "@/lib/region";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Market, Project } from "@/lib/types";

/**
 * Portfolio Forecast — answers: what's the expected business trajectory,
 * and how much incremental value do the planned projects add?
 *
 * Information hierarchy: headline metrics -> Portfolio Impact (the
 * executive planning answer: where growth comes from, and when it enters)
 * -> Business Impact (the operating detail: what that does to the overall
 * trajectory over time).
 *
 * A single page-level region selector (All / North America / Australia)
 * controls every section — there are no separate, disconnected region
 * controls per chart.
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

function combinedNative(markets: Market[], nativeFor: (m: Market) => number, displayCurrency: DisplayCurrency): number {
  return markets.reduce((sum, m) => sum + convertToDisplayCurrency(nativeFor(m), MARKET_CURRENCY[m], displayCurrency), 0);
}

export default function PortfolioForecast() {
  const allProjects = useProjects();
  const [displayCurrency] = useDisplayCurrency();
  const [region, setRegion] = useState<Region>("all");
  const [impactView, setImpactView] = useState<"project" | "month">("project");

  const markets = marketsForRegion(region);
  const projects = allProjects.filter((p) => projectMatchesRegion(p, region));

  // --- Headline metrics (region-aware) -----------------------------------
  const startingRunRate = useMemo(
    () => combinedNative(markets, startingRunRateNative, displayCurrency),
    [markets, displayCurrency],
  );
  const baselineForecast = useMemo(
    () => combinedNative(markets, baselineForecastNative, displayCurrency),
    [markets, displayCurrency],
  );
  const baselineGrowthPct = startingRunRate > 0 ? (baselineForecast / startingRunRate - 1) * 100 : 0;

  const projectSeries = useMemo(() => projects.map((p) => ({ project: p, series: seriesFor(p, displayCurrency) })), [
    projects,
    displayCurrency,
  ]);
  const portfolioImpact = useMemo(
    () => projectSeries.reduce((sum, { series }) => sum + series.reduce((a, b) => a + b, 0), 0),
    [projectSeries],
  );
  const resultingForecast = baselineForecast + portfolioImpact;
  const resultingGrowthPct = startingRunRate > 0 ? (resultingForecast / startingRunRate - 1) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Forecast</h1>
          <p className="text-gray-600 max-w-2xl">
            Where the business is headed without these projects, what they add, and where that lands
            the business over the year.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Region</span>
            <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
              <SelectTrigger className="w-44" data-testid="select-region-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DisplayCurrencyControl />
        </div>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Starting Run Rate"
          value={formatCurrency(startingRunRate, displayCurrency)}
          accent="text-gray-900"
          hint="Current annualized revenue"
        />
        <SummaryCard
          label="Baseline Forecast"
          value={formatCurrency(baselineForecast, displayCurrency)}
          accent="text-gray-700"
          hint={`${baselineGrowthPct >= 0 ? "+" : ""}${baselineGrowthPct.toFixed(1)}% vs. starting, zero projects`}
        />
        <SummaryCard
          label="Portfolio Impact"
          value={formatCurrency(portfolioImpact, displayCurrency)}
          accent="text-blue-600"
          hint="Realized FY impact from launch timing"
        />
        <SummaryCard
          label="Resulting Forecast"
          value={formatCurrency(resultingForecast, displayCurrency)}
          accent="text-indigo-600"
          hint={`${resultingGrowthPct >= 0 ? "+" : ""}${resultingGrowthPct.toFixed(1)}% vs. starting, with portfolio`}
        />
      </div>

      {/* Portfolio Impact — the executive planning answer */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Portfolio Impact</h2>
            <p className="text-sm text-gray-500">
              {impactView === "project"
                ? "Which initiatives are creating the incremental growth?"
                : "When does the planned growth actually enter the business?"}
            </p>
          </div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setImpactView("project")}
              className={`px-3 py-1.5 font-medium ${impactView === "project" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              data-testid="button-view-by-project"
            >
              By Project
            </button>
            <button
              onClick={() => setImpactView("month")}
              className={`px-3 py-1.5 font-medium border-l border-gray-200 ${impactView === "month" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              data-testid="button-view-by-month"
            >
              By Month
            </button>
          </div>
        </div>

        {impactView === "project" ? (
          <ByProjectWaterfall
            projectSeries={projectSeries}
            portfolioImpact={portfolioImpact}
            displayCurrency={displayCurrency}
          />
        ) : (
          <ByMonthWaterfall projectSeries={projectSeries} displayCurrency={displayCurrency} />
        )}
      </div>

      {/* Business Impact — the underlying trajectory */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Business Impact</h2>
        <p className="text-sm text-gray-500 mb-4">
          What the underlying business trajectory looks like over the year, with and without these
          projects
        </p>
        <BusinessImpactChart markets={markets} projectSeries={projectSeries} displayCurrency={displayCurrency} />
      </div>
    </div>
  );
}

// --- By Project waterfall --------------------------------------------------

function ByProjectWaterfall({
  projectSeries,
  portfolioImpact,
  displayCurrency,
}: {
  projectSeries: { project: Project; series: number[] }[];
  portfolioImpact: number;
  displayCurrency: DisplayCurrency;
}) {
  const sorted = [...projectSeries].sort(
    (a, b) => b.series.reduce((x, y) => x + y, 0) - a.series.reduce((x, y) => x + y, 0),
  );

  // Pure waterfall of the portfolio's own contribution — starts at zero
  // (not the company baseline) and ends on the Portfolio Impact total, so
  // this chart answers one question only: which projects built that total,
  // not how it compares to the underlying business trajectory (that's
  // Business Impact, below).
  const rows: { name: string; base: number; delta: number; kind: "project" | "total" }[] = [];
  let running = 0;
  for (const { project, series } of sorted) {
    const total = series.reduce((a, b) => a + b, 0);
    rows.push({ name: project.name, base: running, delta: total, kind: "project" });
    running += total;
  }
  rows.push({ name: "Portfolio Impact", base: 0, delta: portfolioImpact, kind: "total" });

  const data = rows.map((r) => ({ name: r.name, base: r.base, delta: r.delta, kind: r.kind }));

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">No projects in this region yet.</p>;
  }

  // Horizontally scrollable with a per-category minimum width — with up to
  // 9 categories (baseline + projects + resulting), rotated labels collide
  // illegibly if forced into a narrow (e.g. mobile) viewport instead.
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(560, data.length * 90) }}>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} height={70} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, displayCurrency)} width={90} />
            <Tooltip content={<WaterfallTooltip displayCurrency={displayCurrency} />} />
            <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="delta" stackId="waterfall" isAnimationActive={false} radius={[3, 3, 0, 0]}>
              {data.map((row, i) => (
                <Cell key={i} fill={row.kind === "total" ? "#4f46e5" : "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Shows only the visible "delta" bar (the invisible "base" spacer stays out of the tooltip entirely). */
function WaterfallTooltip({
  active,
  payload,
  label,
  displayCurrency,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
  displayCurrency: DisplayCurrency;
}) {
  if (!active || !payload) return null;
  const delta = payload.find((p) => p.dataKey === "delta");
  if (!delta) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <div className="font-medium text-gray-900">{label}</div>
      <div className="text-gray-600">{formatCurrency(delta.value, displayCurrency)}</div>
    </div>
  );
}

// --- By Month waterfall -----------------------------------------------------

function ByMonthWaterfall({
  projectSeries,
  displayCurrency,
}: {
  projectSeries: { project: Project; series: number[] }[];
  displayCurrency: DisplayCurrency;
}) {
  const data = useMemo(() => {
    const activeByMonth = PLANNING_MONTHS.map((_, i) => projectSeries.reduce((sum, { series }) => sum + series[i], 0));
    let previous = 0;
    return PLANNING_MONTHS.map((month, i) => {
      const active = activeByMonth[i];
      const newThisMonth = Math.max(0, active - previous);
      const carriedForward = active - newThisMonth;
      previous = active;
      return {
        month: month.name,
        "Carried Forward": Math.round(carriedForward),
        "New This Month": Math.round(newThisMonth),
      };
    });
  }, [projectSeries]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, displayCurrency)} width={90} />
        <Tooltip formatter={(value: number, name: string) => [formatCurrency(value, displayCurrency), name]} />
        <Legend />
        <Bar dataKey="Carried Forward" stackId="month" fill="#d1d5db" isAnimationActive={false} />
        <Bar dataKey="New This Month" stackId="month" fill="#3b82f6" isAnimationActive={false} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Business Impact trajectory ---------------------------------------------

function BusinessImpactChart({
  markets,
  projectSeries,
  displayCurrency,
}: {
  markets: Market[];
  projectSeries: { project: Project; series: number[] }[];
  displayCurrency: DisplayCurrency;
}) {
  const data = useMemo(() => {
    let cumulativeImpact = 0;
    return PLANNING_MONTHS.map((month, i) => {
      const baselineThisMonth = combinedNative(markets, (m) => baselineRunRateAtMonth(m, month.index), displayCurrency);
      cumulativeImpact += projectSeries.reduce((sum, { series }) => sum + series[i], 0);
      return {
        month: month.name,
        "Baseline Forecast": Math.round(baselineThisMonth),
        "Resulting Forecast": Math.round(baselineThisMonth + cumulativeImpact),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets, projectSeries, displayCurrency]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, displayCurrency)} width={90} domain={["auto", "auto"]} />
        <Tooltip formatter={(value: number, name: string) => [formatCurrency(value, displayCurrency), name]} />
        <Legend />
        <Line type="monotone" dataKey="Baseline Forecast" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="Resulting Forecast" stroke="#4f46e5" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
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
    <div className="bg-white p-5 rounded-xl border border-gray-200 min-w-0">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      <div className={`text-lg sm:text-2xl font-bold break-words ${accent}`}>{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}
