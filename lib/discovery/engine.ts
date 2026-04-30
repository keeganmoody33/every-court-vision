// Exhaustive surface discovery engine for Every.to employees

import { randomUUID } from "node:crypto";

import { sql } from "@/lib/db-neon";

export type SurfaceTarget =
  | "x"
  | "linkedin"
  | "github"
  | "substack"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "product_hunt"
  | "personal_site"
  | "podcast"
  | "newsletter"
  | "medium"
  | "devto"
  | "dribbble"
  | "figma"
  | "twitch"
  | "calendly"
  | "discord"
  | "book"
  | "external_interview"
  | "other";

export const SURFACE_TARGETS: SurfaceTarget[] = [
  "x",
  "linkedin",
  "github",
  "substack",
  "youtube",
  "instagram",
  "tiktok",
  "product_hunt",
  "personal_site",
  "podcast",
  "newsletter",
  "medium",
  "devto",
  "dribbble",
  "figma",
  "twitch",
  "calendly",
  "discord",
  "book",
  "external_interview",
  "other",
];

function isSurfaceTarget(value: string): value is SurfaceTarget {
  return (SURFACE_TARGETS as readonly string[]).includes(value);
}

export function parseSurfaceFilter(param: string | null): SurfaceTarget[] | undefined {
  const trimmed = param?.trim();
  if (!trimmed) return undefined;
  if (!isSurfaceTarget(trimmed)) return undefined;
  return [trimmed];
}

interface DiscoveryResult {
  surface: SurfaceTarget;
  handle?: string;
  url?: string;
  status: "verified" | "likely" | "absent" | "unknown";
  confidenceScore: number;
  evidence: string[];
  discoveryMethod: string;
}

interface EmployeeDiscoveryInput {
  id: string;
  name: string;
  role?: string;
  knownHandles?: Partial<Record<SurfaceTarget, string>>;
}

const searchQueries: Record<SurfaceTarget, (name: string, handle?: string) => string[]> =
  {
    x: (name, handle) => [
      handle ? `site:twitter.com/${handle}` : `site:twitter.com "${name}"`,
      handle ? `site:x.com/${handle}` : `site:x.com "${name}"`,
    ],
    linkedin: (name, handle) => [
      `site:linkedin.com/in "${name}"`,
      handle ? `site:linkedin.com/in/${handle}` : "",
    ].filter(Boolean),
    github: (name, handle) => [
      handle ? `site:github.com/${handle}` : `site:github.com "${name}"`,
    ],
    substack: (name, handle) => [
      handle ? `site:${handle}.substack.com` : `site:substack.com "${name}"`,
      `site:substack.com "${name.split(" ")[0]}" "${name.split(" ").slice(1).join(" ")}"`,
    ],
    youtube: (name, handle) => [
      `site:youtube.com/@ "${name}"`,
      `site:youtube.com/c "${name}"`,
      handle ? `site:youtube.com/@${handle}` : "",
    ].filter(Boolean),
    instagram: (name, handle) => [
      handle ? `site:instagram.com/${handle}` : `site:instagram.com "${name}"`,
    ],
    tiktok: (name, handle) => [
      handle ? `site:tiktok.com/@${handle}` : `site:tiktok.com "${name}"`,
    ],
    product_hunt: (name, handle) => [
      `site:producthunt.com "${name}"`,
      handle ? `site:producthunt.com/@${handle}` : "",
    ].filter(Boolean),
    personal_site: (name, _handle) => [
      `"${name}" portfolio OR about OR blog`,
      `"${name}" ${name.toLowerCase().replace(/ /g, "")}.com`,
    ],
    podcast: (name, _handle) => [
      `"${name}" podcast host OR guest`,
      `site:spotify.com "${name}"`,
      `site:apple.com/podcasts "${name}"`,
    ],
    newsletter: (name, _handle) => [
      `"${name}" newsletter`,
      `site:substack.com "${name}"`,
      `site:beehiiv.com "${name}"`,
    ],
    medium: (name, handle) => [
      handle ? `site:medium.com/@${handle}` : `site:medium.com "${name}"`,
    ],
    devto: (name, handle) => [
      handle ? `site:dev.to/${handle}` : `site:dev.to "${name}"`,
    ],
    dribbble: (name, handle) => [
      handle ? `site:dribbble.com/${handle}` : `site:dribbble.com "${name}"`,
    ],
    figma: (name, handle) => [
      `site:figma.com/@${handle || name}`,
      `site:figma.com/community "${name}"`,
    ],
    twitch: (name, handle) => [
      handle ? `site:twitch.tv/${handle}` : `site:twitch.tv "${name}"`,
    ],
    calendly: (name, handle) => [
      `site:calendly.com "${name}"`,
      `site:calendly.com/${handle || name.toLowerCase().replace(/ /g, "")}`,
    ],
    discord: (name, _handle) => [
      `site:discord.gg "${name}"`,
      `"${name}" discord server`,
    ],
    book: (name, _handle) => [
      `"${name}" author`,
      `site:amazon.com "${name}"`,
      `site:goodreads.com "${name}"`,
    ],
    external_interview: (name, _handle) => [
      `"${name}" interview`,
      `"${name}" podcast guest`,
      `"${name}" fireside chat`,
    ],
    other: (name) => [`"${name}"`],
  };

