import type { UseFieldArrayReturn } from "react-hook-form";

import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/inputs";
import { FORM_LIMITS } from "@/lib/constants";
import type { OnboardingFormValues } from "@/lib/validation/onboarding-schema";
import type { StepProps } from "@/components/forms/steps/shared";
import { fieldId } from "@/components/forms/steps/shared";

interface AddressesStepProps extends StepProps {
  addresses: UseFieldArrayReturn<OnboardingFormValues, "addresses", "id">;
  onSetPrimaryAddress: (index: number) => void;
}

/** Step 2: the dynamic address field array. */
export function AddressesStep({ form, addresses, onSetPrimaryAddress }: AddressesStepProps) {
  const { register, watch, formState: { errors } } = form;

  return (
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
              onChange={() => onSetPrimaryAddress(index)}
            />
            Set as primary address
          </label>
        </fieldset>
      ))}
    </section>
  );
}
