# Local Mug implementation plan

Last updated: 12 August 2026

## Product goal

Local Mug connects independent coffee shops with local customers. Customers discover shops, follow businesses, read news, rate menu items, and use loyalty rewards. Approved businesses manage their public profile, staff, menu, content, rewards, payments, and in-person terminals.

## Current state

### Foundation

- Expo SDK 57, React Native, and TypeScript application.
- Supabase email/password authentication with persistent sessions.
- Supabase client configured for React Native.
- Drizzle schema and numbered migrations.
- Supabase RLS, database functions, triggers, and Storage policies.
- Starter tRPC server structure; no deployed tRPC API host yet.
- Git repository initialized with a baseline commit and SSH remote.
- TypeScript, Drizzle consistency, Expo configuration, and iOS production bundling pass.

### Authentication and account model

Implemented:

- One personal Supabase account is used for both customer and business experiences.
- Registration creates a customer profile only; it does not accept a client-supplied business or owner role.
- A signed-in user enters **Profile → Business portal** to apply for business access.
- Approved applicants receive an owner membership; invited employees receive a role-specific membership.
- Email/password signup, sign-in, persistent sessions, profile creation, and sign-out are connected to Supabase Auth.
- The Expo app already declares the `localmug` custom URL scheme.
- Authentication is separated into API, state hooks, validation, styles, and small presentational screens under `src/features/auth`.
- Signup passes the stable `localmug://auth/confirm` callback instead of relying on the localhost default.
- A persisted “Check your email” state supports confirmation-link callbacks, copied numeric OTP verification, and resend with a 60-second cooldown.
- Native callbacks support PKCE codes, access/refresh token fragments, token hashes, and actionable expired-link errors.
- Session/profile loading and sign-out are behind the auth API and hooks rather than implemented directly in `App.tsx`.

Auth implementation status: **DONE**. On 11 August 2026, the Supabase Site URL was changed to `localmug://auth/confirm`, the existing `localmug://**` redirect allow-list was verified, and the native iOS debug app built and launched successfully. User-owned inbox and device acceptance remains a deployment check, not an unfinished code slice.

Supabase currently requires custom SMTP before it allows this project to edit the default confirmation template. Until SMTP is connected, the app remains compatible with Supabase's default link email. After SMTP is connected, use the code-only `{{ .Token }}` template documented in `README.md` to make confirmation resistant to email-link scanners.

### Customer application

Implemented UI:

- Authentication and profile loading.
- Customer discovery and coffee-shop details.
- Loyalty wallet, news, and customer profile screens.
- Profile editing, avatar upload, email/password changes, and favourite coffee shops.

Current limitation: discovery, shop content, loyalty, news, and dashboard values are still primarily mock data. They are not yet a complete live marketplace.

### Business access and applications

Implemented today:

- Registration no longer grants business access through editable signup metadata.
- There is intentionally no separate business registration account type.
- Users open the Business Portal from their customer profile and apply using the same account.
- Business application draft creation and editing.
- Application submission through a secured database function.
- Submitted, under-review, approved, rejected, and resubmission states.
- Rejection reason display.
- Approval atomically creates a business, owner membership, and primary location.
- Platform-admin detection.
- In-app platform-admin application queue and full application review screen.
- In-app approval and request-changes actions.
- SQL recovery workflow for manual approval or rejection.

### Business profile

Approved business users can manage:

- Business name and category.
- Public description.
- Address and primary location.
- Public email, phone, and website.
- Logo and cover image.
- Weekly opening hours.
- Draft and published state.
- Setup-completion dashboard.

The dashboard filters actions using the user's membership permissions and does not display invented analytics.

### Business membership and permissions

Implemented:

