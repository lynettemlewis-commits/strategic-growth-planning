/**
 * Centralized planning calendar.
 *
 * The original tool ran on a July–June fiscal year. The public version keeps
 * that planning cycle (it's a real, if unusual, artifact of the original
 * global marketplace) but presents it year-neutrally — no calendar year is
 * shown or configured anywhere in the product. Months are addressed purely
 * by their 1-12 position in the planning period ("planning month"), where
 * month 1 = July and month 12 = June.
 *
 * This is the single source of truth for that mapping. Every other module
 * (growth model, launch timing, portfolio forecast, UI dropdowns) imports
 * from here rather than hardcoding month names/order.
 */

export interface PlanningMonth {
  /** 1-12 position in the planning year (1 = July). */
  index: number;
  /** Short display label, e.g. "July". */
  name: string;
  /** Which planning quarter this month falls in (1-4). */
  quarter: 1 | 2 | 3 | 4;
}

export const PLANNING_MONTHS: PlanningMonth[] = [
  { index: 1, name: "July", quarter: 1 },
  { index: 2, name: "August", quarter: 1 },
  { index: 3, name: "September", quarter: 1 },
  { index: 4, name: "October", quarter: 2 },
  { index: 5, name: "November", quarter: 2 },
  { index: 6, name: "December", quarter: 2 },
  { index: 7, name: "January", quarter: 3 },
  { index: 8, name: "February", quarter: 3 },
  { index: 9, name: "March", quarter: 3 },
  { index: 10, name: "April", quarter: 4 },
  { index: 11, name: "May", quarter: 4 },
  { index: 12, name: "June", quarter: 4 },
];

export const PLANNING_PERIOD_LENGTH = PLANNING_MONTHS.length;

export const QUARTERS: { quarter: 1 | 2 | 3 | 4; months: PlanningMonth[] }[] = [1, 2, 3, 4].map(
  (q) => ({
    quarter: q as 1 | 2 | 3 | 4,
    months: PLANNING_MONTHS.filter((m) => m.quarter === q),
  }),
);

export function monthName(index: number): string {
  return PLANNING_MONTHS.find((m) => m.index === index)?.name ?? "Unknown";
}

export function quarterLabel(quarter: 1 | 2 | 3 | 4): string {
  return `Q${quarter}`;
}

/** Options for a month-picker dropdown, in planning order. */
export const MONTH_OPTIONS = PLANNING_MONTHS.map((m) => ({
  value: m.index,
  label: m.name,
}));
