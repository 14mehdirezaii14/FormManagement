import { z } from "zod";

import {
  COMPANY_SIZE_OPTIONS,
  FORM_LIMITS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_OPTIONS,
  ROLE_OPTIONS,
} from "@/lib/constants";

/**
 * ---------------------------------------------------------------------------
 * Onboarding form schema
 * ---------------------------------------------------------------------------
 * Design notes:
 * - The shape is nested (`personal`, `organization`, `addresses`,
 *   `team`, `preferences`) so each wizard step owns one subtree and
 *   step validation can trigger exactly that subtree's paths.
 * - Conditional rules live in ONE `superRefine` at the root, not in
 *   `z.discriminatedUnion` branches: react-hook-form keeps a single
 *   flat field registry, and a discriminated union would force the
 *   form to unmount/remount fields (losing input) when the flag flips.
 * - `z.infer` is the single type source: components, actions and the
 *   store all import `OnboardingFormValues` from here, so a schema
 *   change is a compile error everywhere it matters.
 */

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const addressSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60, "Label is too long"),
  street: z
    .string()
    .trim()
    .min(1, "Street is required")
    .max(FORM_LIMITS.streetMax, "Street is too long"),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(FORM_LIMITS.cityMax, "City is too long"),
  postalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required")
    .max(FORM_LIMITS.postalCodeMax, "Postal code is too long"),
  country: z.string().trim().min(1, "Country is required"),
  isPrimary: z.boolean(),
});

const teamMemberSchema = z.object({
  name: z.string().trim().min(1, "Team member name is required").max(100, "Name is too long"),
  email: emailSchema,
  role: z.enum(ROLE_OPTIONS, { message: "Select a role" }),
});

const baseSchema = z.object({
  personal: z.object({
    fullName: z
      .string()
      .trim()
      .min(FORM_LIMITS.fullNameMin, "Full name must be at least 2 characters")
      .max(FORM_LIMITS.fullNameMax, "Full name is too long"),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .max(30, "Phone number is too long")
      .refine(
        (value) => value === "" || /^\+?[0-9\s\-()]{7,30}$/.test(value),
        "Enter a valid phone number",
      )
      .optional()
      .default(""),
  }),
  organization: z.object({
    hasOrganization: z.boolean(),
    name: z.string().trim().max(FORM_LIMITS.organizationNameMax, "Organization name is too long"),
    size: z.enum(COMPANY_SIZE_OPTIONS).optional(),
    website: z
      .string()
      .trim()
      .max(200, "Website URL is too long")
      .refine(
        (value) => value === "" || /^https?:\/\/.+/.test(value),
        "Website must start with http:// or https://",
      )
      .optional()
      .default(""),
  }),
  addresses: z
    .array(addressSchema)
    .min(1, "Add at least one address")
    .max(FORM_LIMITS.maxAddresses, `You can add at most ${FORM_LIMITS.maxAddresses} addresses`),
  team: z
    .array(teamMemberSchema)
    .max(FORM_LIMITS.maxTeamMembers, `You can add at most ${FORM_LIMITS.maxTeamMembers} team members`),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.enum(NOTIFICATION_OPTIONS),
    language: z.enum(LANGUAGE_OPTIONS),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
});

export const onboardingSchema = baseSchema.superRefine((values, ctx) => {
  // Conditional: organization fields are required only when the flag is on.
  if (values.organization.hasOrganization) {
    if (values.organization.name.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organization", "name"],
        message: "Organization name is required when you have an organization",
      });
    }
    if (!values.organization.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["organization", "size"],
        message: "Organization size is required when you have an organization",
      });
    }
  }

  // Exactly one primary address — the invariant the UI ("Set as primary")
  // and any downstream mailing logic rely on.
  const primaryCount = values.addresses.filter((address) => address.isPrimary).length;
  if (primaryCount !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["addresses"],
      message: "Exactly one address must be marked as primary",
    });
  }

  // Team e-mails must be unique (case-insensitive), and must not repeat
  // the account owner's e-mail.
  const seen = new Set<string>();
  values.team.forEach((member, index) => {
    const normalized = member.email.trim().toLowerCase();
    if (seen.has(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["team", index, "email"],
        message: "Each team member email must be unique",
      });
    }
    seen.add(normalized);
    if (normalized === values.personal.email.trim().toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["team", index, "email"],
        message: "Team member email must differ from your own email",
      });
    }
  });
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
export type TeamMemberValues = z.infer<typeof teamMemberSchema>;

/** Field paths validated when the user presses "Next" on each wizard step. */
export const STEP_FIELDS = [
  ["personal.fullName", "personal.email", "personal.phone", "organization.hasOrganization", "organization.name", "organization.size", "organization.website"],
  ["addresses"],
  ["team", "preferences.newsletter", "preferences.notifications", "preferences.language"],
  ["termsAccepted"],
] as const;

export const defaultOnboardingValues: OnboardingFormValues = {
  personal: { fullName: "", email: "", phone: "" },
  organization: { hasOrganization: false, name: "", size: undefined, website: "" },
  addresses: [
    { label: "Head office", street: "", city: "", postalCode: "", country: "", isPrimary: true },
  ],
  team: [],
  preferences: { newsletter: true, notifications: "mentions", language: "en" },
  termsAccepted: false as never,
};