- Customer-follow relationships renamed to `business_followers`.
- Separate `business_memberships` table for staff access.
- Owner, admin, manager, finance, barista, and viewer roles.
- Active, invited, suspended, and removed membership states.
- Central SQL permission function used by RLS.
- Matching client permission map used for visible actions.
- Permission-aware policies for profiles, locations, hours, menu, content, rewards, and business media.
- Existing business owners backfilled into owner memberships.
- Employee invitations with normalized email, a seven-day expiry, and hashed single-use tokens.
- Secured invite, accept, revoke, role-change, suspend, restore, and remove database functions.
- Team and invitation RLS policies plus an immutable team audit trail.
- Permission-aware Team list, invitation form, one-time code handoff, invite acceptance, and member detail screens.
- One-tap invitation-code copy with visible confirmation feedback.
- Owner/admin management boundaries; only owners can assign or manage administrators.
- A transactional owner/admin/manager/viewer/invitee/anonymous SQL policy test script.

Employee invitation feature status: **DONE**. The invitation table and create, accept, and revoke functions were confirmed in the live Supabase project. Automatic invitation-email delivery remains intentionally pending until an email provider and trusted Edge Function are selected. Until then, owners securely share the copied single-use code. Ownership transfer is a separate future feature.

### Menu management

Implemented locally:

- Permission-routed Menu workspace for owners, administrators, and managers.
- Menu-category create, rename, delete, and ordering controls.
- Menu-item create, edit, delete, price, description, category, photo, and availability controls.
- Validated JPEG, PNG, and WebP uploads up to 5 MB with business-scoped paths and replacement/deletion cleanup.
- Loading, empty, error, busy, confirmation, and unavailable-item states.
- Supabase migration `004` restricts public reads to published businesses, aligns menu-media policies with `menu.manage`, and blocks cross-business category assignment.
- Transactional anonymous/manager/viewer menu RLS verification script.

Current limitation: Supabase migration `004` and its RLS test must be applied before the menu slice is considered deployed. The customer marketplace still renders mock menu data and will be connected to published menu queries after management verification.

### Code structure

The auth, business, team, and menu features use the modular reference structure:

```text
src/features/auth/
  AuthEntry.tsx
  api.ts
  hooks.ts
  sessionHooks.ts
  styles.ts
  types.ts
  validation.ts
  components/

src/features/business/
  BusinessPortal.tsx
  api.ts
  hooks.ts
  permissions.ts
  styles.ts
  types.ts
  components/

src/features/menu/
  MenuEntry.tsx
  api.ts
  hooks.ts
  styles.ts
  types.ts
  validation.ts
  components/

src/features/team/
  TeamEntry.tsx
  InvitationAcceptanceGate.tsx
  api.ts
  hooks.ts
  permissions.ts
  styles.ts
  types.ts
  validation.ts
  components/
```

- UI does not access Supabase directly.
- API operations, hooks, permissions, types, styles, and screens are separate.
- `BusinessPortal` is a small flow coordinator.

### Database deployment

Applied successfully:

- Drizzle migrations `0000`, `0001`, and `0002`.
- Supabase migration `001_supabase_security.sql`.
- Supabase migration `002_business_profiles.sql`.
- Drizzle migration `0003_employee_invitations.sql`.
- Supabase migration `003_employee_invitations.sql`.

Ready to apply:

- Supabase migration `004_menu_management.sql`.
- Transactional verification script `supabase/tests/004_menu_management_rls.sql`.

The first platform administrator still needs a row in `platform_admins` for the in-app review queue:

```sql
insert into public.platform_admins (profile_id)
values ('PLATFORM_ADMIN_PROFILE_UUID')
on conflict do nothing;
```

## Known gaps and risks

- Live end-to-end testing with separate applicant, administrator, owner, employee, customer, and anonymous accounts is not yet recorded.
- Production email confirmation requires custom SMTP plus the documented code-only Supabase template; inbox/device acceptance is covered by the deployment checklist.
- The current business portal loads the first active business membership; there is no multi-workspace selector.
- Full Expo Router protected route groups are not implemented. The current flow uses component state plus permission-filtered actions.
- Automatic invitation-email delivery and ownership transfer are missing; code-based invitations are complete.
- Business special/holiday hours and multiple locations are missing.
- Replaced business media files are not yet cleaned up automatically.
- Customer menu rendering, news, events, rewards, payments, and analytics dashboard actions remain incomplete.
- Payments and terminals are not implemented.
- The customer marketplace remains mostly mock-backed.
- The invitation RLS test exists as a transactional SQL script, but there is no automated test runner for database functions, hooks, or UI workflows.

