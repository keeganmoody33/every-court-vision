import { acquireSurface } from "@/inngest/functions/acquire-surface";
import { metricRecompute } from "@/inngest/functions/metric-recompute";
import { recategorize } from "@/inngest/functions/recategorize";

export const functions = [acquireSurface, recategorize, metricRecompute];
