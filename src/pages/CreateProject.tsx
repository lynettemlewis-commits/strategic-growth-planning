import { useState } from "react";
import { useLocation } from "wouter";
import { ProjectDetailsStep } from "@/components/project-form/ProjectDetailsStep";
import { BusinessImpactStep } from "@/components/project-form/BusinessImpactStep";
import { EffortStep } from "@/components/project-form/EffortStep";
import { LaunchStrategyStep } from "@/components/project-form/LaunchStrategyStep";
import { calculateGrowthImpact } from "@/lib/growthModel";
import { MARKET_BASELINES } from "@/lib/marketBaselines";
import { monthlyContributionSeries, totalPlanningPeriodValue } from "@/lib/launchTiming";
import { addProject } from "@/lib/projectStore";
import type { FunnelStage, Iteration, LaunchType, Market, MetricAdjustments } from "@/lib/types";

const STEP_LABELS = ["Project Details", "Business Impact", "Estimated Effort", "Launch Strategy"];

interface DraftProject {
  name: string;
  description: string;
  funnel: FunnelStage | "";
  market: Market;
  adjustments: MetricAdjustments;
  effort: number;
  launchType: LaunchType;
  launchMonth: number;
  iterations: Iteration[];
}

const emptyDraft: DraftProject = {
  name: "",
  description: "",
  funnel: "",
  market: "north_america",
  adjustments: {
    trafficChange: 0,
    conversionRateChange: 0,
    acceptanceRateChange: 0,
    retentionRateChange: 0,
    repeatBookingsChange: 0,
  },
  effort: 5,
  launchType: "single",
  launchMonth: 1,
  iterations: [
    { name: "Phase 1", launchMonth: 1, valuePercentage: 50 },
    { name: "Phase 2", launchMonth: 4, valuePercentage: 50 },
  ],
};

export default function CreateProject() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<DraftProject>(emptyDraft);

  const monthlyValue = draft.funnel
    ? calculateGrowthImpact(MARKET_BASELINES[draft.market], draft.adjustments).difference.revenue
    : 0;

  const handleComplete = () => {
    const series = monthlyContributionSeries(
      Math.abs(monthlyValue),
      draft.launchType,
      draft.launchMonth,
      draft.iterations,
    );
    const totalValue = totalPlanningPeriodValue(series);

    addProject({
      name: draft.name || "Untitled Project",
      description: draft.description,
      successMetrics: "",
      funnel: draft.funnel || "demand",
      market: draft.market,
      effort: draft.effort,
      adjustments: draft.adjustments,
      launchType: draft.launchType,
      launchMonth: draft.launchMonth,
      iterations: draft.launchType === "iterative" ? draft.iterations : [],
      monthlyValue: Math.round(Math.abs(monthlyValue)),
      totalValue: Math.round(totalValue),
      isSample: false,
    });

    setDraft(emptyDraft);
    setStep(1);
    setLocation("/portfolio-forecast");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Create Project</h1>
          <div className="text-sm text-gray-500">
            Step {step} of {STEP_LABELS.length}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / STEP_LABELS.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {STEP_LABELS.map((label, i) => (
            <span key={label} className={step >= i + 1 ? "text-blue-600 font-medium" : ""}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {step === 1 && (
        <ProjectDetailsStep
          name={draft.name}
          description={draft.description}
          funnel={draft.funnel}
          market={draft.market}
          onChange={(updates) => setDraft((d) => ({ ...d, ...updates }))}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <BusinessImpactStep
          market={draft.market}
          funnel={draft.funnel || "demand"}
          adjustments={draft.adjustments}
          onChange={(adjustments) => setDraft((d) => ({ ...d, adjustments }))}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <EffortStep
          name={draft.name}
          market={draft.market}
          effort={draft.effort}
          monthlyValue={monthlyValue}
          onChange={(effort) => setDraft((d) => ({ ...d, effort }))}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <LaunchStrategyStep
          market={draft.market}
          monthlyValue={monthlyValue}
          launchType={draft.launchType}
          launchMonth={draft.launchMonth}
          iterations={draft.iterations}
          onChange={(updates) => setDraft((d) => ({ ...d, ...updates }))}
          onBack={() => setStep(3)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
