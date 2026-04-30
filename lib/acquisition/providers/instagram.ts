import { AcquisitionProvider } from "@/lib/db-enums";

import { env } from "@/lib/env";
import type { ProviderAdapter } from "@/lib/acquisition/types";

export const instagramProvider: ProviderAdapter = {
  provider: AcquisitionProvider.INSTAGRAM_GRAPH,
  async collect() {
    if (!env.INSTAGRAM_ACCESS_TOKEN) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "instagram_manual_required",
        failureReason: "Instagram media needs Graph API authorization for a professional account or manual export.",
      };
    }
    return {
      status: "disabled",
      activities: [],
      failureCode: "instagram_business_discovery_missing",
      failureReason: "Instagram token is present, but app-user IG account and target username mapping are not configured yet.",
    };
  },
};
