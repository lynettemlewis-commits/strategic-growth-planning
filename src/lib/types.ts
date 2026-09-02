import { z } from "zod";

/**
 * Core data model for the Growth Planning Engine.
 *
 * This is a plain, dependency-free type + Zod schema — no ORM, no database.
 * All project data lives in the visitor's browser (see projectStore.ts) and
 * never leaves it unless the visitor explicitly exports it.
 */

export const MARKETS = ["north_america", "australia"] as const;
export type Market = (typeof MARKETS)[number];

export const FUNNEL_STAGES = [
  "demand",
  "supply",
  "website_booking",
  "booking_confirmation",
  "retention",
] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const LAUNCH_TYPES = ["single", "iterative"] as const;
export type LaunchType = (typeof LAUNCH_TYPES)[number];

/** One phase of an iterative/phased launch. */
export const iterationSchema = z.object({
  name: z.string(),
  /** 1-12, position within the January–December planning calendar. */
  launchMonth: z.number().int().min(1).max(12),
  /** Percentage (0-100) of the project's full value this phase contributes. */
  valuePercentage: z.number().min(0).max(100),
});
export type Iteration = z.infer<typeof iterationSchema>;

/** The adjustments a project proposes to the market's baseline metrics. */
export const metricAdjustmentsSchema = z.object({
  trafficChange: z.number().default(0),
  conversionRateChange: z.number().default(0),
  acceptanceRateChange: z.number().default(0),
  retentionRateChange: z.number().default(0),
  repeatBookingsChange: z.number().default(0),
});
export type MetricAdjustments = z.infer<typeof metricAdjustmentsSchema>;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  successMetrics: z.string().optional().default(""),
  funnel: z.enum(FUNNEL_STAGES),
  market: z.enum(MARKETS),
  effort: z.number().int().min(1).max(10),
  adjustments: metricAdjustmentsSchema,
  launchType: z.enum(LAUNCH_TYPES),
  /** For a single launch: 1-12 within the January–December planning calendar. */
  launchMonth: z.number().int().min(1).max(12),
  iterations: z.array(iterationSchema).optional().default([]),
  /** Native-currency monthly revenue impact once fully ramped (from the growth model). */
  monthlyValue: z.number(),
  /** Native-currency total impact across the 12-month planning period. */
  totalValue: z.number(),
  isSample: z.boolean().default(false),
  createdAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

/** Shape used when creating a project, before id/createdAt are assigned. */
export type NewProject = Omit<Project, "id" | "createdAt">;

export const projectListSchema = z.array(projectSchema);
