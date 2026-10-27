import { FormField } from "@/components/ui/FormField";
import { CheckboxInput, SelectInput, TextInput } from "@/components/ui/inputs";
import { COMPANY_SIZE_LABELS, COMPANY_SIZE_OPTIONS } from "@/lib/constants";
import type { StepProps } from "@/components/forms/steps/shared";
import { fieldId } from "@/components/forms/steps/shared";

/** Step 1: account details plus the conditional organization block. */
export function PersonalOrganizationStep({ form }: StepProps) {
  const { register, watch, formState: { errors } } = form;
  const hasOrganization = watch("organization.hasOrganization");

  return (
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
            <TextInput id={fieldId("organization.name")} {...register("organization.name")} />
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
  );
}
