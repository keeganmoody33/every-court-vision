import { AcquisitionProvider } from "@prisma/client";

import type { ProviderAdapter } from "@/lib/acquisition/types";

export const manualProvider: ProviderAdapter = {
  provider: AcquisitionProvider.MANUAL,
  async collect() {
    return {
      status: "disabled",
      activities: [],
      failureCode: "manual_import_required",
      failureReason: "This surface requires an owner export or manual JSON/CSV import.",
    };
  },
};
