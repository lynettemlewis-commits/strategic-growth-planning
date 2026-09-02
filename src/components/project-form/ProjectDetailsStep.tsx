import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, AlertCircle } from "lucide-react";
import { FUNNEL_STAGE_DESCRIPTION, FUNNEL_STAGE_OPTIONS } from "@/lib/funnelStages";
import { MARKET_LABEL } from "@/lib/currency";
import { MARKETS, type FunnelStage, type Market } from "@/lib/types";

interface ProjectDetailsStepProps {
  name: string;
  description: string;
  funnel: FunnelStage | "";
  market: Market;
  effort: number;
  onChange: (updates: {
    name?: string;
    description?: string;
    funnel?: FunnelStage;
    market?: Market;
    effort?: number;
  }) => void;
  onNext: () => void;
}

const EFFORT_GUIDANCE = [
  {
    level: "Low Effort",
    range: "1-3",
    color: "green",
    factors: [
      "Single team, little to no cross-team coordination",
      "Straightforward technically — minimal new logic or design work",
      "Few or no dependencies",
      "Fits within part of one sprint",
    ],
    example: "e.g., a copy/config change, a small onboarding email tweak",
  },
  {
    level: "Medium Effort",
    range: "4-7",
    color: "amber",
    factors: [
      "Two or three teams involved (e.g., product, design, engineering)",
      "Meaningful design and/or testing work required",
      "Some dependencies to sequence around",
      "Roughly one to a few sprints",
    ],
    example: "e.g., a checkout flow redesign, a new lifecycle email sequence",
  },
  {
    level: "High Effort",
    range: "8-10",
    color: "red",
    factors: [
      "Many teams / cross-functional coordination required",
      "Significant technical complexity or a new capability being built",
      "Multiple dependencies, higher execution risk",
      "Multiple sprints or a multi-month rollout",
    ],
    example: "e.g., a new mobile app feature, a cross-platform migration",
  },
] as const;

const COLOR_CLASSES: Record<string, string> = {
  green: "border-green-300 bg-green-50 text-green-700",
  amber: "border-amber-300 bg-amber-50 text-amber-700",
  red: "border-red-300 bg-red-50 text-red-700",
};

export function ProjectDetailsStep({
  name,
  description,
  funnel,
  market,
  effort,
  onChange,
  onNext,
}: ProjectDetailsStepProps) {
  const missing: string[] = [];
  if (!name.trim()) missing.push("Project Name");
  if (!funnel) missing.push("Funnel Stage");
  const canProceed = missing.length === 0;

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 pl-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Details</h2>
        <p className="text-gray-600">
          Describe the project and where in the marketplace it operates.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g., Referral Program Launch"
            className="text-lg"
            data-testid="input-project-name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
          <div className="flex gap-4">
            {MARKETS.map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="market"
                  checked={market === m}
                  onChange={() => onChange({ market: m })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  data-testid={`radio-market-${m}`}
                />
                <span className="text-sm text-gray-700">{MARKET_LABEL[m]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Funnel Stage <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">Where in the marketplace does this project primarily operate?</p>
          <Select value={funnel} onValueChange={(value) => onChange({ funnel: value as FunnelStage })}>
            <SelectTrigger data-testid="select-funnel">
              <SelectValue placeholder="Select funnel stage" />
            </SelectTrigger>
            <SelectContent>
              {FUNNEL_STAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {funnel && <p className="text-xs text-gray-500 mt-2">{FUNNEL_STAGE_DESCRIPTION[funnel as FunnelStage]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Effort: {effort}/10</label>
          <p className="text-xs text-gray-500 mb-3">1 = Low Effort, 10 = High Effort</p>
          <Slider
            value={[effort]}
            onValueChange={(value) => onChange({ effort: Math.round(value[0]) })}
            min={1}
            max={10}
            step={1}
            data-testid="slider-effort"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2 mb-4">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EFFORT_GUIDANCE.map((g) => (
              <div key={g.level} className={`p-3 rounded-lg border ${COLOR_CLASSES[g.color]}`}>
                <div className="font-semibold text-sm mb-1">
                  {g.level} <span className="font-normal opacity-70">({g.range})</span>
                </div>
                <ul className="text-xs space-y-0.5 list-disc list-inside opacity-90">
                  {g.factors.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="text-xs italic mt-2 opacity-70">{g.example}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description &amp; Goals</label>
          <Textarea
            value={description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What does this project change, and what customer or marketplace value does it add? (optional)"
            rows={4}
            data-testid="textarea-description"
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-3">
        {!canProceed && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Missing: {missing.join(", ")}
          </span>
        )}
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2"
          data-testid="button-next-step1"
        >
          Next: Estimate Impact
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
