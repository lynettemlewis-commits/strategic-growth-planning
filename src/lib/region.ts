import { MARKET_LABEL } from "./currency";
import { MARKETS, type Market, type Project } from "./types";

/**
 * The regional filtering dimension used consistently across Projects,
 * Effort/Impact, and Portfolio Forecast. "All" means the combined company
 * (both markets); otherwise it's exactly one of the existing single-market
 * values a project already carries — there's no separate "Both" concept
 * because no project is ever attributed to more than one market.
 */
export type Region = "all" | Market;

export const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: "all", label: "All" },
  ...MARKETS.map((m) => ({ value: m as Region, label: MARKET_LABEL[m] })),
];

export function marketsForRegion(region: Region): Market[] {
  return region === "all" ? [...MARKETS] : [region];
}

export function projectMatchesRegion(project: Project, region: Region): boolean {
  return region === "all" || project.market === region;
}
