import { beforeEach, describe, expect, it, vi } from "vitest";

// next/cache is a server-only module; the action wraps its calls, so
// plain spies are enough to prove the revalidation contract.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { revalidatePath, revalidateTag } from "next/cache";

import { submitForm } from "@/lib/submissions/actions";
import { resetSubmissionStore } from "@/lib/submissions/store";
import {
  defaultOnboardingValues,
  type OnboardingFormValues,
} from "@/lib/validation/onboarding-schema";

function validValues(): OnboardingFormValues {
  return {
    ...structuredClone(defaultOnboardingValues),
    personal: { fullName: "Mehdi Rezaii", email: "mehdi@example.com", phone: "" },
    addresses: [
      {
        label: "Head office",
        street: "1 Main Street",
        city: "Tehran",
        postalCode: "12345",
        country: "Iran",
        isPrimary: true,
      },
    ],
    termsAccepted: true as never,
  };
}

describe("submitForm Server Action", () => {
  beforeEach(() => {
    resetSubmissionStore();
    vi.clearAllMocks();
  });

  it("persists a valid submission and revalidates path and tag", async () => {
    const result = await submitForm(validValues());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.submission.values.personal.email).toBe("mehdi@example.com");
    }
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidateTag).toHaveBeenCalledWith("submissions");
  });

  it("returns a structured validation result — never a throw — for bad data", async () => {
    const result = await submitForm({ personal: { email: "bad" } });

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.type === "validation") {
      expect(result.error.fieldErrors?.["personal.fullName"]).toBeDefined();
    } else {
      throw new Error("Expected a validation result");
    }
  });

  it("rejects a second submission for the same email", async () => {
    expect((await submitForm(validValues())).ok).toBe(true);
    const duplicate = await submitForm(validValues());

    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.error.message).toMatch(/already exists/);
    }
  });
});
