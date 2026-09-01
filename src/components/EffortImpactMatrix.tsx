import { useMemo, useState } from "react";
import { MARKET_CURRENCY, MARKET_LABEL, convertToDisplayCurrency, formatCurrency, type DisplayCurrency } from "@/lib/currency";
import type { Project } from "@/lib/types";
import { ProjectBadge } from "./ProjectBadge";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Effort/Impact prioritization matrix.
 *
 * X axis = Estimated Effort (1-10), plotted at its real value — no bucketing.
 * Y axis = financial impact (monthly), converted into the selected display
 * currency, plotted at its real value on a linear scale — no normalization.
 *
 * The four quadrants are defined by the MEDIAN effort and MEDIAN impact of
 * whatever project set is currently displayed, so the dividing lines are
 * relative to this portfolio rather than fixed historical dollar
 * thresholds. The underlying values plotted are always the real numbers.
 */

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface MatrixPoint {
  id: string;
  name: string;
  market: Project["market"];
  isSample: boolean;
  effort: number;
  impactValue: number; // already converted to display currency
}

interface EffortImpactMatrixProps {
  projects: Project[];
  displayCurrency: DisplayCurrency;
  /** An in-progress project being modeled in the wizard, shown highlighted but not part of the median calc. */
  draftPoint?: { name: string; effort: number; impactValue: number };
  /** Omit this project from the plotted set — used while editing it, so its stale saved position doesn't appear alongside the live draft overlay. */
  excludeProjectId?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function EffortImpactMatrix({
  projects,
  displayCurrency,
  draftPoint,
  excludeProjectId,
  onDelete,
  onEdit,
}: EffortImpactMatrixProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const points: MatrixPoint[] = useMemo(
    () =>
      projects
        .filter((p) => p.id !== excludeProjectId)
        .map((p) => ({
          id: p.id,
          name: p.name,
          market: p.market,
          isSample: p.isSample,
          effort: p.effort,
          impactValue: convertToDisplayCurrency(
            p.monthlyValue,
            MARKET_CURRENCY[p.market],
            displayCurrency,
          ),
        })),
    [projects, excludeProjectId, displayCurrency],
  );

  const medianEffort = useMemo(() => median(points.map((p) => p.effort)), [points]);
  const medianImpact = useMemo(() => median(points.map((p) => p.impactValue)), [points]);

  const maxImpact = useMemo(() => {
    const values = points.map((p) => p.impactValue).concat(draftPoint ? [draftPoint.impactValue] : []);
    const max = Math.max(0, ...values);
    return max === 0 ? 1 : max * 1.15; // headroom so the top dot isn't clipped
  }, [points, draftPoint]);

  const xPct = (effort: number) => ((effort - 1) / 9) * 100;
  const yPct = (impact: number) => 100 - (Math.max(0, impact) / maxImpact) * 100;

  const dividerXPct = xPct(medianEffort || 1);
  const dividerYPct = yPct(medianImpact);

  const selected = points.find((p) => p.id === selectedId);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
        {draftPoint && (
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-orange-500 rounded-full" />
            This project
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-gray-400 rounded-full" />
          Sample Project
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full" />
          Your Project
        </span>
        <span className="ml-auto text-xs text-gray-400">
          Quadrant lines: median effort ({medianEffort.toFixed(1)}) &amp; median impact (
          {formatCurrency(medianImpact, displayCurrency)}/mo) of the projects shown
        </span>
      </div>

      <div className="relative mx-14 my-10">
        <div className="absolute -left-14 top-1/4 -translate-y-1/2 -rotate-90 text-xs text-gray-500 font-medium whitespace-nowrap">
          Higher Impact
        </div>
        <div className="absolute -left-14 bottom-1/4 translate-y-1/2 -rotate-90 text-xs text-gray-500 font-medium whitespace-nowrap">
          Lower Impact
        </div>
        <div className="absolute -bottom-7 left-1/4 -translate-x-1/2 text-xs text-gray-500 font-medium">
          Lower Effort
        </div>
        <div className="absolute -bottom-7 right-1/4 translate-x-1/2 text-xs text-gray-500 font-medium">
          Higher Effort
        </div>

        <div className="w-full h-96 border-2 border-gray-200 rounded-xl relative overflow-visible bg-gray-50/50">
          {/* Median divider lines */}
          <div
            className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-300"
            style={{ left: `${dividerXPct}%` }}
          />
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-gray-300"
            style={{ top: `${dividerYPct}%` }}
          />

          {/* Quadrant labels — capped to under half the box width and
              allowed to wrap so the two top (and two bottom) labels can
              never collide into each other, even in a narrow container. */}
          <span className="absolute top-2 left-2 max-w-[46%] text-[11px] font-medium text-green-700">
            Higher Impact / Lower Effort
          </span>
          <span className="absolute top-2 right-2 max-w-[46%] text-[11px] font-medium text-amber-700 text-right">
            Higher Impact / Higher Effort
          </span>
          <span className="absolute bottom-2 left-2 max-w-[46%] text-[11px] font-medium text-gray-500">
            Lower Impact / Lower Effort
          </span>
          <span className="absolute bottom-2 right-2 max-w-[46%] text-[11px] font-medium text-red-600 text-right">
            Lower Impact / Higher Effort
          </span>

          {points.map((p) => (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${xPct(p.effort)}%`, top: `${yPct(p.impactValue)}%` }}
              onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
              data-testid={`matrix-dot-${p.id}`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 border-white shadow transition-transform group-hover:scale-125 ${
                  p.isSample ? "bg-gray-400" : "bg-blue-500"
                } ${selectedId === p.id ? "ring-2 ring-blue-600" : ""}`}
              />
              <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[11px] text-center pointer-events-none whitespace-nowrap">
                <div className="font-medium text-gray-700">{p.name}</div>
              </div>
            </div>
          ))}

          {draftPoint && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${xPct(draftPoint.effort)}%`, top: `${yPct(draftPoint.impactValue)}%` }}
            >
              <div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-lg ring-2 ring-orange-300" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[11px] text-center whitespace-nowrap font-semibold text-orange-700">
                {draftPoint.name || "This project"}
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{selected.name}</span>
              <ProjectBadge isSample={selected.isSample} />
            </div>
            <div className="text-sm text-gray-600">
              {MARKET_LABEL[selected.market]} &middot; Effort {selected.effort}/10 &middot;{" "}
              {formatCurrency(selected.impactValue, displayCurrency)}/mo
            </div>
          </div>
          {!selected.isSample && (onEdit || onDelete) && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(selected.id)}
                  data-testid={`button-edit-${selected.id}`}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    onDelete(selected.id);
                    setSelectedId(null);
                  }}
                  data-testid={`button-delete-${selected.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
