import type { UseFieldArrayReturn } from "react-hook-form";

import { FormField } from "@/components/ui/FormField";
import { CheckboxInput, SelectInput, TextInput } from "@/components/ui/inputs";
import {
  FORM_LIMITS,
  LANGUAGE_LABELS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_LABELS,
  NOTIFICATION_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
} from "@/lib/constants";
import type { OnboardingFormValues } from "@/lib/validation/onboarding-schema";
import type { StepProps } from "@/components/forms/steps/shared";
import { fieldId } from "@/components/forms/steps/shared";

interface TeamPreferencesStepProps extends StepProps {
  team: UseFieldArrayReturn<OnboardingFormValues, "team", "id">;
}

/** Step 3: the dynamic team array plus preferences. */
export function TeamPreferencesStep({ form, team }: TeamPreferencesStepProps) {
  const { register, formState: { errors } } = form;

  return (
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
            <TextInput id={fieldId(`team.${index}.name`)} {...register(`team.${index}.name`)} />
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
            <SelectInput id={fieldId(`team.${index}.role`)} {...register(`team.${index}.role`)}>
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
        <SelectInput id={fieldId("preferences.language")} {...register("preferences.language")}>
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {LANGUAGE_LABELS[option]}
            </option>
          ))}
        </SelectInput>
      </FormField>
    </section>
  );
}
