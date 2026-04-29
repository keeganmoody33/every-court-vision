import { acquireSurface } from "@/inngest/functions/acquire-surface";
import { metricRecompute } from "@/inngest/functions/metric-recompute";
import { recategorizePosts } from "@/inngest/functions/recategorize";

export const functions = [acquireSurface, recategorizePosts, metricRecompute];
