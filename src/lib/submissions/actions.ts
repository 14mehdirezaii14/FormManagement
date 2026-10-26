"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { ROUTES, SUBMISSIONS_CACHE_TAG } from "@/lib/constants";
import { addSubmission, findSubmissionByEmail } from "@/lib/submissions/store";
import { SERVER_ERROR_MESSAGE, type FormActionResult } from "@/lib/submissions/types";
import { onboardingSchema } from "@/lib/validation/onboarding-schema";

/**
 * Revalidation is best-effort outside a real request (for example when
 * this action is imported by a unit test). Swallowing that specific
 * failure keeps the action testable without weakening production
 * behaviour: inside a real Server Action call both calls succeed.
 */
function safeRevalidate(): void {
  try {
    revalidatePath(ROUTES.home);
    revalidateTag(SUBMISSIONS_CACHE_TAG);
  } catch {
    // Intentionally ignored: see the comment above.
  }
}

/**
 * Submit the onboarding form.
 *
 * Pipeline, in order:
 * 1. Server-side Zod `safeParse` — the client already validated, but
 *    the server never trusts it. A mismatch returns a structured
 *    `validation` result, not a thrown error, so the client can map
 *    `fieldErrors` back onto the form.
 * 2. Business rule: one submission per account e-mail.
 * 3. Persist, then invalidate both the page path and the submissions
 *    cache tag, so the server-rendered list refreshes on next render.
 * 4. Any unexpected exception becomes a `server` result; the client
 *    keeps the user's input and shows a retryable alert.
 */
export async function submitForm(data: unknown): Promise<FormActionResult> {
  const parsed = onboardingSchema.safeParse(data);

  if (!parsed.success) {
    // Map each issue to its dotted path (e.g. "addresses.0.city") so
    // the client can feed it straight back into react-hook-form's
    // setError. `flatten()` alone loses nested paths, so it is not
    // sufficient for a nested schema like this one.
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path) {
        fieldErrors[path] = [...(fieldErrors[path] ?? []), issue.message];
      }
    }
    return {
      ok: false,
      error: {
        type: "validation",
        message: "Please fix the highlighted fields and try again.",
        fieldErrors,
      },
    };
  }

  try {
    if (findSubmissionByEmail(parsed.data.personal.email)) {
      return {
        ok: false,
        error: {
          type: "validation",
          message: "A submission already exists for this email address.",
          fieldErrors: { "personal.email": ["A submission already exists for this email address."] },
        },
      };
    }

    const submission = addSubmission(parsed.data);
    safeRevalidate();
    return { ok: true, submission };
  } catch {
    return { ok: false, error: { type: "server", message: SERVER_ERROR_MESSAGE } };
  }
}
