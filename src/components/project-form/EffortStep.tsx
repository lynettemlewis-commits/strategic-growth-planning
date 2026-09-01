import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { EffortImpactMatrix } from "@/components/EffortImpactMatrix";
import { convertToDisplayCurrency, MARKET_CURRENCY } from "@/lib/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { useProjects } from "@/hooks/use-projects";
import type { Market } from "@/lib/types";

interface EffortStepProps {
  name: string;
  market: Market;
  effort: number;
  monthlyValue: number; // native currency, from the Business Impact step
  /** When editing an existing project, its id — excluded from the preview matrix so its saved position doesn't duplicate the live draft. */
  excludeProjectId?: string;
  onChange: (effort: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function EffortStep({
  name,
  market,
  effort,
  monthlyValue,
  excludeProjectId,
  onChange,
  onBack,
  onNext,
}: EffortStepProps) {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Estimated Effort</h2>
        <p className="text-gray-600">
          Rate the effort to build and ship this project, then see where it lands against the rest of
          the portfolio.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-lg font-semibold text-gray-900 mb-1">Estimated Effort: {effort}/10</label>
        <p className="text-sm text-gray-600 mb-4">1 = Low Effort, 10 = High Effort</p>
        <Slider
          value={[effort]}
          onValueChange={(value) => onChange(Math.round(value[0]))}
          min={1}
          max={10}
          step={1}
          data-testid="slider-effort"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
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
