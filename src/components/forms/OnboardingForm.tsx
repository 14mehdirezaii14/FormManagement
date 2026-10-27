"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";

import { SubmissionList } from "@/components/forms/SubmissionList";
import { AddressesStep } from "@/components/forms/steps/AddressesStep";
import { PersonalOrganizationStep } from "@/components/forms/steps/PersonalOrganizationStep";
import { ReviewStep } from "@/components/forms/steps/ReviewStep";
import { TeamPreferencesStep } from "@/components/forms/steps/TeamPreferencesStep";
import { WizardNavigation } from "@/components/forms/WizardNavigation";
import { useMultiStepForm } from "@/hooks/useMultiStepForm";
import { useOptimisticSubmissions } from "@/hooks/useOptimisticSubmissions";
import { submitForm } from "@/lib/submissions/actions";
import type { Submission } from "@/lib/submissions/types";
import {
  defaultOnboardingValues,
  onboardingSchema,
  STEP_FIELDS,
  type OnboardingFormValues,
} from "@/lib/validation/onboarding-schema";

const STEP_TITLES = ["Personal & organization", "Addresses", "Team & preferences", "Review"] as const;

/**
 * Multi-step onboarding form — now only an orchestrator.
 *
 * - One `useForm` instance owns the whole payload, so "Back" never
 *   loses input and the final submit sends the full, typed object.
 * - Each step is its own component under `steps/` and receives that
 *   form instance; moving a step's JSX out changed no behaviour.
 * - Each step validates only its own paths (`STEP_FIELDS`), so a user
 *   is never blocked by an error on a step they have not reached.
 * - Submission is optimistic: the new row appears in the list
 *   immediately (`useOptimisticSubmissions`), and React discards it
 *   automatically if the Server Action fails — see that hook.
 */
export function OnboardingForm({ initialSubmissions }: { initialSubmissions: Submission[] }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { currentStep, isFirstStep, isLastStep, goNext, goBack, goToStep } = useMultiStepForm(
    STEP_TITLES.length,
  );
  const { optimisticSubmissions, isPending, runWithOptimistic } =
    useOptimisticSubmissions(initialSubmissions);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaultOnboardingValues,
    mode: "onTouched",
  });
  const { control, handleSubmit, trigger, setValue, setError, reset } = form;

  const addresses = useFieldArray({ control, name: "addresses" });
  const team = useFieldArray({ control, name: "team" });

  async function handleNext(): Promise<void> {
    const fields = STEP_FIELDS[currentStep] as unknown as FieldPath<OnboardingFormValues>[];
    const valid = await trigger(fields);
    if (valid) goNext();
  }

  async function onSubmit(values: OnboardingFormValues): Promise<void> {
    setServerError(null);
    setSuccessMessage(null);
    runWithOptimistic(values, async () => {
      const result = await submitForm(values);
      if (!result.ok) {
        setServerError(result.error.message);
        if (result.error.type === "validation" && result.error.fieldErrors) {
          for (const [path, messages] of Object.entries(result.error.fieldErrors)) {
            const message = messages[0];
            if (message) {
              setError(path as FieldPath<OnboardingFormValues>, { type: "server", message });
            }
          }
        }
        return;
      }
      setSuccessMessage("Submission saved. Thank you!");
      reset(defaultOnboardingValues);
      goToStep(0);
    });
  }

  function setPrimaryAddress(index: number): void {
    addresses.fields.forEach((_, fieldIndex) => {
      setValue(`addresses.${fieldIndex}.isPrimary`, fieldIndex === index, {
        shouldValidate: true,
      });
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        aria-label="Onboarding form"
      >
        <ol className="mb-6 flex flex-wrap gap-2" aria-label="Form steps">
          {STEP_TITLES.map((title, index) => (
            <li
              key={title}
              aria-current={index === currentStep ? "step" : undefined}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                index === currentStep
                  ? "bg-blue-600 text-white"
                  : index < currentStep
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {index + 1}. {title}
            </li>
          ))}
        </ol>

        {serverError ? (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </p>
        ) : null}
        {successMessage ? (
          <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </p>
        ) : null}

        {currentStep === 0 ? <PersonalOrganizationStep form={form} /> : null}
        {currentStep === 1 ? (
          <AddressesStep form={form} addresses={addresses} onSetPrimaryAddress={setPrimaryAddress} />
        ) : null}
        {currentStep === 2 ? <TeamPreferencesStep form={form} team={team} /> : null}
        {currentStep === 3 ? <ReviewStep form={form} /> : null}

        <WizardNavigation
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isPending={isPending}
          onBack={goBack}
          onNext={handleNext}
        />
      </form>

      <section aria-label="Submissions" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Submissions</h2>
        <SubmissionList submissions={optimisticSubmissions} />
      </section>
    </div>
  );
}
