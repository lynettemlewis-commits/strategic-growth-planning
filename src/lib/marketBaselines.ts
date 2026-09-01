import type { Market } from "./types";

/**
 * Fictional per-market baseline marketplace metrics.
 *
 * These numbers are invented for this public demo. They are NOT derived
 * from, and are not intended to approximate, any real historical operating
 * metric. They exist only so the growth model below has plausible, publicly
 * safe numbers to compute with. `avgBookingValue` is denominated in each
 * market's own native currency (USD for North America, AUD for Australia).
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
    avgVisitors: 52000,
    avgCVRRate: 1.1,
    totalBookingRequests: 900,
    avgAcceptanceRate: 58,
    avgBookingValue: 68,
    activeBookings: 5000,
    avgBookingsEndingPerMonth: 420,
  },
  australia: {
    avgVisitors: 31000,
    avgCVRRate: 1.4,
    totalBookingRequests: 610,
    avgAcceptanceRate: 66,
    avgBookingValue: 91,
    activeBookings: 3200,
    avgBookingsEndingPerMonth: 260,
  },
};
