"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";

import { FormField } from "@/components/ui/FormField";
import { CheckboxInput, SelectInput, TextInput } from "@/components/ui/inputs";
import { SubmissionList } from "@/components/forms/SubmissionList";
import { useMultiStepForm } from "@/hooks/useMultiStepForm";
import { useOptimisticSubmissions } from "@/hooks/useOptimisticSubmissions";
import {
  COMPANY_SIZE_LABELS,
  COMPANY_SIZE_OPTIONS,
  FORM_LIMITS,
  LANGUAGE_LABELS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_LABELS,
  NOTIFICATION_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
} from "@/lib/constants";
import { submitForm } from "@/lib/submissions/actions";
import type { Submission } from "@/lib/submissions/types";
import {
  defaultOnboardingValues,
  onboardingSchema,
  STEP_FIELDS,
  type OnboardingFormValues,
} from "@/lib/validation/onboarding-schema";

const STEP_TITLES = ["Personal & organization", "Addresses", "Team & preferences", "Review"] as const;

function fieldId(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, "-");
}

/**
 * Multi-step onboarding form.
 *
 * - One `useForm` instance owns the whole payload, so "Back" never
 *   loses input and the final submit sends the full, typed object.
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

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaultOnboardingValues,
    mode: "onTouched",
  });

  const addresses = useFieldArray({ control, name: "addresses" });
  const team = useFieldArray({ control, name: "team" });
  const hasOrganization = watch("organization.hasOrganization");

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

        {currentStep === 0 ? (
          <section aria-label="Personal and organization" className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Personal &amp; organization</h2>
            <FormField
              id={fieldId("personal.fullName")}
              label="Full name"
              required
              error={errors.personal?.fullName?.message}
            >
              <TextInput id={fieldId("personal.fullName")} {...register("personal.fullName")} />
            </FormField>
            <FormField
              id={fieldId("personal.email")}
              label="Email"
              required
              error={errors.personal?.email?.message}
            >
              <TextInput
                id={fieldId("personal.email")}
                type="email"
                autoComplete="email"
                {...register("personal.email")}
              />
            </FormField>
            <FormField
              id={fieldId("personal.phone")}
              label="Phone (optional)"
              error={errors.personal?.phone?.message}
            >
              <TextInput
                id={fieldId("personal.phone")}
                type="tel"
                autoComplete="tel"
                {...register("personal.phone")}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <CheckboxInput {...register("organization.hasOrganization")} />
              I am registering on behalf of an organization
            </label>
            {hasOrganization ? (
              <>
                <FormField
                  id={fieldId("organization.name")}
                  label="Organization name"
                  required
                  error={errors.organization?.name?.message}
                >
                  <TextInput
                    id={fieldId("organization.name")}
                    {...register("organization.name")}
                  />
                </FormField>
                <FormField
                  id={fieldId("organization.size")}
                  label="Organization size"
                  required
                  error={errors.organization?.size?.message}
                >
                  <SelectInput
                    id={fieldId("organization.size")}
                    {...register("organization.size", {
                      setValueAs: (value: string) =>
                        value === "" ? undefined : (value as (typeof COMPANY_SIZE_OPTIONS)[number]),
                    })}
                  >
                    <option value="">Select a size</option>
                    {COMPANY_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {COMPANY_SIZE_LABELS[size]}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField
                  id={fieldId("organization.website")}
                  label="Website (optional)"
                  hint="Must start with http:// or https://"
                  error={errors.organization?.website?.message}
                >
                  <TextInput
                    id={fieldId("organization.website")}
                    type="url"
                    placeholder="https://example.com"
                    {...register("organization.website")}
                  />
                </FormField>
              </>
            ) : null}
          </section>
        ) : null}

        {currentStep === 1 ? (
          <section aria-label="Addresses" className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Addresses</h2>
              <button
                type="button"
                disabled={addresses.fields.length >= FORM_LIMITS.maxAddresses}
                onClick={() =>
                  addresses.append({
                    label: "",
                    street: "",
                    city: "",
                    postalCode: "",
                    country: "",
                    isPrimary: addresses.fields.length === 0,
                  })
                }
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                Add address
              </button>
            </div>
            {errors.addresses?.message ? (
              <p role="alert" className="text-sm text-red-600">
                {errors.addresses.message}
              </p>
            ) : null}
            {addresses.fields.map((field, index) => (
              <fieldset
                key={field.id}
                className="flex flex-col gap-4 rounded-md border border-gray-200 p-4"
              >
                <legend className="px-1 text-sm font-medium">
                  Address {index + 1}
                  {addresses.fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => addresses.remove(index)}
                      className="ml-3 text-sm font-normal text-red-600"
                      aria-label={`Remove address ${index + 1}`}
                    >
                      Remove
                    </button>
                  ) : null}
                </legend>
                <FormField
                  id={fieldId(`addresses.${index}.label`)}
                  label="Label"
                  required
                  error={errors.addresses?.[index]?.label?.message}
                >
                  <TextInput
                    id={fieldId(`addresses.${index}.label`)}
                    {...register(`addresses.${index}.label`)}
                  />
                </FormField>
                <FormField
                  id={fieldId(`addresses.${index}.street`)}
                  label="Street"
                  required
                  error={errors.addresses?.[index]?.street?.message}
                >
                  <TextInput
                    id={fieldId(`addresses.${index}.street`)}
                    {...register(`addresses.${index}.street`)}
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id={fieldId(`addresses.${index}.city`)}
                    label="City"
                    required
                    error={errors.addresses?.[index]?.city?.message}
                  >
                    <TextInput
                      id={fieldId(`addresses.${index}.city`)}
                      {...register(`addresses.${index}.city`)}
                    />
                  </FormField>
                  <FormField
                    id={fieldId(`addresses.${index}.postalCode`)}
                    label="Postal code"
                    required
                    error={errors.addresses?.[index]?.postalCode?.message}
                  >
                    <TextInput
                      id={fieldId(`addresses.${index}.postalCode`)}
                      {...register(`addresses.${index}.postalCode`)}
                    />
                  </FormField>
                </div>
                <FormField
                  id={fieldId(`addresses.${index}.country`)}
                  label="Country"
                  required
                  error={errors.addresses?.[index]?.country?.message}
                >
                  <TextInput
                    id={fieldId(`addresses.${index}.country`)}
                    {...register(`addresses.${index}.country`)}
                  />
                </FormField>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="primary-address"
                    checked={watch(`addresses.${index}.isPrimary`)}
                    onChange={() => setPrimaryAddress(index)}
                  />
                  Set as primary address
                </label>
              </fieldset>
            ))}
          </section>
        ) : null}

        {currentStep === 2 ? (
          <section aria-label="Team and preferences" className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Team members (optional)</h2>
              <button
                type="button"
                disabled={team.fields.length >= FORM_LIMITS.maxTeamMembers}
                onClick={() => team.append({ name: "", email: "", role: "member" })}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                Add team member
              </button>
            </div>
            {team.fields.map((field, index) => (
              <fieldset
                key={field.id}
                className="flex flex-col gap-4 rounded-md border border-gray-200 p-4"
              >
                <legend className="px-1 text-sm font-medium">
                  Team member {index + 1}
                  <button
                    type="button"
                    onClick={() => team.remove(index)}
                    className="ml-3 text-sm font-normal text-red-600"
                    aria-label={`Remove team member ${index + 1}`}
                  >
                    Remove
                  </button>
                </legend>
                <FormField
                  id={fieldId(`team.${index}.name`)}
                  label="Name"
                  required
                  error={errors.team?.[index]?.name?.message}
                >
                  <TextInput
                    id={fieldId(`team.${index}.name`)}
                    {...register(`team.${index}.name`)}
                  />
                </FormField>
                <FormField
                  id={fieldId(`team.${index}.email`)}
                  label="Email"
                  required
                  error={errors.team?.[index]?.email?.message}
                >
                  <TextInput
                    id={fieldId(`team.${index}.email`)}
                    type="email"
                    {...register(`team.${index}.email`)}
                  />
                </FormField>
                <FormField
                  id={fieldId(`team.${index}.role`)}
                  label="Role"
                  required
                  error={errors.team?.[index]?.role?.message}
                >
                  <SelectInput
                    id={fieldId(`team.${index}.role`)}
                    {...register(`team.${index}.role`)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              </fieldset>
            ))}
            <h2 className="text-lg font-semibold">Preferences</h2>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <CheckboxInput {...register("preferences.newsletter")} />
              Subscribe to the newsletter
            </label>
            <FormField
              id={fieldId("preferences.notifications")}
              label="Notifications"
              error={errors.preferences?.notifications?.message}
            >
              <SelectInput
                id={fieldId("preferences.notifications")}
                {...register("preferences.notifications")}
              >
                {NOTIFICATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {NOTIFICATION_LABELS[option]}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField
              id={fieldId("preferences.language")}
              label="Language"
              error={errors.preferences?.language?.message}
            >
              <SelectInput
                id={fieldId("preferences.language")}
                {...register("preferences.language")}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {LANGUAGE_LABELS[option]}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </section>
        ) : null}

        {currentStep === 3 ? (
          <section aria-label="Review" className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Review &amp; submit</h2>
            <p className="text-sm text-gray-600">
              Name: {watch("personal.fullName")} · Email: {watch("personal.email")} · Addresses:{" "}
              {watch("addresses").length} · Team members: {watch("team").length}
            </p>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <CheckboxInput {...register("termsAccepted")} />
              I accept the terms and conditions
            </label>
            {errors.termsAccepted?.message ? (
              <p role="alert" className="text-sm text-red-600">
                {errors.termsAccepted.message}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="mt-6 flex justify-between gap-3">
          <button
            type="button"
            disabled={isFirstStep}
            onClick={goBack}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Back
          </button>
          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Submit"}
            </button>
          )}
        </div>
      </form>

      <section aria-label="Submissions" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Submissions</h2>
        <SubmissionList submissions={optimisticSubmissions} />
      </section>
    </div>
  );
}
