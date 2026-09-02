import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ProjectDetailsStep } from "@/components/project-form/ProjectDetailsStep";
import { BusinessImpactStep } from "@/components/project-form/BusinessImpactStep";
import { PrioritizationPreviewStep } from "@/components/project-form/PrioritizationPreviewStep";
import { LaunchStrategyStep } from "@/components/project-form/LaunchStrategyStep";
import { calculateGrowthImpact } from "@/lib/growthModel";
import { MARKET_BASELINES } from "@/lib/marketBaselines";
import { monthlyContributionSeries, totalPlanningPeriodValue } from "@/lib/launchTiming";
import { addProject, updateProject } from "@/lib/projectStore";
import { useProjects } from "@/hooks/use-projects";
import type { FunnelStage, Iteration, LaunchType, Market, MetricAdjustments, Project } from "@/lib/types";

const STEP_LABELS = ["Project Details", "Estimate Impact", "Prioritization", "Launch Strategy"];

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

const defaultIterations: Iteration[] = [
  { name: "Phase 1", launchMonth: 1, valuePercentage: 50 },
  { name: "Phase 2", launchMonth: 4, valuePercentage: 50 },
];

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
  iterations: defaultIterations,
};

function draftFromProject(project: Project): DraftProject {
  return {
    name: project.name,
    description: project.description,
    funnel: project.funnel,
    market: project.market,
    adjustments: project.adjustments,
    effort: project.effort,
    launchType: project.launchType,
    launchMonth: project.launchMonth,
    // A project saved as "single" may have no iterations recorded — seed a
    // sensible default in case the visitor switches to phased while editing.
    iterations: project.iterations.length > 0 ? project.iterations : defaultIterations,
  };
}

export default function CreateProject() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const editId = params.id;
  const projects = useProjects();
  const editingProject = editId ? projects.find((p) => p.id === editId) : undefined;
  const isEditing = !!editId;

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<DraftProject>(() =>
    editingProject ? draftFromProject(editingProject) : emptyDraft,
  );

  // Sample projects are protected — bounce straight back if someone lands
  // on an edit URL for one (typed manually, or a stale link).
  useEffect(() => {
    if (editId && editingProject?.isSample) {
      setLocation("/projects");
    }
  }, [editId, editingProject, setLocation]);

  // If we navigate straight from one edit link to another (or into a fresh
  // create), reset the draft to match.
  useEffect(() => {
    setDraft(editingProject ? draftFromProject(editingProject) : emptyDraft);
    setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

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

    const fields = {
      name: draft.name || "Untitled Project",
      description: draft.description,
      successMetrics: "",
      funnel: draft.funnel || ("demand" as FunnelStage),
      market: draft.market,
      effort: draft.effort,
      adjustments: draft.adjustments,
      launchType: draft.launchType,
      launchMonth: draft.launchMonth,
      iterations: draft.launchType === "iterative" ? draft.iterations : [],
      monthlyValue: Math.round(Math.abs(monthlyValue)),
      totalValue: Math.round(totalValue),
    };

    if (isEditing && editingProject) {
      // Preserve id, isSample, and createdAt — this updates the existing
      // record in place rather than creating a duplicate.
      updateProject(editingProject.id, fields);
      setLocation("/projects");
    } else {
      addProject({ ...fields, isSample: false });
      setLocation("/portfolio-forecast");
    }

    setDraft(emptyDraft);
    setStep(1);
  };

  // Editing a project that no longer exists (e.g. deleted in another tab) —
  // fall back to a normal create flow rather than showing broken state.
  if (editId && !editingProject) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        <p>That project no longer exists in this session.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Project" : "Create Project"}
          </h1>
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
          effort={draft.effort}
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
        <PrioritizationPreviewStep
          name={draft.name}
          market={draft.market}
          effort={draft.effort}
          monthlyValue={monthlyValue}
          excludeProjectId={editingProject?.id}
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
          isEditing={isEditing}
          onChange={(updates) => setDraft((d) => ({ ...d, ...updates }))}
          onBack={() => setStep(3)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
