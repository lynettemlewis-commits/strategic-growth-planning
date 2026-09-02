import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { EffortImpactMatrix } from "@/components/EffortImpactMatrix";
import { convertToDisplayCurrency, MARKET_CURRENCY } from "@/lib/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { useProjects } from "@/hooks/use-projects";
import type { Market } from "@/lib/types";

interface PrioritizationPreviewStepProps {
  name: string;
  market: Market;
  effort: number;
  monthlyValue: number; // native currency, from the Business Impact step
  /** When editing an existing project, its id — excluded from the preview matrix so its saved position doesn't duplicate the live draft. */
  excludeProjectId?: string;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Read-only prioritization preview. Estimated Effort is captured back on
 * the Project Details step — this step exists only because the matrix
 * needs the project's financial impact (from Business Impact, the prior
 * step) to plot a point, so it can't come any earlier in the wizard.
 */
export function PrioritizationPreviewStep({
  name,
  market,
  effort,
  monthlyValue,
  excludeProjectId,
  onBack,
  onNext,
}: PrioritizationPreviewStepProps) {
  const projects = useProjects();
  const [displayCurrency] = useDisplayCurrency();

  const draftPoint = {
    name: name || "This project",
    effort,
    impactValue: convertToDisplayCurrency(monthlyValue, MARKET_CURRENCY[market], displayCurrency),
  };

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-orange-500 pl-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Prioritization Preview</h2>
        <p className="text-gray-600">
          Here's where this project lands against the rest of the portfolio, at Effort {effort}/10.
          Go back to Project Details if you want to change the effort rating.
        </p>
      </div>

      <EffortImpactMatrix
        projects={projects}
        displayCurrency={displayCurrency}
        draftPoint={draftPoint}
        excludeProjectId={excludeProjectId}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2" data-testid="button-back-step3">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onNext} className="flex items-center gap-2" data-testid="button-next-step3">
          Next: Launch Strategy
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
