import { useState } from "react";
import { useLocation } from "wouter";
import { useProjects } from "@/hooks/use-projects";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { deleteProject } from "@/lib/projectStore";
import { EffortImpactMatrix } from "@/components/EffortImpactMatrix";
import { DisplayCurrencyControl } from "@/components/DisplayCurrencyControl";
import { REGION_OPTIONS, projectMatchesRegion, type Region } from "@/lib/region";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EffortImpact() {
  const projects = useProjects();
  const [displayCurrency] = useDisplayCurrency();
  const [region, setRegion] = useState<Region>("all");
  const [, setLocation] = useLocation();

  const filtered = projects.filter((p) => projectMatchesRegion(p, region));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Effort / Impact</h1>
          <p className="text-gray-600 max-w-2xl">
            Every project in this session, plotted by Estimated Effort and financial impact. Filter by
            region to prioritize company-wide or within one market.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">Region</span>
            <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
              <SelectTrigger className="w-40" data-testid="select-region-filter">
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

      <EffortImpactMatrix
        projects={filtered}
        displayCurrency={displayCurrency}
        onDelete={deleteProject}
        onEdit={(id) => setLocation(`/edit/${id}`)}
      />
    </div>
  );
}
