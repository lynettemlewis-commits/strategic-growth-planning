import { useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import { deleteProject } from "@/lib/projectStore";
import { ProjectBadge } from "@/components/ProjectBadge";
import { FUNNEL_STAGE_LABEL } from "@/lib/funnelStages";
import { MARKET_LABEL, MARKET_CURRENCY, formatCurrency } from "@/lib/currency";
import { monthName } from "@/lib/calendar";
import { REGION_OPTIONS, projectMatchesRegion, type Region } from "@/lib/region";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function Projects() {
  const projects = useProjects();
  const [region, setRegion] = useState<Region>("all");

  const filtered = projects.filter((p) => projectMatchesRegion(p, region));
  const sorted = [...filtered].sort((a, b) => b.monthlyValue - a.monthlyValue);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">
            Every project in this session — the seeded sample portfolio plus anything you've created.
            This data lives only in your browser for this session.
          </p>
        </div>
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Project</th>
                <th className="text-left p-3 font-medium text-gray-600">Market</th>
                <th className="text-left p-3 font-medium text-gray-600">Funnel Stage</th>
                <th className="text-left p-3 font-medium text-gray-600">Effort</th>
                <th className="text-left p-3 font-medium text-gray-600">Monthly Impact</th>
                <th className="text-left p-3 font-medium text-gray-600">Launch</th>
                <th className="text-left p-3 font-medium text-gray-600" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="mt-1">
                      <ProjectBadge isSample={p.isSample} />
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{MARKET_LABEL[p.market]}</td>
                  <td className="p-3 text-gray-600">{FUNNEL_STAGE_LABEL[p.funnel]}</td>
                  <td className="p-3 text-gray-600">{p.effort}/10</td>
                  <td className="p-3 font-medium text-gray-900">
                    {formatCurrency(p.monthlyValue, MARKET_CURRENCY[p.market])}/mo
                  </td>
                  <td className="p-3 text-gray-600">
                    {p.launchType === "single"
                      ? monthName(p.launchMonth)
                      : `${p.iterations.length} phases from ${monthName(p.iterations[0]?.launchMonth ?? p.launchMonth)}`}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {!p.isSample && (
                      <>
                        <Link href={`/edit/${p.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700"
                            data-testid={`button-edit-${p.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteProject(p.id)}
                          data-testid={`button-delete-${p.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    No projects in this region yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Want to see how these projects add up over the planning period?{" "}
        <Link href="/portfolio-forecast" className="text-blue-600 hover:underline">
          View Portfolio Forecast
        </Link>
        .
      </div>
    </div>
  );
}
