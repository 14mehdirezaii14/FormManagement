import type { UseFormReturn } from "react-hook-form";

import type { OnboardingFormValues } from "@/lib/validation/onboarding-schema";

/**
 * Shared contract for every wizard step.
 *
 * The parent form owns the single `useForm` instance (so "Back" never
 * loses input and the final submit sends the whole payload); steps
 * only receive that instance. They never create their own form, so
 * splitting a step out cannot change validation or submission
 * behaviour — it only moves JSX.
 */
export interface StepProps {
  form: UseFormReturn<OnboardingFormValues>;
}

/** Stable, HTML-safe id for a dotted field path, e.g. `personal.fullName`. */
export function fieldId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, "-");
}
