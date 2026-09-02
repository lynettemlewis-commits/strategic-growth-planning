import type { Market } from "./types";

/**
 * Fictional per-market baseline marketplace metrics.
 *
 * These numbers are invented for this public demo. They are NOT derived
 * from, and are not intended to approximate, any real historical operating
 * metric. They exist only so the growth model below has plausible, publicly
 * safe numbers to compute with. `avgBookingValue` is denominated in each
 * market's own native currency (USD for North America, AUD for Australia).
 *
 * Rescaled from an earlier smaller-company draft once the company-level
 * STARTING_RUN_RATE below was set to a $10M-ARR-class business — volume
 * fields (visitors, requests, active bookings, bookings ending) scaled up
 * ~10x so individual project adjustments produce plausible dollar amounts
 * at this company's size. Rates (conversion %, acceptance %) and average
 * booking value are unchanged. The funnel FORMULA itself (growthModel.ts)
 * is untouched — this is a recalibration of input magnitudes only.
 */
export interface MarketBaseline {
  /** Monthly website visitors. */
  avgVisitors: number;
  /** Visitor → booking-request conversion rate, as a percentage (e.g. 1.1 = 1.1%). */
  avgCVRRate: number;
  /** Total monthly booking requests (traffic-driven + repeat). */
  totalBookingRequests: number;
  /** Host acceptance/confirmation rate, as a percentage. */
  avgAcceptanceRate: number;
  /** Average value of a confirmed booking, in the market's native currency. */
  avgBookingValue: number;
  /** Bookings currently active (denominator for the churn/retention calc). */
  activeBookings: number;
  /** Bookings ending per month (numerator for the churn/retention calc). */
  avgBookingsEndingPerMonth: number;
}

export const MARKET_BASELINES: Record<Market, MarketBaseline> = {
  north_america: {
    avgVisitors: 520000,
    avgCVRRate: 1.1,
    totalBookingRequests: 9000,
    avgAcceptanceRate: 58,
    avgBookingValue: 68,
    activeBookings: 50000,
    avgBookingsEndingPerMonth: 4200,
  },
  australia: {
    avgVisitors: 310000,
    avgCVRRate: 1.4,
    totalBookingRequests: 6100,
    avgAcceptanceRate: 66,
    avgBookingValue: 91,
    activeBookings: 32000,
    avgBookingsEndingPerMonth: 2600,
  },
};

/**
 * Fictional current annualized revenue run-rate per market, in the
 * market's native currency, as of the START of the planning period.
 *
 * Set so that, converted to USD at the fixed planning FX rate and summed,
 * North America + Australia equal exactly US$10,000,000 — an intentionally
 * round company-level starting point. The regional split (US$6.7M / a
 * AU$4.95M ≈ US$3.3M) does not need to be individually round.
 *
 * Independently invented, like every other number in this file — not
 * derived from, and not intended to approximate, any real company's actual
 * figures.
 */
export const STARTING_RUN_RATE: Record<Market, number> = {
  north_america: 6_700_000, // USD
  australia: 4_950_000, // AUD (÷1.5 planning FX rate = US$3,300,000)
};

/**
 * Fictional organic annual growth rate per market — i.e. where the
 * business is headed over the planning period with ZERO proposed
 * projects. North America (more mature) grows slower than Australia
 * (faster-growing); weighted by STARTING_RUN_RATE above this produces
 * ~12% combined baseline growth.
 */
export const BASELINE_GROWTH_RATE: Record<Market, number> = {
  north_america: 0.1, // 10%
  australia: 0.16, // 16%
};
