import type { OnboardingFormValues } from "@/lib/validation/onboarding-schema";

/**
 * A persisted submission. `isOptimistic` exists only for the client-side
 * optimistic row: the server never creates one, and the list renders it
 * with a "Saving…" badge until the real record replaces it.
 */
export interface Submission {
  id: string;
  values: OnboardingFormValues;
  createdAt: string;
  isOptimistic?: boolean;
}

/**
 * Discriminated result returned by every Server Action in this module.
 *
 * Consumers must branch on `ok` — they cannot mistake a validation
 * failure for a transient server failure, and vice versa:
 * - `validation`: the payload failed server-side Zod parsing (or a
 *   business rule such as a duplicate e-mail). `fieldErrors` maps
 *   field paths to messages and can be fed back into react-hook-form.
 * - `server`: something went wrong after validation (store failure,
 *   unexpected exception). The UI shows a generic, retryable alert
 *   and must NOT clear the user's input.
 */
export type FormActionResult =
  | { ok: true; submission: Submission }
  | {
      ok: false;
      error: {
        type: "validation";
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    }
  | {
      ok: false;
      error: { type: "server"; message: string };
    };

/** Error shown for transient failures; never leaks internals to the UI. */
export const SERVER_ERROR_MESSAGE =
  "Something went wrong while saving. Your answers are still here — please try again.";
