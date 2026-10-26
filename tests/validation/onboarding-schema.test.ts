import { describe, expect, it } from "vitest";

import {
  defaultOnboardingValues,
  onboardingSchema,
  type OnboardingFormValues,
} from "@/lib/validation/onboarding-schema";

function validValues(overrides: Partial<OnboardingFormValues> = {}): OnboardingFormValues {
  const base: OnboardingFormValues = {
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
  // Overrides must win: nested objects merge, arrays replace wholesale
  // (an empty `addresses: []` override is a meaningful test case, so
  // it must not fall back to the base value via `||`).
  return {
    ...base,
    ...overrides,
    personal: { ...base.personal, ...overrides.personal },
    organization: { ...base.organization, ...overrides.organization },
    preferences: { ...base.preferences, ...overrides.preferences },
    addresses: overrides.addresses ?? base.addresses,
    team: overrides.team ?? base.team,
  };
}

function errorPaths(result: ReturnType<typeof onboardingSchema.safeParse>): string[] {
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("onboardingSchema", () => {
  it("accepts a complete, valid payload", () => {
    expect(onboardingSchema.safeParse(validValues()).success).toBe(true);
  });

  it("rejects a short name, an invalid email and a missing primary address", () => {
    const result = onboardingSchema.safeParse(
      validValues({
        personal: { fullName: "M", email: "not-an-email", phone: "" },
        addresses: [
          {
            label: "Office",
            street: "1 Main Street",
            city: "Tehran",
            postalCode: "12345",
            country: "Iran",
            isPrimary: false,
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
    const paths = errorPaths(result);
    expect(paths).toContain("personal.fullName");
    expect(paths).toContain("personal.email");
    expect(paths).toContain("addresses");
  });

  it("requires organization name and size only when hasOrganization is true", () => {
    const withoutOrg = onboardingSchema.safeParse(
      validValues({ organization: { hasOrganization: false, name: "", size: undefined, website: "" } }),
    );
    expect(withoutOrg.success).toBe(true);

    const withOrgMissingFields = onboardingSchema.safeParse(
      validValues({ organization: { hasOrganization: true, name: "", size: undefined, website: "" } }),
    );
    expect(withOrgMissingFields.success).toBe(false);
    const paths = errorPaths(withOrgMissingFields);
    expect(paths).toContain("organization.name");
    expect(paths).toContain("organization.size");
  });

  it("accepts a complete organization and rejects a malformed website", () => {
    const ok = onboardingSchema.safeParse(
      validValues({
        organization: {
          hasOrganization: true,
          name: "Acme",
          size: "11-50",
          website: "https://acme.example",
        },
      }),
    );
    expect(ok.success).toBe(true);

    const badWebsite = onboardingSchema.safeParse(
      validValues({
        organization: {
          hasOrganization: true,
          name: "Acme",
          size: "11-50",
          website: "acme.example",
        },
      }),
    );
    expect(errorPaths(badWebsite)).toContain("organization.website");
  });

  it("requires at least one address and exactly one primary address", () => {
    expect(errorPaths(onboardingSchema.safeParse(validValues({ addresses: [] })))).toContain(
      "addresses",
    );

    const twoPrimary = validValues();
    twoPrimary.addresses.push({
      label: "Second",
      street: "2 Other Street",
      city: "Tehran",
      postalCode: "12345",
      country: "Iran",
      isPrimary: true,
    });
    expect(errorPaths(onboardingSchema.safeParse(twoPrimary))).toContain("addresses");
  });

  it("rejects duplicate team emails and a team email equal to the owner's", () => {
    const duplicate = validValues({
      team: [
        { name: "A", email: "team@example.com", role: "member" },
        { name: "B", email: "Team@Example.com", role: "manager" },
      ],
    });
    expect(errorPaths(onboardingSchema.safeParse(duplicate))).toContain("team.1.email");

    const ownerEmail = validValues({
      team: [{ name: "A", email: "mehdi@example.com", role: "member" }],
    });
    expect(errorPaths(onboardingSchema.safeParse(ownerEmail))).toContain("team.0.email");
  });

  it("rejects an unaccepted terms checkbox and an invalid notification enum", () => {
    const noTerms = validValues({ termsAccepted: false as never });
    expect(errorPaths(onboardingSchema.safeParse(noTerms))).toContain("termsAccepted");

    const badEnum = validValues({
      preferences: { newsletter: true, notifications: "everything" as never, language: "en" },
    });
    expect(errorPaths(onboardingSchema.safeParse(badEnum))).toContain(
      "preferences.notifications",
    );
  });

  it("strips surrounding whitespace and rejects an invalid phone number", () => {
    const trimmed = validValues({
      personal: { fullName: "  Mehdi Rezaii  ", email: "  mehdi@example.com ", phone: "" },
    });
    const parsed = onboardingSchema.safeParse(trimmed);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.personal.fullName).toBe("Mehdi Rezaii");
      expect(parsed.data.personal.email).toBe("mehdi@example.com");
    }

    const badPhone = validValues({
      personal: { fullName: "Mehdi Rezaii", email: "mehdi@example.com", phone: "abc" },
    });
    expect(errorPaths(onboardingSchema.safeParse(badPhone))).toContain("personal.phone");
  });
});
