import type { Submission } from "@/lib/submissions/types";
import type { OnboardingFormValues } from "@/lib/validation/onboarding-schema";

/**
 * In-memory submission store.
 *
 * This module is intentionally the persistence boundary: Server Actions
 * and cached queries talk to this store, never to a raw array scattered
 * through components. Swapping it for a database later means changing
 * this file (and `queries.ts`) only — the action's contract, the
 * result type and the UI stay untouched.
 *
 * Note on scope: an in-memory store is per server instance. That is
 * fine for this module's demo/dev purpose and is stated in the README;
 * it is not a claim of durable production storage.
 */

const submissions: Submission[] = [];

export function listSubmissions(): Submission[] {
  // Newest first; return a copy so callers cannot mutate the store.
  return [...submissions].reverse();
}

export function addSubmission(values: OnboardingFormValues): Submission {
  const submission: Submission = {
    id: crypto.randomUUID(),
    values,
    createdAt: new Date().toISOString(),
  };
  submissions.push(submission);
  return submission;
}

export function findSubmissionByEmail(email: string): Submission | undefined {
  const normalized = email.trim().toLowerCase();
  return submissions.find(
    (submission) => submission.values.personal.email.trim().toLowerCase() === normalized,
  );
}

/**
 * Test/support utility only. The action test suite resets state between
 * cases through this function instead of reaching into the array.
 */
export function resetSubmissionStore(): void {
  submissions.length = 0;
}