## Next implementation steps

### 1. Deploy and verify menu management

Priority: immediate.

- Apply `supabase/migrations/004_menu_management.sql` in the Supabase SQL Editor.
- Run `supabase/tests/004_menu_management_rls.sql`; confirm it completes and rolls back without an assertion error.
- Verify category creation, rename, ordering, deletion, and uncategorized-item fallback as an owner.
- Verify item creation, editing, photo replacement/removal, price, availability, and deletion.
- Verify a manager can manage the menu while viewer, barista, and finance accounts cannot open or mutate it.
- Verify anonymous/customer accounts cannot read an unpublished menu and can read a published menu.

Definition of done: migration and RLS tests pass, permitted business roles can manage a complete menu, denied roles cannot mutate it, media cleanup works, and only published menus are customer-readable.

### 2. Verify the live business application flow

Priority: immediately after menu verification.

- Create separate applicant and platform-admin test accounts.
- Add the administrator profile to `platform_admins`.
- Save and submit a business application.
- Verify the applicant cannot read other applications or approve themselves.
- Approve from the in-app review queue.
- Verify business, owner membership, and primary location creation.
- Edit, upload media, configure hours, and publish the business.
- Verify anonymous/customer users only see published businesses.
- Record failures as reproducible tests before changing policies.

Definition of done: the complete application-to-published-profile workflow succeeds on a physical iOS device and all negative RLS checks fail safely.

### 3. Routing and workspace selection

- Introduce Expo Router using SDK 57 patterns.
- Add protected authentication, customer, application, admin-review, workspace, and business route groups.
- Add a selector for users with multiple active business memberships.
- Preserve RLS as the authorization boundary.
- Add route-level loading, denied, missing-workspace, and suspended states.

### 4. Finish business profile quality

- Add special opening hours and holiday closures.
- Add multiple business locations.
- Add social links and amenities.
- Add address/map selection and coordinate validation.
- Add media replacement cleanup.
- Define required completion rules before publishing.
- Add customer preview before publication.
- Add accessibility, offline, retry, and device-size QA.

### 5. Customer menu integration

- Replace mock shop menu data with published business/category/item queries.
- Preserve category order and hide unavailable items from order-focused views.
- Add customer loading, empty, retry, and unpublished states.

### 6. News, events, and rewards

- News and event creation, editing, scheduling, pinning, and publication.
- Reward creation and menu-item linking.
- Secure loyalty wallet opening, stamp issuing, redemption, and immutable audit history.
- Replace mock customer news, rewards, and shop details with live queries.

### 7. Payments

- Select and deploy a trusted backend or Supabase Edge Functions.
- Add provider-neutral payment connection and transaction tables.
- Implement Stripe Connect hosted onboarding.
- Add card, Apple Pay, and Google Pay through PaymentSheet.
- Add verified, idempotent webhooks and normalized payment state.
- Implement refunds and reconciliation.
- Prototype PayPal as a separate provider.

### 8. Terminals

- Move development to an Expo development build because Terminal requires native code.
- Integrate Stripe Terminal with Connect.
- Add business-location-to-provider-location mapping.
- Build reader discovery, connection, payment, cancellation, and retry flows.
- Add a trusted Terminal connection-token endpoint.
- Test simulated readers, physical readers, and Tap to Pay where supported.

### 9. Launch readiness

- Automated unit, integration, RLS, and payment-invariant tests.
- Analytics and crash reporting.
- Account deletion and data export.
- Moderation, reporting, privacy policy, and terms.
- Accessibility and performance audits.
- EAS preview and production builds.
- App Store and Play Store materials.

## Working rule

Complete and verify one vertical slice before beginning the next. Update this file whenever a slice is deployed, tested, deferred, or materially redesigned.