async function searchForSurface(
  surface: SurfaceTarget,
  employee: EmployeeDiscoveryInput,
): Promise<DiscoveryResult | null> {
  const queries = searchQueries[surface](employee.name, employee.knownHandles?.[surface]).filter(
    (q) => q.length > 0,
  );

  return {
    surface,
    handle: employee.knownHandles?.[surface],
    status: "unknown",
    confidenceScore: 0,
    evidence: queries,
    discoveryMethod: "search_api",
  };
}

export async function discoverEmployeeSurfaces(
  employee: EmployeeDiscoveryInput,
  surfaces?: SurfaceTarget[],
): Promise<DiscoveryResult[]> {
  const list = surfaces?.length ? surfaces : SURFACE_TARGETS;
  const results: DiscoveryResult[] = [];

  for (const surface of list) {
    try {
      const result = await searchForSurface(surface, employee);
      if (result) results.push(result);
    } catch (err) {
      console.error(`Discovery failed for ${employee.name} on ${surface}:`, err);
    }
  }

  return results;
}

export async function discoverAllEmployees(
  employees: EmployeeDiscoveryInput[],
  surfaces?: SurfaceTarget[],
): Promise<Record<string, DiscoveryResult[]>> {
  const allResults: Record<string, DiscoveryResult[]> = {};

  for (const employee of employees) {
    console.log(`Discovering surfaces for ${employee.name}...`);
    allResults[employee.id] = await discoverEmployeeSurfaces(employee, surfaces);
  }

  return allResults;
}

export async function saveDiscoveryResults(
  employeeId: string,
  results: DiscoveryResult[],
): Promise<void> {
  for (const result of results) {
    const handleKey = result.handle?.trim() || "_none_";
    const id = randomUUID();
    const label = result.surface.replace(/_/g, " ").toUpperCase();
    const evidence = result.evidence.length ? result.evidence : [];
    const now = new Date();

    await sql`
      INSERT INTO "DiscoveredSurface" (
        id, "employeeId", surface, label, handle, url, status,
        "confidenceScore", evidence, "discoveryMethod",
        "discoveredAt", "lastVerifiedAt", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${employeeId}, ${result.surface}, ${label}, ${handleKey},
        ${result.url ?? null}, ${result.status}, ${result.confidenceScore},
        ${evidence}, ${result.discoveryMethod},
        ${now}, ${now}, ${now}, ${now}
      )
      ON CONFLICT ("employeeId", surface, handle) DO UPDATE SET
        status = EXCLUDED.status,
        url = EXCLUDED.url,
        "confidenceScore" = EXCLUDED."confidenceScore",
        evidence = EXCLUDED.evidence,
        "discoveryMethod" = EXCLUDED."discoveryMethod",
        "lastVerifiedAt" = EXCLUDED."lastVerifiedAt",
        handle = EXCLUDED.handle,
        "updatedAt" = EXCLUDED."updatedAt"
    `;
  }
}
