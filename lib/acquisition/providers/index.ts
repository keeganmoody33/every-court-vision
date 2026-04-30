import { AcquisitionProvider } from "@/lib/db-enums";

import type { ProviderAdapter } from "@/lib/acquisition/types";
import { githubProvider } from "@/lib/acquisition/providers/github";
import { instagramProvider } from "@/lib/acquisition/providers/instagram";
import { linkedInProvider } from "@/lib/acquisition/providers/linkedin";
import { manualProvider } from "@/lib/acquisition/providers/manual";
import { parallelProvider } from "@/lib/acquisition/providers/parallel";
import { rssProvider } from "@/lib/acquisition/providers/rss";
import { spiderProvider } from "@/lib/acquisition/providers/spider";
import { xProvider } from "@/lib/acquisition/providers/x";
import { youtubeProvider } from "@/lib/acquisition/providers/youtube";

const providers: Record<AcquisitionProvider, ProviderAdapter> = {
  X_API: xProvider,
  LINKEDIN_API: linkedInProvider,
  GITHUB_API: githubProvider,
  YOUTUBE_API: youtubeProvider,
  RSS: rssProvider,
  SPIDER: spiderProvider,
  PARALLEL: parallelProvider,
  MANUAL: manualProvider,
  INSTAGRAM_GRAPH: instagramProvider,
};

export function providerFor(provider: AcquisitionProvider) {
  return providers[provider];
}
