import { calculateGrowthImpact } from "./growthModel";
import { monthlyContributionSeries, totalPlanningPeriodValue } from "./launchTiming";
import { MARKET_BASELINES } from "./marketBaselines";
import type { Iteration, MetricAdjustments, Project } from "./types";

/**
 * Seeded sample portfolio.
 *
 * These are entirely fictional marketplace growth projects, invented for
 * this public demo. Names, metric assumptions, and resulting figures are
 * NOT derived from any historical project. Each one's `monthlyValue` /
 * `totalValue` is computed through the same growth model and launch-timing
 * logic used for a visitor's own projects, so the sample portfolio behaves
 * exactly like real data rather than being hand-typed numbers.
 *
 * Adjustment magnitudes were calibrated (via a throwaway script, not
 * hand-typed) so the portfolio's combined FY-realized impact lands at
 * roughly $1.0M against the ~$10M starting run rate / ~$11.2M baseline —
 * i.e. resulting company growth of roughly 20-25%. The launch timing,
 * regional split, and per-project results were NOT hardcoded to hit that
 * number directly; they fall out of these adjustments run through the same
 * model a visitor's own project uses.
 */

const emptyAdjustments: MetricAdjustments = {
  trafficChange: 0,
  conversionRateChange: 0,
  acceptanceRateChange: 0,
  retentionRateChange: 0,
  repeatBookingsChange: 0,
};

interface SampleSeed {
  id: string;
  name: string;
  description: string;
  funnel: Project["funnel"];
  market: Project["market"];
  effort: number;
  adjustments: Partial<MetricAdjustments>;
  launchType: Project["launchType"];
  launchMonth: number;
  iterations?: Iteration[];
}

const SEEDS: SampleSeed[] = [
  {
    id: "sample-mobile-booking-flow",
    name: "Mobile Booking Flow Redesign",
    description:
      "Simplify the mobile booking form to cut drop-off between search and request, improving the visitor-to-booking-request conversion rate.",
    funnel: "website_booking",
    market: "north_america",
    effort: 6,
    adjustments: { conversionRateChange: 0.12 },
    launchType: "single",
    launchMonth: 2, // February
  },
  {
    id: "sample-host-response-nudges",
    name: "Host Response Time Nudges",
    description:
      "Push notifications and in-app nudges that prompt hosts to respond to booking requests faster, raising the acceptance/confirmation rate.",
    funnel: "supply",
    market: "australia",
    effort: 4,
    adjustments: { acceptanceRateChange: 4 },
    launchType: "single",
    launchMonth: 4, // April
  },
  {
    id: "sample-seo-landing-expansion",
    name: "SEO Landing Page Expansion",
    description:
      "Build out category and city landing pages to capture more organic search demand and grow top-of-funnel traffic.",
    funnel: "demand",
    market: "north_america",
    effort: 5,
    adjustments: { trafficChange: 49000 },
    launchType: "iterative",
    launchMonth: 2,
    iterations: [
      { name: "Phase 1: Top 10 cities", launchMonth: 2, valuePercentage: 40 },
      { name: "Phase 2: Full city set", launchMonth: 6, valuePercentage: 60 },
    ],
  },
  {
    id: "sample-winback-campaign",
    name: "Customer Win-Back Campaign",
    description:
      "Lifecycle email/SMS campaign targeting past bookers who haven't rebooked, aimed at reducing effective churn.",
    funnel: "retention",
    market: "australia",
    effort: 3,
    adjustments: { retentionRateChange: 0.65 },
    launchType: "single",
    launchMonth: 9, // September
  },
  {
    id: "sample-host-onboarding",
    name: "Host Onboarding Improvements",
    description:
      "Redesigned onboarding flow and listing-quality checklist for new hosts, intended to raise acceptance rates as the new host cohort matures.",
    funnel: "supply",
    market: "north_america",
    effort: 7,
    adjustments: { acceptanceRateChange: 2.5 },
    launchType: "iterative",
    launchMonth: 1,
    iterations: [
      { name: "Phase 1: New host flow", launchMonth: 1, valuePercentage: 30 },
      { name: "Phase 2: Existing host backfill", launchMonth: 4, valuePercentage: 30 },
      { name: "Phase 3: Full rollout", launchMonth: 8, valuePercentage: 40 },
    ],
  },
  {
    id: "sample-checkout-confirmation-speedup",
    name: "Checkout Confirmation Speed-Up",
    description:
      "Streamlined checkout and confirmation screens, rolled out in two phases, to reduce abandonment between a booking request and final confirmation.",
    funnel: "booking_confirmation",
    market: "australia",
    effort: 5,
    adjustments: { acceptanceRateChange: 3.2 },
    launchType: "iterative",
    launchMonth: 3,
    iterations: [
      { name: "Phase 1: Core flow", launchMonth: 3, valuePercentage: 50 },
      { name: "Phase 2: Edge cases", launchMonth: 7, valuePercentage: 50 },
    ],
  },
  {
    id: "sample-repeat-booking-loyalty",
    name: "Repeat Booking Loyalty Perks",
    description:
      "A lightweight perks program that gives returning customers priority booking and small credits, encouraging more repeat booking requests.",
    funnel: "retention",
    market: "north_america",
    effort: 4,
    adjustments: { repeatBookingsChange: 330 },
    launchType: "single",
    launchMonth: 5, // May
  },
];

function buildSampleProject(seed: SampleSeed): Project {
  const adjustments: MetricAdjustments = { ...emptyAdjustments, ...seed.adjustments };
  const baseline = MARKET_BASELINES[seed.market];
  const result = calculateGrowthImpact(baseline, adjustments);
  const monthlyValue = Math.abs(result.difference.revenue);
  const iterations = seed.iterations ?? [];
  const series = monthlyContributionSeries(monthlyValue, seed.launchType, seed.launchMonth, iterations);
  const totalValue = totalPlanningPeriodValue(series);

  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    successMetrics: "",
    funnel: seed.funnel,
    market: seed.market,
    effort: seed.effort,
    adjustments,
    launchType: seed.launchType,
    launchMonth: seed.launchMonth,
    iterations,
    monthlyValue: Math.round(monthlyValue),
    totalValue: Math.round(totalValue),
    isSample: true,
    createdAt: new Date(2025, 0, 1).toISOString(),
  };
}

export const SAMPLE_PROJECTS: Project[] = SEEDS.map(buildSampleProject);
