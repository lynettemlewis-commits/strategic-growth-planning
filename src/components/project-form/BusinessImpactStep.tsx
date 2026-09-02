import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { InputWithControls } from "@/components/ui/input-with-controls";
import { ArrowLeft, ArrowRight, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { calculateGrowthImpact, estimatedIncrementalBookings } from "@/lib/growthModel";
import { MARKET_BASELINES } from "@/lib/marketBaselines";
import { FUNNEL_STAGE_RECOMMENDED_METRIC } from "@/lib/funnelStages";
import { MARKET_CURRENCY, formatCurrency } from "@/lib/currency";
import type { FunnelStage, Market, MetricAdjustments } from "@/lib/types";

interface BusinessImpactStepProps {
  market: Market;
  funnel: FunnelStage;
  adjustments: MetricAdjustments;
  onChange: (adjustments: MetricAdjustments) => void;
  onBack: () => void;
  onNext: () => void;
}

const METRIC_FIELDS: {
  key: keyof MetricAdjustments;
  label: string;
  step: number;
  placeholder: string;
  currentLabel: (baseline: ReturnType<typeof getBaseline>, adjustments: MetricAdjustments) => string;
}[] = [
  {
    key: "trafficChange",
    label: "Website Traffic (visitors per month)",
    step: 10,
    placeholder: "e.g., 5,000 additional visitors/month",
    currentLabel: (b, a) =>
      `Current: ${b.avgVisitors.toLocaleString()}/mo → Projected: ${(b.avgVisitors + a.trafficChange).toLocaleString()}/mo`,
  },
  {
    key: "conversionRateChange",
    label: "Website Conversion Rate (percentage points)",
    step: 0.01,
    placeholder: "e.g., 0.2 (increase CVR by 0.2 points)",
    currentLabel: (b, a) =>
      `Current: ${b.avgCVRRate.toFixed(2)}% → Projected: ${(b.avgCVRRate + a.conversionRateChange).toFixed(2)}%`,
  },
  {
    key: "acceptanceRateChange",
    label: "Host Acceptance / Confirmation Rate (percentage points)",
    step: 0.1,
    placeholder: "e.g., 5 (increase acceptance by 5 points)",
    currentLabel: (b, a) =>
      `Current: ${b.avgAcceptanceRate}% → Projected: ${Math.min(100, Math.max(0, b.avgAcceptanceRate + a.acceptanceRateChange)).toFixed(1)}%`,
  },
  {
    key: "retentionRateChange",
    label: "Retention Rate (percentage points)",
    step: 0.01,
    placeholder: "e.g., 1.5 (increase retention by 1.5 points)",
    currentLabel: (b, a) => {
      const current = (1 - b.avgBookingsEndingPerMonth / b.activeBookings) * 100;
      return `Current: ${current.toFixed(2)}% → Projected: ${Math.min(100, Math.max(0, current + a.retentionRateChange)).toFixed(2)}%`;
    },
  },
  {
    key: "repeatBookingsChange",
    label: "Repeat Booking Requests (per month)",
    step: 1,
    placeholder: "e.g., 50 additional repeat requests/month",
    currentLabel: () => "Additional booking requests from repeat customers",
  },
];

function getBaseline(market: Market) {
  return MARKET_BASELINES[market];
}

export function BusinessImpactStep({
  market,
  funnel,
  adjustments,
  onChange,
  onBack,
  onNext,
}: BusinessImpactStepProps) {
  const baseline = getBaseline(market);
  const currency = MARKET_CURRENCY[market];
  const recommendedMetric = FUNNEL_STAGE_RECOMMENDED_METRIC[funnel];

  const result = useMemo(() => calculateGrowthImpact(baseline, adjustments), [baseline, adjustments]);
  const bookings = estimatedIncrementalBookings(result.difference.revenue, baseline.avgBookingValue);
  const hasAnyAdjustment = Object.values(adjustments).some((v) => v !== 0);

  const handleFieldChange = (key: keyof MetricAdjustments, value: number) => {
    onChange({ ...adjustments, [key]: value });
  };

  const resetAll = () =>
    onChange({
      trafficChange: 0,
      conversionRateChange: 0,
      acceptanceRateChange: 0,
      retentionRateChange: 0,
      repeatBookingsChange: 0,
    });

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-green-500 pl-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Estimate Impact</h2>
        <p className="text-gray-600">
          Estimate how this project changes the underlying business inputs — and therefore the
          business outcome. The highlighted field is recommended based on the funnel stage you chose,
          but it's a starting point, not a restriction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Estimate Impact</h3>
          <div className="space-y-6">
            {METRIC_FIELDS.map((field) => (
              <div
                key={field.key}
                className={`p-4 rounded-lg transition-all ${
                  field.key === recommendedMetric ? "ring-2 ring-green-500 bg-green-50" : ""
                }`}
              >
                {field.key === recommendedMetric && (
                  <div className="text-xs font-medium text-green-700 mb-1">Recommended for this funnel stage</div>
                )}
                <InputWithControls
                  label={field.label}
                  placeholder={field.placeholder}
                  value={adjustments[field.key]}
                  step={field.step}
                  onChange={(value) => handleFieldChange(field.key, value)}
                  currentLabel={field.currentLabel(baseline, adjustments)}
                  testId={`input-${field.key}`}
                />
              </div>
            ))}
          </div>
          <button
            onClick={resetAll}
            className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
            data-testid="button-reset"
          >
            Reset All
          </button>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600 w-5 h-5" />
            Impact Analysis
          </h3>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-2">Monthly Confirmed Bookings</h4>
            <Row label="Current" value={result.current.confirmedBookings} />
            <Row label="Projected" value={result.projected.confirmedBookings} />
            <Row
              label="Difference"
              value={result.difference.confirmedBookings}
              signed
              className="text-green-600 font-medium"
            />
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Monthly Revenue Impact
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current:</span>
              <span className="font-bold">{formatCurrency(result.current.monthlyRevenue, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Projected:</span>
              <span className="font-bold">{formatCurrency(result.projected.monthlyRevenue, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-green-600 font-medium">
              <span>Monthly Impact:</span>
              <span data-testid="text-monthly-impact">
                {formatCurrency(result.difference.revenue, currency, { showSign: true })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
              <span>≈ estimated incremental bookings</span>
              <span>{bookings.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Baseline retention (from active bookings &amp; bookings ending)
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {result.current.retentionRate.toFixed(1)}%
              {adjustments.retentionRateChange !== 0 && (
                <span className="text-green-600 text-sm ml-2">→ {result.projected.retentionRate.toFixed(1)}%</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2" data-testid="button-back-step2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {!hasAnyAdjustment && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Adjust at least one input to estimate impact
            </span>
          )}
          <Button
            onClick={onNext}
            disabled={!hasAnyAdjustment}
            className="flex items-center gap-2"
            data-testid="button-next-step2"
          >
            Next: Prioritization
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  signed = false,
  className = "",
}: {
  label: string;
  value: number;
  signed?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value);
  const display = signed ? (rounded >= 0 ? `+${rounded}` : `${rounded}`) : rounded.toLocaleString();
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <span className={className ? "" : "text-gray-600"}>{label}:</span>
      <span className={className ? "" : "font-bold"}>{display}</span>
    </div>
  );
}
