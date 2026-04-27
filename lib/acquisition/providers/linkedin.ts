import { AcquisitionProvider } from "@prisma/client";

import { env } from "@/lib/env";
import type { ProviderAdapter } from "@/lib/acquisition/types";

export const linkedInProvider: ProviderAdapter = {
  provider: AcquisitionProvider.LINKEDIN_API,
  async collect() {
    if (!env.LINKEDIN_ACCESS_TOKEN) {
      return {
        status: "disabled",
        activities: [],
        failureCode: "linkedin_manual_required",
        failureReason: "LinkedIn personal activity needs approved API access or owner-provided manual export.",
      };
    }
    return {
      status: "disabled",
      activities: [],
      failureCode: "linkedin_provider_not_configured",
      failureReason: "LinkedIn API token is present, but member/organization URN mapping has not been configured yet.",
    };
  },
};
