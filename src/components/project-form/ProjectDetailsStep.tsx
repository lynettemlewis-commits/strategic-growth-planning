import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { FUNNEL_STAGE_DESCRIPTION, FUNNEL_STAGE_OPTIONS } from "@/lib/funnelStages";
import { MARKET_LABEL } from "@/lib/currency";
import { MARKETS, type FunnelStage, type Market } from "@/lib/types";

interface ProjectDetailsStepProps {
  name: string;
  description: string;
  funnel: FunnelStage | "";
  market: Market;
  onChange: (updates: { name?: string; description?: string; funnel?: FunnelStage; market?: Market }) => void;
  onNext: () => void;
}

export function ProjectDetailsStep({
  name,
  description,
  funnel,
  market,
  onChange,
  onNext,
}: ProjectDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-blue-500 pl-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Details</h2>
        <p className="text-gray-600">
          Describe the project and where in the marketplace it operates. You can explore every step
          freely — nothing is saved until you complete the workflow.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-blue-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
          <Input
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Mobile Booking Flow Redesign"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Funnel Stage</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Description &amp; Goals</label>
          <Textarea
            value={description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What does this project change, and what customer or marketplace value does it add?"
            rows={4}
            data-testid="textarea-description"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} className="flex items-center gap-2" data-testid="button-next-step1">
          Next: Model Business Impact
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
