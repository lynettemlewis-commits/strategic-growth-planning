import { useSyncExternalStore } from "react";
import { getAllProjects, subscribe } from "@/lib/projectStore";
import type { Project } from "@/lib/types";

/**
 * Reactive view of the shared session project store. Every screen that
 * reads projects (Create Project, Effort/Impact, Portfolio Forecast) uses
 * this same hook, so a project created or edited anywhere is immediately
 * visible everywhere else — no manual cache invalidation required.
 */
export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, getAllProjects, getAllProjects);
}
