"use client";

import { useOptimistic, useTransition } from "react";

import type { Submission } from "@/lib/submissions/types";
import type { OnboardingFormValues } from "@/lib/validation/onboarding-schema";

/**
 * Optimistic list hook.
 *
 * How rollback works (the part worth understanding): `useOptimistic`
 * shows `optimisticSubmissions` while a transition is pending, but the
 * *base* list only changes when the parent re-renders with new
 * server data (after a successful action + revalidation). If the
 * action fails, the base list never changes, so once the transition
 * settles React discards the optimistic row automatically — no manual
 * "remove the temp row" code, and no way for a failed row to linger
 * because a cleanup branch was forgotten.
 *
 * The hook also owns the transition: callers wrap the Server Action
 * call in `runWithOptimistic` and get `isPending` for free, which the
 * form uses for its submit button and the list uses for its badge.
 */
export function useOptimisticSubmissions(initialSubmissions: Submission[]) {
  const [isPending, startTransition] = useTransition();
  const [optimisticSubmissions, addOptimistic] = useOptimistic(
    initialSubmissions,
    (current: Submission[], next: Submission) => [next, ...current],
  );

  function runWithOptimistic(values: OnboardingFormValues, action: () => Promise<unknown>) {
    const optimisticSubmission: Submission = {
      id: `optimistic-${crypto.randomUUID()}`,
      values,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    // addOptimistic must be called inside the transition for React to
    // treat the optimistic value as temporary.
    startTransition(async () => {
      addOptimistic(optimisticSubmission);
      await action();
    });
  }

  return { optimisticSubmissions, isPending, runWithOptimistic };
}
