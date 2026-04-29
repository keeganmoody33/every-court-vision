// lib/discovery/engine.ts
// Exhaustive surface discovery engine for Every.to employees

import { prisma } from "@/lib/prisma";

export type SurfaceTarget = 
  | "x" | "linkedin" | "github" | "substack" | "youtube" | "instagram" 
  | "tiktok" | "product_hunt" | "personal_site" | "podcast" | "newsletter"
  | "medium" | "devto" | "dribbble" | "figma" | "twitch" | "calendly"
  | "discord" | "book" | "external_interview" | "other";

interface DiscoveryResult {
  surface: SurfaceTarget;
  handle?: string;
  url?: string;
  status: "verified" | "likely" | "absent";
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

// === SEARCH QUERY BUILDERS ===
// Each surface type has a specific search strategy

const searchQueries: Record<SurfaceTarget, (name: string, handle?: string) => string[]> = {
  x: (name, handle) => [
    handle ? `site:twitter.com/${handle}` : `site:twitter.com "${name}"`,
    handle ? `site:x.com/${handle}` : `site:x.com "${name}"`,
  ],
  linkedin: (name, handle) => [
    `site:linkedin.com/in "${name}"`,
    handle ? `site:linkedin.com/in/${handle}` : ``,
  ],
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
    handle ? `site:youtube.com/@${handle}` : ``,
  ],
  instagram: (name, handle) => [
    handle ? `site:instagram.com/${handle}` : `site:instagram.com "${name}"`,
  ],
  tiktok: (name, handle) => [
    handle ? `site:tiktok.com/@${handle}` : `site:tiktok.com "${name}"`,
  ],
  product_hunt: (name, handle) => [
    `site:producthunt.com "${name}"`,
    handle ? `site:producthunt.com/@${handle}` : ``,
  ],
  personal_site: (name, handle) => [
    `"${name}" "portfolio" OR "about" OR "blog"`,
    `"${name}" "${name.toLowerCase().replace(/ /g, "")}.com"`,
  ],
  podcast: (name, handle) => [
    `"${name}" podcast host OR guest`,
    `site:spotify.com "${name}"`,
    `site:apple.com/podcasts "${name}"`,
  ],
  newsletter: (name, handle) => [
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
  discord: (name, handle) => [
    `site:discord.gg "${name}"`,
    `"${name}" discord server`,
  ],
  book: (name, handle) => [
    `"${name}" author`,
    `site:amazon.com "${name}"`,
    `site:oreilly.com "${name}"`,
    `site:goodreads.com "${name}"`,
  ],
  external_interview: (name, handle) => [
    `"${name}" interview`,
    `"${name}" podcast guest`,
    `"${name}" "fireside chat"`,
  ],
  other: (name, handle) => [
    `"${name}"`,
  ],
};

// === DISCOVERY METHODS ===

async function searchForSurface(
  surface: SurfaceTarget,
  employee: EmployeeDiscoveryInput,
): Promise<DiscoveryResult | null> {
  const queries = searchQueries[surface](employee.name, employee.knownHandles?.[surface])
    .filter(q => q.length > 0);

  // In production, this calls a search API (Serper, Google Custom Search, or Spider.cloud)
  // For now, we return a structured result that can be filled by the search layer

  return {
    surface,
    handle: employee.knownHandles?.[surface],
    status: "unknown",
    confidenceScore: 0,
    evidence: queries,
    discoveryMethod: "search_api",
  };
}

// === BATCH DISCOVERY ===

export async function discoverEmployeeSurfaces(
  employee: EmployeeDiscoveryInput,
  surfaces: SurfaceTarget[] = Object.keys(searchQueries) as SurfaceTarget[],
): Promise<DiscoveryResult[]> {
  const results: DiscoveryResult[] = [];

  for (const surface of surfaces) {
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
): Promise<Record<string, DiscoveryResult[]>> {
  const allResults: Record<string, DiscoveryResult[]> = {};

  for (const employee of employees) {
    console.log(`Discovering surfaces for ${employee.name}...`);
    allResults[employee.id] = await discoverEmployeeSurfaces(employee);
  }

  return allResults;
}

// === PERSISTENCE ===

export async function saveDiscoveryResults(
  employeeId: string,
  results: DiscoveryResult[],
): Promise<void> {
  for (const result of results) {
    await prisma.discoveredSurface.upsert({
      where: {
        employeeId_surface_handle: {
          employeeId,
          surface: result.surface,
          handle: result.handle || "_none_",
        },
      },
      update: {
        status: result.status,
        url: result.url,
        confidenceScore: result.confidenceScore,
        evidence: result.evidence,
        discoveryMethod: result.discoveryMethod,
        lastVerifiedAt: new Date(),
      },
      create: {
        employeeId,
        surface: result.surface,
        label: result.surface.replace(/_/g, " ").toUpperCase(),
        handle: result.handle,
        url: result.url,
        status: result.status,
        confidenceScore: result.confidenceScore,
        evidence: result.evidence,
        discoveryMethod: result.discoveryMethod,
      },
    });
  }
}
