import { SAMPLE_PROJECTS } from "./sampleProjects";
import { projectListSchema, type NewProject, type Project } from "./types";

/**
 * The single project data store for the whole application.
 *
 * Everything lives in `sessionStorage` — nothing is sent to, or persisted
 * in, a server. Each browser tab/session gets its own isolated project
 * list, seeded with the sample portfolio on first load. No account, no
 * login, no shared global store: this directly fixes the historical app's
 * split between a server-backed store (used by some screens) and
 * sessionStorage (used by others) by giving every screen one shared source
 * of truth.
 */

const STORAGE_KEY = "growth_planning_engine.projects.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// `getAllProjects` is used as the `getSnapshot` for React's
// `useSyncExternalStore` (see hooks/use-projects.ts). That hook requires
// `getSnapshot` to return a REFERENCE-STABLE value when nothing has
// changed — calling `JSON.parse` fresh on every read would return a new
// array/object each time even when the underlying data is identical,
// which makes React think the store changes on every render and throws
// "Maximum update depth exceeded". This in-memory cache is what makes
// that safe: it's only invalidated (recomputed) when we actually write.
let cache: Project[] | null = null;

function readRaw(): Project[] | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) return null; // never initialized this session
  try {
    const parsed = JSON.parse(raw);
    return projectListSchema.parse(parsed);
  } catch {
    // Corrupt/unrecognized data — treat as empty rather than throwing.
    return [];
  }
}

function writeRaw(projects: Project[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  cache = projects;
  notify();
}

/** Returns all projects (sample + user-created), seeding samples on first use this session. */
export function getAllProjects(): Project[] {
  if (cache !== null) return cache;
  const existing = readRaw();
  if (existing === null) {
    writeRaw(SAMPLE_PROJECTS);
    return SAMPLE_PROJECTS;
  }
  cache = existing;
  return cache;
}

export function getProject(id: string): Project | undefined {
  return getAllProjects().find((p) => p.id === id);
}

export function addProject(newProject: NewProject): Project {
  const project: Project = {
    ...newProject,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  const projects = [...getAllProjects(), project];
  writeRaw(projects);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = getAllProjects().map((p) => (p.id === id ? { ...p, ...updates, id: p.id } : p));
  writeRaw(projects);
}

export function deleteProject(id: string): void {
  writeRaw(getAllProjects().filter((p) => p.id !== id));
}

/** Client-side export: a JSON file the visitor can save and re-import later (or into a fresh session). */
export function exportProjectsAsJSON(): string {
  const projects = getAllProjects();
  return JSON.stringify({ exportedAt: new Date().toISOString(), projects }, null, 2);
}

export function downloadProjectsExport(): void {
  const json = exportProjectsAsJSON();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `growth-plan-export-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  imported: number;
  total: number;
  errors: string[];
}

/**
 * Client-side import, entirely against this session store. Accepts either
 * this app's own export shape (`{ projects: [...] }`) or a raw array.
 *
 * Historical exports from the original private tool use a different schema
 * (server-assigned ids, an `owner` field, "Month Year" launch strings, the
 * old 6-value funnel enum) and are not compatible — that's expected, not a
 * bug: we don't add compatibility shims for the old internal format, to
 * avoid reintroducing old assumptions into the public schema.
 */
export function importProjectsFromJSON(json: string): ImportResult {
  const errors: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { imported: 0, total: 0, errors: ["File is not valid JSON."] };
  }

  const candidateArray = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).projects)
      ? (raw as any).projects
      : null;

  if (!candidateArray) {
    return {
      imported: 0,
      total: 0,
      errors: ["Expected a project array, or an object with a `projects` array."],
    };
  }

  const existing = getAllProjects();
  const imported: Project[] = [];

  for (const [index, entry] of candidateArray.entries()) {
    const result = projectListSchema.element.safeParse({
      ...entry,
      // Always assign a fresh id/createdAt on import so re-importing the
      // same file, or importing into a session that already has projects,
      // never collides with existing ids.
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
    });
    if (result.success) {
      imported.push(result.data);
    } else {
      errors.push(`Entry ${index + 1}: ${result.error.issues[0]?.message ?? "invalid project"}`);
    }
  }

  writeRaw([...existing, ...imported]);
  return { imported: imported.length, total: candidateArray.length, errors };
}
