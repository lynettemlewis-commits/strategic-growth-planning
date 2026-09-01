import type { FunnelStage, MetricAdjustments } from "./types";

/**
 * Funnel stages describe WHERE in the marketplace a project operates. They
 * primarily categorize a project (for filtering/visualization) and
 * RECOMMEND the metric most likely to move — they never restrict which
 * metric a project can adjust. The calculator always allows adjusting any
 * combination of the five levers below; the recommendation is a highlight,
 * not a gate.
 */

export const FUNNEL_STAGE_LABEL: Record<FunnelStage, string> = {
  demand: "Demand",
  supply: "Supply",
  website_booking: "Website Booking",
  booking_confirmation: "Booking Confirmation",
  retention: "Retention",
};

export const FUNNEL_STAGE_DESCRIPTION: Record<FunnelStage, string> = {
  demand: "Attracting new visitors and demand into the marketplace.",
  supply: "Growing or engaging the supply side (hosts/listings) that requests get matched against.",
  website_booking: "Turning a website visit into a booking request.",
  booking_confirmation: "Getting a booking request confirmed — driven by host acceptance behavior.",
  retention: "Keeping existing bookings active and reducing churn.",
};

/** Which adjustable metric this funnel stage most likely affects. */
export const FUNNEL_STAGE_RECOMMENDED_METRIC: Record<FunnelStage, keyof MetricAdjustments> = {
  demand: "trafficChange",
  supply: "acceptanceRateChange",
  website_booking: "conversionRateChange",
  booking_confirmation: "acceptanceRateChange",
  retention: "retentionRateChange",
};

export const FUNNEL_STAGE_OPTIONS: { value: FunnelStage; label: string }[] = (
  Object.keys(FUNNEL_STAGE_LABEL) as FunnelStage[]
).map((value) => ({ value, label: FUNNEL_STAGE_LABEL[value] }));
