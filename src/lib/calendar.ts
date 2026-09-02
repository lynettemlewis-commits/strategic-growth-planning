/**
 * Centralized planning calendar.
 *
 * A plain calendar-year planning period (January–December). The original
 * internal tool ran on a July–June fiscal year; the public version uses a
 * calendar year instead so the tool is legible without any "FY" context —
 * the fiscal-year origin is a README footnote, not something visitors need
 * to decode from an unexplained month order.
 *
 * This is the single source of truth for month order/labels/quarters.
 * Every other module (growth model, launch timing, portfolio forecast, UI
 * dropdowns) imports from here rather than hardcoding month names/order —
 * this file is the only thing that would need to change to shift the
 * planning period again.
 */

export interface PlanningMonth {
  /** 1-12 position in the planning year (1 = January). */
  index: number;
  /** Short display label, e.g. "January". */
  name: string;
  /** Which planning quarter this month falls in (1-4). */
  quarter: 1 | 2 | 3 | 4;
}

export const PLANNING_MONTHS: PlanningMonth[] = [
  { index: 1, name: "January", quarter: 1 },
  { index: 2, name: "February", quarter: 1 },
  { index: 3, name: "March", quarter: 1 },
  { index: 4, name: "April", quarter: 2 },
  { index: 5, name: "May", quarter: 2 },
  { index: 6, name: "June", quarter: 2 },
  { index: 7, name: "July", quarter: 3 },
  { index: 8, name: "August", quarter: 3 },
  { index: 9, name: "September", quarter: 3 },
  { index: 10, name: "October", quarter: 4 },
  { index: 11, name: "November", quarter: 4 },
  { index: 12, name: "December", quarter: 4 },
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
