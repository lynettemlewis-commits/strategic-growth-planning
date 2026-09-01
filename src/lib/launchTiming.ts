import { PLANNING_PERIOD_LENGTH } from "./calendar";
import type { Iteration, LaunchType } from "./types";

/**
 * Shared launch-timing math, used identically by an individual project's
 * calculation and by the Portfolio Forecast. This is the ONE place this
 * logic lives — the historical app had it duplicated (and, in its last
 * working state, regressed) across multiple files.
 *
 * Single launch: the project's full monthly value applies from its launch
 * month through the end of the 12-month planning period.
 *
 * Phased/iterative launch: each phase contributes its assigned percentage
 * of the project's monthly value beginning in its own launch month, and
 * that contribution continues through the end of the planning period.
 * Contributions stack cumulatively and additively as later phases launch —
 * e.g. a 25% phase in month 2 plus a 35% phase in month 5 means 60% of
 * value is active from month 5 onward, not 35% replacing the 25%.
 *
 * This intentionally fixes the historical regression where a later commit
 * collapsed iterative launches to dump 100% of value into a single month.
 */

/**
 * Returns a 12-entry array (index 0 = planning month 1) of the monthly
 * native-currency value contributed by this launch strategy.
 */
export function monthlyContributionSeries(
  monthlyValue: number,
  launchType: LaunchType,
  launchMonth: number,
  iterations: Iteration[],
): number[] {
  const series = new Array(PLANNING_PERIOD_LENGTH).fill(0) as number[];

  if (launchType === "single" || iterations.length === 0) {
    for (let m = 1; m <= PLANNING_PERIOD_LENGTH; m++) {
      series[m - 1] = m >= launchMonth ? monthlyValue : 0;
    }
    return series;
  }

  for (let m = 1; m <= PLANNING_PERIOD_LENGTH; m++) {
    let active = 0;
    for (const iteration of iterations) {
      if (m >= iteration.launchMonth) {
        active += (iteration.valuePercentage / 100) * monthlyValue;
      }
    }
    series[m - 1] = active;
  }
  return series;
}

/** Sum of a 12-month contribution series — the project's total impact across the planning period. */
export function totalPlanningPeriodValue(series: number[]): number {
  return series.reduce((sum, v) => sum + v, 0);
}

/** For comparison UI: what the total would be if launched as a single event in `launchMonth`. */
export function singleLaunchTotal(monthlyValue: number, launchMonth: number): number {
  const monthsRemaining = PLANNING_PERIOD_LENGTH - launchMonth + 1;
  return monthlyValue * Math.max(0, monthsRemaining);
}

export function iterationPercentageTotal(iterations: Iteration[]): number {
  return iterations.reduce((sum, iter) => sum + iter.valuePercentage, 0);
}
