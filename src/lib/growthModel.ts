import type { MarketBaseline } from "./marketBaselines";
import type { MetricAdjustments } from "./types";

/**
 * The marketplace growth model — the single source of truth for turning a
 * market's baseline metrics + a project's proposed adjustments into a
 * monthly revenue impact.
 *
 * Conceptual funnel (preserved from the original tool):
 *
 *   Website Traffic
 *     -> Website Conversion Rate
 *     -> Booking Requests
 *     -> Host Acceptance / Confirmation Rate
 *     -> Confirmed Bookings
 *     -> Average Booking Value
 *     -> Revenue
 *
 * Plus a separate retention/churn track:
 *
 *   Active Bookings -> bookings ending / churn -> retained bookings -> retained revenue
 *
 * The two effects (funnel-driven acquisition impact, and retention impact)
 * are ADDITIVE, matching the original model. This file replaces the two
 * previously-duplicated implementations (a standalone calculator page and a
 * near-identical copy embedded in the project wizard) with one function.
 *
 * Note on `avgRetention`: the original app had a separate "Average
 * Retention" baseline field that was collected but never actually used —
 * the real retention/churn calculation always derived from
 * `avgBookingsEndingPerMonth / activeBookings`. Rather than keep a field
 * that silently does nothing, this model derives and DISPLAYS retention
 * from those two real drivers directly (see `current.retentionRate` below).
 */

export interface GrowthSnapshot {
  totalBookingRequests: number;
  confirmedBookings: number;
  bookingsEnded: number;
  monthlyRevenue: number;
  retentionRate: number; // percentage, 0-100
  churnRate: number; // percentage, 0-100
}

export interface GrowthCalculationResult {
  current: GrowthSnapshot;
  projected: GrowthSnapshot;
  difference: {
    traffic: number;
    bookingRequests: number;
    confirmedBookings: number;
    bookingsEnded: number;
    /** Total monthly revenue impact: funnel impact + retention impact (additive). */
    revenue: number;
    savedBookings: number;
    retentionRevenueImpact: number;
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function calculateGrowthImpact(
  baseline: MarketBaseline,
  adjustments: MetricAdjustments,
): GrowthCalculationResult {
  const {
    avgVisitors,
    avgCVRRate,
    totalBookingRequests,
    avgAcceptanceRate,
    avgBookingValue,
    activeBookings,
    avgBookingsEndingPerMonth,
  } = baseline;

  // --- Current state --------------------------------------------------
  const currentBookingRequestsFromTraffic = (avgVisitors * avgCVRRate) / 100;
  const currentRepeatBookingRequests = totalBookingRequests - currentBookingRequestsFromTraffic;
  const currentTotalBookingRequests = totalBookingRequests;
  const currentConfirmedBookings = Math.round(
    currentTotalBookingRequests * (avgAcceptanceRate / 100),
  );
  const currentBookingsEnded = avgBookingsEndingPerMonth;
  const currentNetNewBookings = currentConfirmedBookings - currentBookingsEnded;
  const currentMonthlyRevenue = currentNetNewBookings * avgBookingValue;

  // --- Retention / churn (derived from the real drivers) ---------------
  const currentRetentionRate = 1 - avgBookingsEndingPerMonth / activeBookings;
  const currentChurnRate = 1 - currentRetentionRate;
  const improvedRetentionRate = clamp(
    currentRetentionRate + adjustments.retentionRateChange / 100,
    0,
    1,
  );
  const improvedChurnRate = 1 - improvedRetentionRate;
  const futureBookingsEnded = activeBookings * improvedChurnRate;
  const savedBookings = currentBookingsEnded - futureBookingsEnded;
  const retentionRevenueImpact = savedBookings * avgBookingValue;

  // --- Projected state with adjustments ---------------------------------
  const newAcceptanceRate = clamp(avgAcceptanceRate + adjustments.acceptanceRateChange, 0, 100);
  const newCVRRate = Math.max(0, avgCVRRate + adjustments.conversionRateChange);
  const newTraffic = Math.max(0, avgVisitors + adjustments.trafficChange);

  const projectedBookingRequestsFromTraffic = (newTraffic * newCVRRate) / 100;
  const projectedRepeatBookingRequests =
    currentRepeatBookingRequests + adjustments.repeatBookingsChange;
  const projectedTotalBookingRequests =
    projectedBookingRequestsFromTraffic + projectedRepeatBookingRequests;
  const projectedConfirmedBookings = Math.round(
    projectedTotalBookingRequests * (newAcceptanceRate / 100),
  );
  const projectedBookingsEnded = futureBookingsEnded;
  const projectedNetNewBookings = projectedConfirmedBookings - projectedBookingsEnded;
  const projectedMonthlyRevenue = projectedNetNewBookings * avgBookingValue;

  // --- Differences -------------------------------------------------------
  const bookingRequestsDifference = projectedTotalBookingRequests - currentTotalBookingRequests;
  const confirmedBookingsDifference = projectedConfirmedBookings - currentConfirmedBookings;
  const bookingsEndedDifference = currentBookingsEnded - projectedBookingsEnded;
  const confirmedBookingsRevenueImpact = confirmedBookingsDifference * avgBookingValue;
  // Additive model: acquisition/funnel impact + retention impact. No compounding.
  const totalRevenueDifference = confirmedBookingsRevenueImpact + retentionRevenueImpact;

  return {
    current: {
      totalBookingRequests: Math.round(currentTotalBookingRequests),
      confirmedBookings: Math.round(currentConfirmedBookings),
      bookingsEnded: Math.round(currentBookingsEnded),
      monthlyRevenue: currentMonthlyRevenue,
      retentionRate: currentRetentionRate * 100,
      churnRate: currentChurnRate * 100,
    },
    projected: {
      totalBookingRequests: Math.round(projectedTotalBookingRequests),
      confirmedBookings: Math.round(projectedConfirmedBookings),
      bookingsEnded: Math.round(projectedBookingsEnded),
      monthlyRevenue: projectedMonthlyRevenue,
      retentionRate: improvedRetentionRate * 100,
      churnRate: improvedChurnRate * 100,
    },
    difference: {
      traffic: adjustments.trafficChange,
      bookingRequests: bookingRequestsDifference,
      confirmedBookings: confirmedBookingsDifference,
      bookingsEnded: bookingsEndedDifference,
      revenue: totalRevenueDifference,
      savedBookings,
      retentionRevenueImpact,
    },
  };
}

/**
 * Estimated incremental bookings implied by a monthly revenue impact,
 * derived from the project's OWN market's current Average Booking Value.
 *
 * This replaces the historical hardcoded `/82` shortcut, which was a frozen
 * snapshot of one market's old average booking value and had drifted stale
 * and brand-agnostic. There is no hardcoded constant here — the divisor is
 * always the live baseline for the project's market.
 */
export function estimatedIncrementalBookings(
  monthlyRevenueImpact: number,
  avgBookingValue: number,
): number {
  if (avgBookingValue <= 0) return 0;
  return Math.round(Math.abs(monthlyRevenueImpact) / avgBookingValue);
}
