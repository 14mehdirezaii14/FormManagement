import { CheckboxInput } from "@/components/ui/inputs";
import type { StepProps } from "@/components/forms/steps/shared";

/** Step 4: a read-only summary plus the terms checkbox. */
export function ReviewStep({ form }: StepProps) {
  const { register, watch, formState: { errors } } = form;

  return (
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
  );
}
