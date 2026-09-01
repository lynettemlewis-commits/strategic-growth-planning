import { useLocation } from "wouter";
import { useProjects } from "@/hooks/use-projects";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { deleteProject } from "@/lib/projectStore";
import { EffortImpactMatrix } from "@/components/EffortImpactMatrix";
import { DisplayCurrencyControl } from "@/components/DisplayCurrencyControl";

export default function EffortImpact() {
  const projects = useProjects();
  const [displayCurrency] = useDisplayCurrency();
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Effort / Impact</h1>
          <p className="text-gray-600 max-w-2xl">
            Every project in this session, plotted by Estimated Effort and financial impact. Sample
            projects span both North America and Australia — switch the display currency to compare
            them side by side.
          </p>
        </div>
        <DisplayCurrencyControl />
      </div>

      <EffortImpactMatrix
        projects={projects}
        displayCurrency={displayCurrency}
        onDelete={deleteProject}
        onEdit={(id) => setLocation(`/edit/${id}`)}
      />
    </div>
  );
}
