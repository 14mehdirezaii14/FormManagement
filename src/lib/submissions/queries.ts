import { unstable_cache } from "next/cache";

import { SUBMISSIONS_CACHE_TAG } from "@/lib/constants";
import { listSubmissions } from "@/lib/submissions/store";
import type { Submission } from "@/lib/submissions/types";

/**
 * Cached read path for the server-rendered list.
 *
 * `unstable_cache` with the submissions tag means the home page does
 * not re-read the store on every render, yet `submitForm` can bust
 * exactly this cache with `revalidateTag(SUBMISSIONS_CACHE_TAG)` —
 * tag-based invalidation, not a blanket `revalidatePath` for every
 * mutation, and no manual cache bookkeeping in components.
 */
export const getSubmissions = unstable_cache(
  async (): Promise<Submission[]> => listSubmissions(),
  ["submissions-list"],
  { tags: [SUBMISSIONS_CACHE_TAG] },
);
