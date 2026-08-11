# Local Mug engineering rules

These instructions apply to the entire repository.

## Expo SDK 57

Expo has changed. Before writing application code, read the exact versioned documentation at:

https://docs.expo.dev/versions/v57.0.0/

Do not rely on patterns from older Expo or Expo Router versions. Use SDK 57-compatible packages and APIs. Native dependencies must be installed with `expo install` and verified against SDK 57.

## Required architecture

Use a feature-first structure:

```text
src/
  components/              # Truly shared application components
  features/
    feature-name/
      FeatureEntry.tsx     # Small screen/flow coordinator
      api.ts               # Supabase or HTTP operations
      hooks.ts             # Stateful workflow logic
      permissions.ts       # Feature access rules when needed
      styles.ts             # Feature-specific styles
      types.ts              # Feature domain types
      components/          # Small presentational components
  lib/                     # Shared infrastructure and validation
  db/                      # Drizzle schema only
  server/                  # Server-only code
```

Follow the business feature under `src/features/business` as the reference implementation.

## Implementation standard

- Implement the requested slice completely and according to its stated requirements. Do not hand off placeholders, knowingly partial flows, speculative abstractions, or code that still requires routine cleanup.
- Write production-minded code once: inspect the relevant existing architecture first, handle expected loading/error/empty/permission states, and keep the implementation internally consistent before presenting it as complete.
- Prefer the smallest correct implementation. Avoid unrelated refactors, unnecessary dependencies, broad rewrites, and environment setup that does not materially validate the requested change.
- Resolve defects found within the requested slice before handoff. Do not defer known in-scope problems to a future pass.
- Do not claim live services, email delivery, payments, native-device behavior, or external configuration were verified unless they were actually tested.
- When verification requires the user's inbox, credentials, physical device, paid provider, or dashboard decision, finish all code that can be completed locally and provide a concise step-by-step manual acceptance guide.
- Treat a failed manual acceptance check as actionable evidence: request the exact visible error and relevant service log, then fix the demonstrated issue without reopening already-complete unrelated work.

## Separation of responsibilities

- UI components must not call Supabase, Stripe, PayPal, database clients, or raw `fetch` endpoints directly.
- Put external reads and mutations in the feature's `api.ts`.
- Put state transitions, async orchestration, validation flow, and media handling in hooks.
- Keep entry components focused on selecting and coordinating screens.
- Keep permission definitions in one feature permission module. Do not scatter role-name checks across components.
- Database RLS and trusted backend checks are the security boundary. Hidden buttons and protected client routes are not authorization.
- Server secrets and service-role credentials must never enter Expo code or `EXPO_PUBLIC_*` variables.

## Component rules

- Prefer one exported screen or substantial component per file.
- Extract a component when it has its own state, repeated markup, or a distinct responsibility.
- Aim for UI files under 150 lines and hooks/API modules under 250 lines. Split earlier when readability suffers.
- Do not combine unrelated screens in one file.
- Avoid deeply nested JSX. Extract cards, form sections, loading states, and empty states.
- Reuse shared primitives for headers, fields, buttons, cards, loading states, and errors.
- Props must use explicit TypeScript types. Avoid `any` and unsafe casts.

## Design consistency

- Use the existing warm cream, paper, green, mint, orange, ink, muted, and line palette.
- Do not introduce new colours, spacing conventions, corner radii, or typography scales ad hoc.
- Reuse feature styles from `styles.ts`; move values into shared design tokens when a second feature needs them.
- Preserve the current visual language: soft paper cards, green primary actions, orange warning/destructive accents, rounded controls, restrained shadows, and compact uppercase overlines.
- Every screen must include intentional loading, empty, error, disabled, and read-only states where applicable.
- Maintain accessible contrast, touch targets of approximately 44 points, useful labels, keyboard-safe forms, and dynamic-content-friendly layouts.
- Do not show invented analytics or fake operational values. Use real data, setup progress, or an explicit empty state.

## Forms and validation

- Define reusable Zod schemas outside UI components.
- Validate before sending data and retain equivalent database constraints for critical invariants.
- Trim and normalize user input in validation or API boundaries.
- Display actionable errors without exposing secrets or internal SQL details.
- Disable duplicate submissions while a mutation is running.

## Supabase and database rules

- Drizzle schema in `src/db/schema.ts` is the source of truth for table shape.
- Generate a new numbered Drizzle migration for every schema change. Never edit a migration already applied to a shared database.
- Put Supabase-specific functions, grants, RLS, triggers, and Storage policies in a new numbered file under `supabase/migrations`.
- Keep Drizzle and Supabase security migrations ordered and documented in `README.md` and `PLANS.md`.
- All tenant-owned records must include a business or profile ownership path that RLS can verify.
- Test policies using at least customer, applicant, owner, employee, platform-admin, and anonymous scenarios where relevant.
- Never trust IDs, roles, prices, payment states, or ownership claims sent by the mobile client.
- Security-definer functions must set an explicit `search_path`, validate the caller, and expose the smallest required grant.
- Storage paths must start with the authenticated profile ID or authorized business ID, depending on the bucket.

## Business permissions

- Use permission keys rather than UI checks against role names.
- Keep the client permission map aligned with the SQL `business_role_has_permission` function.
- Any permission change must update both implementations and include an RLS test.
- Owners, admins, managers, finance users, baristas, and viewers must only see actions their permissions allow.
- Ownership transfer and payment-connection changes require stronger checks than ordinary profile edits.

## Payments and terminals

- Payment creation, refunds, provider onboarding, webhooks, and Terminal connection tokens must run in a trusted backend or Edge Function.
- Never store card details or provider secret keys in application tables or mobile storage.
- Treat Apple Pay and Google Pay as wallet methods supplied through the chosen processor, not as independent merchant databases.
- Store provider IDs and normalized payment state, and derive final status from verified webhooks.
- Require idempotency for payment and webhook mutations.

## Git and change discipline

- Preserve unrelated user changes and inspect `git status` before editing.
- Keep changes scoped to one implementation slice.
- Add or update `PLANS.md` when a completed slice changes project status or priorities.
- Do not commit secrets, `.env.local`, generated native folders, or build outputs.
- Do not rewrite or remove applied migrations.
- Never create a Git commit, push a branch, or open a pull request unless the user explicitly requests that exact Git action in the current request.
- Do not ask the user to commit or push during implementation. At handoff, recommend a commit only when the slice is ready and provide one prepared commit message; the user decides when to commit and push.
- A previous request to commit or push does not authorize later Git actions for a new implementation slice.

## Proportional verification

Before handing off application code, run the fast deterministic checks relevant to the files changed:

```bash
node node_modules/typescript/bin/tsc --noEmit
node_modules/.bin/drizzle-kit check
```

Run an Expo export, native build, simulator/device test, migration, or live service test only when it materially validates the requested slice or the user explicitly asks for it. Do not install system tooling or spend time on environment-heavy checks when a manual acceptance guide is the more efficient boundary.

Run targeted database/RLS tests when migrations or policies change. Never apply a migration to a shared database merely to check syntax unless deployment was requested. State clearly which checks passed, which live checks were not performed, and which manual steps remain for the user.
