/**
 * Single source of truth for domain constants.
 *
 * Keeping option lists, limits, routes and cache tags here (instead of
 * scattering string literals through components and actions) is what makes
 * the form extensible: add an option in one place and the schema, the UI
 * and the tests all stay in sync, because the Zod enums below are built
 * from these tuples.
 */

export const ROLE_OPTIONS = ["admin", "manager", "member"] as const;
export const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201+"] as const;
export const NOTIFICATION_OPTIONS = ["all", "mentions", "none"] as const;
export const LANGUAGE_OPTIONS = ["en", "fa", "de"] as const;

export const ROLE_LABELS: Record<(typeof ROLE_OPTIONS)[number], string> = {
  admin: "Admin",
  manager: "Manager",
  member: "Member",
};

export const COMPANY_SIZE_LABELS: Record<(typeof COMPANY_SIZE_OPTIONS)[number], string> = {
  "1-10": "1–10 people",
  "11-50": "11–50 people",
  "51-200": "51–200 people",
  "201+": "201+ people",
};

export const NOTIFICATION_LABELS: Record<(typeof NOTIFICATION_OPTIONS)[number], string> = {
  all: "All activity",
  mentions: "Mentions only",
  none: "None",
};

export const LANGUAGE_LABELS: Record<(typeof LANGUAGE_OPTIONS)[number], string> = {
  en: "English",
  fa: "Persian",
  de: "German",
};

/** Validation limits. Named, so a limit change is a one-line diff. */
export const FORM_LIMITS = {
  fullNameMin: 2,
  fullNameMax: 100,
  organizationNameMax: 120,
  streetMax: 120,
  cityMax: 80,
  postalCodeMax: 20,
  maxAddresses: 5,
  maxTeamMembers: 10,
} as const;

export const ROUTES = {
  home: "/",
} as const;

/** Cache tag invalidated by every successful submission mutation. */
export const SUBMISSIONS_CACHE_TAG = "submissions" as const;
