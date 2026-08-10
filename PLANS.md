# Local Mug implementation plan

Last updated: 10 August 2026

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
- Users open the Business Portal from their customer profile.
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

Implemented database foundation:

- Customer-follow relationships renamed to `business_followers`.
- Separate `business_memberships` table for staff access.
- Owner, admin, manager, finance, barista, and viewer roles.
- Active, invited, suspended, and removed membership states.
- Central SQL permission function used by RLS.
- Matching client permission map used for visible actions.
- Permission-aware policies for profiles, locations, hours, menu, content, rewards, and business media.
- Existing business owners backfilled into owner memberships.

Current limitation: employee invitation and team-management UI are not implemented yet.

### Code structure

The business feature is the reference modular implementation:

```text
src/features/business/
  BusinessPortal.tsx
  api.ts
  hooks.ts
  permissions.ts
  styles.ts
  types.ts
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

The first platform administrator still needs a row in `platform_admins` for the in-app review queue:

```sql
insert into public.platform_admins (profile_id)
values ('PLATFORM_ADMIN_PROFILE_UUID')
on conflict do nothing;
```

## Known gaps and risks

- Live end-to-end testing with separate applicant, administrator, owner, employee, customer, and anonymous accounts is not yet recorded.
- The current business portal loads the first active business membership; there is no multi-workspace selector.
- Full Expo Router protected route groups are not implemented. The current flow uses component state plus permission-filtered actions.
- Employee invitations, acceptance, role changes, suspension, removal, and ownership transfer are missing.
- Business special/holiday hours and multiple locations are missing.
- Replaced business media files are not yet cleaned up automatically.
- Menu, news, events, rewards, team, payments, and analytics dashboard actions remain incomplete.
- Payments and terminals are not implemented.
- The customer marketplace remains mostly mock-backed.
- There is no automated test suite for RLS, database functions, hooks, or UI workflows.

## Next implementation steps

### 1. Verify the live business flow

Priority: immediate.

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

### 2. Employee invitations and team management

Priority: next development slice.

- Add `business_invitations` with hashed token, email, role, inviter, expiry, and status.
- Add secured invite, accept, revoke, role-change, suspend, remove, and ownership-transfer functions.
- Build Team list, invitation form, invite acceptance, and member detail screens.
- Enforce `team.read` and `team.manage` in UI and RLS.
- Add audit records for membership and role changes.
- Test every role against its permission matrix.

Definition of done: an owner can invite an employee, the employee can accept, and each role sees and performs only authorized actions.

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

### 5. Menu management

- Menu-category CRUD and ordering.
- Menu-item CRUD, price, description, photo, and availability.
- Business-scoped media upload and cleanup.
- Customer discovery queries backed by published business/menu data.
- Empty/loading/error states and validation.

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
