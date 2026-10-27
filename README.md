# Form Management

Enterprise-grade form management module built with **Next.js 15 (App Router)**,
**React 19**, **TypeScript (strict)**, **react-hook-form** and **Zod**.

It is a complete, working example — not a snippet — of a multi-step form
with nested validation, dynamic field arrays, conditional fields, Server
Actions, optimistic UI and tag-based cache revalidation, covered by
Vitest + React Testing Library tests.

## What it does

A four-step onboarding wizard:

1. **Personal & organization** — name, email, optional phone, and an
   organization block that only becomes required when
   "I am registering on behalf of an organization" is checked.
2. **Addresses** — a dynamic field array (add/remove, up to 5) with
   exactly one primary address enforced by the schema.
3. **Team & preferences** — a dynamic team-member array (up to 10)
   with unique emails, plus newsletter/notification/language preferences.
4. **Review** — terms acceptance, then submit.

On submit the new entry appears in the submissions list **immediately**
(optimistic UI). If the Server Action fails, that row disappears again
and the user's input is preserved for a retry. Successful submissions
revalidate the home page and the submissions cache tag.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

Requires Node.js 20+ (developed and verified on Node 24).

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Server Component: reads cached submissions, renders the form
│   └── globals.css         # Tailwind directives
├── components/
│   ├── ui/
│   │   ├── FormField.tsx   # Accessible label + aria-describedby + role="alert" errors
│   │   └── inputs.tsx      # Shared TextInput / SelectInput / CheckboxInput
│   └── forms/
│       ├── OnboardingForm.tsx   # Wizard orchestrator: one useForm, step routing, submit handling
│       ├── WizardNavigation.tsx # Back / Next / Submit controls
│       ├── steps/               # One component per step, each receiving the shared form instance
│       │   ├── shared.ts, PersonalOrganizationStep.tsx, AddressesStep.tsx,
│       │   ├── TeamPreferencesStep.tsx, ReviewStep.tsx
│       └── SubmissionList.tsx   # Optimistic-aware list rendering
├── hooks/
│   ├── useMultiStepForm.ts         # Step index, derived first/last flags
│   └── useOptimisticSubmissions.ts # useOptimistic + useTransition wrapper
└── lib/
    ├── constants.ts        # Option lists, labels, limits, routes, cache tags (no magic strings)
    ├── validation/
    │   └── onboarding-schema.ts   # Zod schema, z.infer type, STEP_FIELDS, defaults
    └── submissions/
        ├── types.ts        # Submission + discriminated FormActionResult
        ├── store.ts        # In-memory persistence boundary (swap for a DB here)
        ├── actions.ts      # 'use server' submitForm: safeParse, dedupe, revalidate
        └── queries.ts      # unstable_cache read, tagged `submissions`
```

### Why this shape

- **One schema, one type.** `OnboardingFormValues = z.infer<typeof onboardingSchema>`
  is imported by the form, the actions and the store. A schema change is a
  compile error everywhere it matters; there is no parallel hand-written
  interface to drift.
- **Conditional validation in one `superRefine`.** A discriminated union
  would force react-hook-form to unmount/remount fields when the
  organization flag flips, losing input. `superRefine` keeps a single
  field registry and puts all conditional rules in one auditable place.
- **Per-step validation via `STEP_FIELDS`.** Pressing "Next" triggers
  only the current step's paths, so users are never blocked by errors
  on steps they have not reached. The full schema still runs on submit.
- **Separation of concerns.** UI components never touch the store;
  Server Actions never render; hooks own step state and optimistic
  state. The persistence boundary is `store.ts`, so replacing the
  in-memory store with a database means changing `store.ts` (and the
  query) only.

## Data flow & caching

```
User submits
  → react-hook-form + zodResolver (client validation)
  → useOptimisticSubmissions: optimistic row appears, transition starts
  → submitForm Server Action
      1. onboardingSchema.safeParse(data) — server never trusts the client
      2. Business rule: one submission per email
      3. Persist via store.ts
      4. revalidatePath("/") + revalidateTag("submissions")
  → Success: base list (from the cached query) replaces the optimistic row
  → Failure: base list never changed, so React discards the optimistic
    row automatically — no manual cleanup code, and no way for a failed
    row to linger because a cleanup branch was forgotten
```

Error handling is deliberately three-way, via the discriminated
`FormActionResult` type:

| Result | Meaning | UI behaviour |
| --- | --- | --- |
| Client validation error | Zod via `zodResolver`, inline | Field-level messages, step blocked |
| `validation` (server) | Server `safeParse` failed, or duplicate email | Message + `setError` mapping via dotted paths (e.g. `addresses.0.city`) |
| `server` | Unexpected exception after validation | Generic retryable alert; input is kept |

Revalidation calls in `actions.ts` are wrapped in `safeRevalidate()`
so the action stays unit-testable outside a real request; inside a real
Server Action call both calls succeed.

### Storage note

The store is in-memory and therefore per server instance. That is
intentional for this module's demo/dev purpose and is the documented
swap point for durable storage — it is not a claim of production
persistence. Do not use it as-is for data that must survive restarts.

## Testing

Vitest 3 + jsdom + React Testing Library + user-event.
Run with `npm test` (16 tests, all passing at last verification).

| File | Covers |
| --- | --- |
| `tests/validation/onboarding-schema.test.ts` | Edge cases: short names, bad emails/phones, conditional organization fields, 0/2 primary addresses, empty address list, duplicate team emails, team email equal to owner's, unaccepted terms, bad enums, whitespace trimming |
| `tests/lib/submissions/actions.test.ts` | Valid persistence, `revalidatePath`/`revalidateTag` calls, structured (non-throwing) validation results, duplicate-email rejection. `next/cache` is mocked |
| `tests/components/OnboardingForm.test.tsx` | Step blocking on invalid input, dynamic add/remove of addresses, loading state, **optimistic rollback on simulated Server Action failure** (deferred promise: row appears, then disappears on failure, input survives), server validation errors |

Two test-harness notes worth knowing:

- `vitest.config.ts` sets `esbuild: { jsx: "automatic" }` because the
  app tsconfig uses `jsx: preserve` (Next.js/SWC); without it, JSX in
  tests compiles to `React.createElement` with no React in scope.
- `vitest.setup.ts` calls `cleanup()` in `afterEach`, because Vitest
  runs with `globals: false` and Testing Library's automatic cleanup
  never registers otherwise.

## Extending the form

1. **Add a field:** extend the Zod schema in
   `src/lib/validation/onboarding-schema.ts` (the type follows
   automatically), add its path to the right step in `STEP_FIELDS`,
   render it in `OnboardingForm.tsx` inside a `FormField`, and add a
   schema test case.
2. **Add a step:** append a title to `STEP_TITLES`, a path list to
   `STEP_FIELDS`, and a section to the form. The wizard hook derives
   first/last from the step count, so no other step logic changes.
3. **Add an option:** add it to the tuple in `src/lib/constants.ts`
   and its label map; the Zod enum is built from the tuple, so the UI
   and validation stay in sync.
4. **Persist for real:** replace `src/lib/submissions/store.ts` with
   database calls behind the same function signatures, and keep
   `actions.ts`'s result contract unchanged.
