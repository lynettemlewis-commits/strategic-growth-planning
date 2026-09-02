import { PLANNING_PERIOD_LENGTH } from "./calendar";
import { BASELINE_GROWTH_RATE, STARTING_RUN_RATE } from "./marketBaselines";
import type { Market } from "./types";

/**
 * Organic (zero-project) business trajectory: each market's revenue
 * run-rate grows from STARTING_RUN_RATE to STARTING_RUN_RATE × (1 +
 * BASELINE_GROWTH_RATE) over the 12-month planning period, compounding
 * monthly so it lands on the annual target exactly at month 12.
 *
 * This is a company-level growth assumption, independent of the
 * marketplace funnel model in growthModel.ts (which still drives every
 * individual PROJECT's incremental impact, unchanged).
 */

/** Monthly compound rate that reaches `annualRate` after PLANNING_PERIOD_LENGTH months. */
function monthlyGrowthRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / PLANNING_PERIOD_LENGTH) - 1;
}

/** Native-currency run-rate at the start of the planning period. */
export function startingRunRateNative(market: Market): number {
  return STARTING_RUN_RATE[market];
}

/** Native-currency run-rate at the end of the planning period (zero projects). */
export function baselineForecastNative(market: Market): number {
  return STARTING_RUN_RATE[market] * (1 + BASELINE_GROWTH_RATE[market]);
}

/** Native-currency run-rate at a given point (1-12) into the planning period. */
export function baselineRunRateAtMonth(market: Market, monthIndex: number): number {
  const r = monthlyGrowthRate(BASELINE_GROWTH_RATE[market]);
  return STARTING_RUN_RATE[market] * Math.pow(1 + r, monthIndex);
}
