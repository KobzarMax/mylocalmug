# Local Mug implementation plan

Last updated: 16 August 2026

## Product goal

Local Mug connects independent coffee shops with local customers. Customers discover shops, follow businesses, read news, rate menu items, and use loyalty rewards. Approved businesses manage their public profile, staff, menu, content, rewards, and legal information. Payments and in-person terminals remain a researched future slice.

## Current state

### Foundation

- Expo SDK 57, React Native, and TypeScript application.
- Supabase email/password authentication with persistent sessions.
- Typed Supabase client backed by generated `Database` and RPC definitions.
- Drizzle schema and numbered migrations.
- Supabase RLS, database functions, triggers, and Storage policies.
- Feature-scoped Supabase APIs, trusted database functions, and deployed Edge Functions; no separate application API host.
- TanStack Query with explicit AsyncStorage persistence, NetInfo reconnect handling, and Expo Image disk caching for customer reading data.
- Git repository initialized with a baseline commit and SSH remote.
- Expo Router with protected authentication, customer, and business stacks and typed dynamic parameters.
- Shared accessible UI primitives, feature error boundaries, safe error conversion, ESLint, Prettier, Jest Expo, and React Native Testing Library.
- TypeScript, ESLint, formatting, Drizzle consistency, Expo dependency/configuration, and UI/route tests pass.

### Whole-app quality remediation

Implementation status: **CODE DONE; DEVICE AND RESPONSIVE ACCEPTANCE PENDING**.

- Updated Expo SDK 57 dependencies to compatible patch versions and introduced Expo Router route groups with normal back-stack behavior.
- Removed postponed payment, checkout, order, refund, and Terminal features from the default import and navigation graph; public menus no longer expose ordering controls.
- Moved UK legal information to a first-class, permission-controlled business action.
- Replaced the root boolean-navigation prototype and deleted obsolete prototype screens, fake dashboard metrics, fake profile history, and inactive destinations.
- Rebuilt profile editing as a modular feature with typed API operations, image handling, validation, TanStack queries/mutations, rollback, and media cleanup boundaries.
- Added shared tokens and accessible buttons, fields, cards, headers, state views, segmented controls, status chips, offline notices, date/time fields, and confirmation patterns.
- Refactored reward programme and offer creation into step-based sections with native/readable date controls, validation summaries, previews, and explicit save/publish actions.
- Event-menu linking now blocks incomplete setup, explains that an event and menu item are both required, links directly to their creation flows, refreshes on return, and uses validated native/readable availability controls.
- Migrated business, menu, team, legal, content-management, rewards, and profile reads to non-persisted TanStack Query keys while retaining only approved customer-reading data in the 24-hour cache.
- Scoped order realtime subscriptions to the active business or customer and standardized safe user-facing error conversion.
- Generated typed Supabase database definitions and removed broad application-level RPC casting in the remediated paths.
- Added protected-route and shared-component tests plus strict unused-code checks. Web export succeeds without Stripe or Terminal code in the bundle.

No database or RLS migration is required for this remediation.

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
- Live published-business discovery, search, coffee-shop details, opening hours, rating aggregates, and available menus.
- Loyalty wallet, news, and customer profile screens.
- Profile editing, avatar upload, email/password changes, and favourite coffee shops.

Customer marketplace/offline status: **CODE DONE; MIGRATION AND DEVICE ACCEPTANCE PENDING**. Published shop catalog/detail/menu and News/Event queries are cached selectively for 24 hours, account-scoped followed data is purged across sessions, remote mutations are disabled offline, and previously downloaded images use disk caching. Public reward descriptions may be cached later; private balances, ledger history, and QR state are live-only and excluded from persistence.

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

### UK legal profile

Implementation status: **CODE DONE; MIGRATIONS AND LIVE ACCEPTANCE PENDING**.

- Private one-to-one UK legal profiles for sole traders, limited companies, LLPs, partnerships, charities, and other organisations.
- Structured registered address, legal contact, conditional Companies House/charity/VAT fields, and UK format validation.
- Draft, pending-approval, change-request, and owner-approved workflow with optimistic revisions.
- Finance users can read, edit, and submit; owners/admins can additionally attest, approve, or return submissions.
- Every approved-profile edit invalidates approval and returns the record to draft.
- Trusted RPCs derive the actor from Auth, enforce active membership, and log action names and changed fields without copying legal values.
- Business approvals seed a legal draft; existing businesses are backfilled from approved applications when safe.
- No KYC documents, bank data, UTRs, directors, beneficial owners, identity details, or provider answers are stored.
- Drizzle `0005`, Supabase `008`, Zod tests, and transactional RLS/lifecycle tests are ready.

### Payments, till, and customer checkout

Implementation status: **POSTPONED PENDING PAYMENT-PROVIDER RESEARCH**.

The existing Stripe-first implementation is retained as an experimental foundation, and Drizzle `0006` plus Supabase `009` have been applied. It is not the final product architecture because businesses must be able to connect their own supported terminal provider, such as Dojo, rather than being required to adopt Stripe Terminal.

- UK Stripe Connect direct-charge onboarding and optional PayPal seller referrals behind approved legal profiles.
- Provider connections, verified/idempotent webhook ledger, browser-return states, leased retry jobs, and normalized provider status.
- Server-priced GBP orders with immutable menu snapshots, customer/till channels, payment attempts, refunds, Terminal locations, and readers.
- Owner/admin provider setup; finance transaction/refund access without provider connection; manager/barista till and preparation access without refunds.
- Customer online-only ASAP pickup basket with PaymentSheet card/Apple Pay/Google Pay and optional hosted PayPal checkout.
- Ten-minute shop confirmation, staff accept/reject/preparing/ready/completed flow, and idempotent rejection/timeout refunds.
- Stripe Terminal simulator and WisePad 3 Bluetooth workflow with interruption-safe payment recovery boundaries.
- Native provider modules have explicit platform boundaries but are not reachable from live application routes.
- Drizzle `0006`, Supabase `009`, payment validation tests, transactional RLS tests, and five payment Edge Functions.

Do not deploy or configure the payment provider functions as a production payment system until the provider research and architecture below are complete. Stripe may remain an optional terminal or online-checkout provider, but it must not be a required terminal provider.

Research must determine:

- Which UK terminal providers expose supported POS APIs, sandbox environments, terminal discovery, payment-status reconciliation, cancellation, and refund operations.
- The commercial and certification requirements for Dojo, Stripe Terminal, SumUp, Square, Worldpay, and other realistic providers.
- Whether Local Mug must register as a software house, reseller, platform, or payment facilitator for each integration.
- How each business securely authorizes its provider connection without exposing merchant credentials to Expo or public database records.
- Which providers support reliable webhooks or retrieval APIs for resolving interrupted, expired, or uncertain terminal payments.
- Whether online card/wallet checkout and in-person terminal payments may use different providers for the same business.
- Which unsupported terminals may be recorded only as manually confirmed external payments, clearly separated from provider-verified transactions.

When development resumes, introduce a provider-neutral terminal adapter and add integrations incrementally. Because `0006` and `009` are already applied, all schema and security corrections must use new numbered migrations; applied migrations must not be rewritten.

### Menu management

Implementation status: **CATEGORY MANAGEMENT CODE DONE; MIGRATIONS AND LIVE ACCEPTANCE PENDING**.

- Permission-routed Menu workspace for owners, administrators, and managers.
- Menu-category create, rename, delete, and ordering controls.
- Menu-item create, edit, delete, price, description, category, photo, and availability controls.
- Validated JPEG, PNG, and WebP uploads up to 5 MB with business-scoped paths and replacement/deletion cleanup.
- Loading, empty, error, busy, confirmation, and unavailable-item states.
- Supabase migration `004` restricts public reads to published businesses, aligns menu-media policies with `menu.manage`, and blocks cross-business category assignment.
- Supabase migration `011` seeds five ordinary, editable starter categories for new and currently empty businesses without overwriting non-empty menus. Empty menus expose a permission-checked restore action.
- A dedicated permission-routed category manager centralizes create, rename, reorder, and delete actions while keeping the main menu focused on items.
- Exact normalized duplicates are database-blocked; PostgreSQL trigram matches warn about similar names and require an explicit override.
- Drizzle `0008` safely consolidates existing exact duplicates, and Supabase `012` moves category writes behind trusted business-scoped RPCs.
- Transactional anonymous/manager/viewer menu RLS verification script.

Deployment status: Supabase migration `004_menu_management.sql` was applied. The first RLS-test run exposed an invalid test fixture, which was corrected to create transactional `auth.users` records before their linked profiles. A successful rerun of `004_menu_management_rls.sql` and live role/device acceptance are not yet recorded. The customer marketplace still renders mock menu data and will be connected to published menu queries after management verification.

### Rewards and loyalty

Implementation status: **CODE DONE; MIGRATIONS, RLS TEST, AND DEVICE ACCEPTANCE PENDING**.

- Multiple independent stamp and points programmes with immutable, effective-dated rule versions.
- Configurable item/category earning, integer points per pound, custom unit names, permanent programme tiers, and non-expiring balances.
- Balance rewards, reusable tier perks, fixed/percentage discounts, and two-group meal-deal bundle pricing.
- Explicit customer enrolment and a live wallet with balances, lifetime progress, tiers, offers, and ledger history.
- Staff-verified external-till purchases and staff-validated redemptions using short-lived, hashed, single-use QR challenges.
- Row-locked/idempotent balance changes, immutable ledger entries, timed issuer undo, permissioned reversals, usage limits, replay detection, and fraud audit events.
- Event-linked menu items with editable availability, customer badge/message, cancellation handling, and event-only visibility.
- Drizzle `0007`, Supabase `010`, transactional RLS/fraud tests, validation tests, and SDK 57 camera configuration.

Deployment boundary: apply Drizzle `0007_configurable_loyalty.sql`, then Supabase `010_configurable_loyalty.sql`, and run `010_configurable_loyalty_rls.sql`. Payments remain postponed; staff confirmation records an external-till purchase but does not independently verify payment.

### News and events

Implementation status: **CODE DONE; BACKEND DEPLOYED; DEVICE ACCEPTANCE PENDING**.

- Modular business content workspace for owners, administrators, and managers using `content.manage`.
- Constrained TenTap rich-text JSON, title, excerpt, cover media, pinning, drafts, immediate publication, and scheduled publication.
- One-off timed/all-day events with timezone, optional end, venue, cancellation, and 1-week/1-day/1-hour reminders.
- Live customer Following and Discover feeds with filters, pagination, safe public bylines, details, per-shop following, and alert preferences.
- Private content-media bucket with permission-aware upload/read/delete policies and replacement cleanup.
- Expo push-token registration, notification response handling, `localmug://content/{id}` navigation, and SDK 57 native calendar form integration.
- Transactional event-notification outbox, per-device delivery ledger, retry leases, Expo ticket/receipt processing, and stale-token deactivation.
- Supabase Edge Functions for dispatch and receipt processing plus pg_cron/pg_net scheduling migration.
- Transactional owner/admin/manager/customer/denied-role/anonymous lifecycle and RLS test script.

Deployment status reported on 13 August 2026: Drizzle `0004` and Supabase `005` are applied; both notification Edge Functions are deployed to project `omldnaucondjeaaaiqpk`; the Edge Function cron secret and all three Vault secrets are configured; and Supabase `006` is applied. The corrected `005_news_events_rls.sql` still needs one recorded successful rerun. EAS is linked with project ID `57210b8f-c2af-48a2-bcac-15d308ef1b3b`. iOS APNs registration is intentionally paused while the paid Apple Developer account-update issue is resolved. Android FCM and physical-device push/calendar acceptance are not yet recorded.

### Code structure

The application now uses Expo Router for navigation and feature modules for UI, state, validation, and external operations:

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

src/features/content/
  BusinessContentEntry.tsx
  CustomerContentEntry.tsx
  api.ts
  device.ts
  editorHooks.ts
  hooks.ts
  media.ts
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

src/features/legal/
  LegalEntry.tsx
  api.ts
  hooks.ts
  styles.ts
  types.ts
  validation.ts
  components/

src/features/profile/
  EditProfileScreen.tsx
  ProfileScreen.tsx
  api.ts
  hooks.ts
  styles.ts
  types.ts
  validation.ts
  components/

src/app/
  _layout.tsx
  (auth)/
  (customer)/
  (business)/
```

- UI does not access Supabase directly.
- API operations, hooks, permissions, types, styles, and screens are separate.
- Route guards improve navigation and denied states while RLS remains the authorization boundary.

### Database deployment

Applied successfully:

- Drizzle migrations `0000`, `0001`, and `0002`.
- Supabase migration `001_supabase_security.sql`.
- Supabase migration `002_business_profiles.sql`.
- Drizzle migration `0003_employee_invitations.sql`.
- Supabase migration `003_employee_invitations.sql`.
- Supabase migration `004_menu_management.sql`.
- Drizzle migration `0004_sticky_the_twelve.sql`.
- Supabase migration `005_news_events.sql`.
- Supabase migration `006_event_notification_cron.sql`.
- Edge Functions `dispatch-event-notifications` and `check-push-receipts`.
- Vault secrets `project_url`, `anon_key`, and `event_notification_cron_secret`.
- Drizzle migration `0005_uk_legal_profiles.sql`.
- Supabase migration `008_uk_legal_profiles.sql`.
- Drizzle migration `0006_open_joystick.sql`.
- Supabase migration `009_payments_orders.sql`.

Ready to apply:

- Drizzle migration `0007_configurable_loyalty.sql`.
- Supabase migration `010_configurable_loyalty.sql`.
- Transactional verification script `supabase/tests/010_configurable_loyalty_rls.sql`.
- Supabase migration `011_default_menu_categories.sql`.
- Transactional verification script `supabase/tests/011_default_menu_categories.sql`.
- Drizzle migration `0008_normalized_menu_categories.sql`.
- Supabase migrations `012_category_management.sql` and `013_lock_category_management_rpc_grants.sql`.
- Transactional verification script `supabase/tests/012_category_management.sql`.

Payment-provider deployment is intentionally postponed. The payment Edge Functions, provider credentials, Cron worker, sandbox acceptance, and physical-terminal acceptance are not release-ready.

News/events verification pending:

- Successful rerun of the corrected transactional script `supabase/tests/005_news_events_rls.sql`.
- Confirmation that both `cron.job` entries are active and producing successful runs.
- Android FCM credentials and physical-device notification/calendar acceptance.
- iOS APNs credentials and physical-device acceptance after Apple account registration resumes.

Verification pending:

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
- Multi-business workspace selection is not implemented; the current router preserves the first-active-workspace behavior.
- Automatic invitation-email delivery and ownership transfer are missing; code-based invitations are complete.
- Business special/holiday hours and multiple locations are missing.
- Replaced business media files are not yet cleaned up automatically.
- Menu-management RLS and live role/device acceptance are not yet recorded.
- Rewards and loyalty are code-complete with database deployment, transactional SQL verification, and physical-device acceptance pending. Production payment-provider connections, till orders, and checkout remain postponed; the UK legal prerequisite and experimental payment foundation are code-complete.
- News/events backend deployment is complete; RLS rerun, Cron execution evidence, Android FCM, paused iOS APNs registration, and physical-device push/calendar acceptance remain pending.
- Payments contain a Stripe-first experimental implementation, but the production architecture is postponed until provider research supports business-selected terminals such as Dojo.
- Offline customer data is read-only by design; queued writes and conflict resolution are not implemented.
- Transactional database verification remains a Supabase SQL Editor workflow; local validation and component/route tests now run through the project test scripts.

## Next implementation steps

### 1. Deploy and accept the live offline marketplace

Priority: immediate.

- Apply Supabase `007`, then run `007_public_marketplace_rls.sql` and record success.
- Verify published/unpublished shops, available/unavailable menu visibility, catalog search, shop details, hours, ratings, menus, and shop stories.
- Browse representative customer data and images online, restart in airplane mode, and verify cached/uncached states, disabled mutations, reconnect refresh, account cleanup, and 24-hour expiry.

Definition of done: safe live customer reading replaces the mock marketplace, persisted data and disk-cached images survive a restart offline, mutations remain online-only, and RLS blocks unpublished or unavailable records.

### 2. Finish news/events acceptance

Priority: immediate.

- Rerun the corrected transactional `005_news_events_rls.sql` test and record success.
- Verify draft, schedule, publish, edit, archive, cancellation, cover replacement, and denied-role behavior.
- Confirm both pg_cron jobs are active and their recent runs succeed.
- Configure Android FCM and verify following, shop alert opt-out, reminder/update/cancellation delivery, notification navigation, and the calendar form on a physical Android device.
- Resume APNs credentials and physical iOS acceptance after the Apple Developer account-update issue is resolved.

Definition of done: database tests pass, permitted roles manage the complete lifecycle, public feeds expose only due published content, push jobs deliver idempotently, and a customer can intentionally add an event to the native calendar.

### 3. Verify menu management

Priority: immediate.

- Rerun the corrected `supabase/tests/004_menu_management_rls.sql`; confirm it completes and rolls back without an assertion error.
- Verify category creation, rename, ordering, deletion, and uncategorized-item fallback as an owner.
- Verify the dedicated manager blocks exact duplicates, warns on similar names, and clears a similarity confirmation after the name changes.
- Verify item creation, editing, photo replacement/removal, price, availability, and deletion.
- Verify a manager can manage the menu while viewer, barista, and finance accounts cannot open or mutate it.
- Verify anonymous/customer accounts cannot read an unpublished menu and can read a published menu.

Definition of done: migration and RLS tests pass, permitted business roles can manage a complete menu, denied roles cannot mutate it, media cleanup works, and only published menus are customer-readable.

### 4. Verify the live business application flow

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

### 5. Quality-remediation acceptance and workspace selection

- Run the remediated customer and business journeys on iOS and Android development builds.
- Verify large text, VoiceOver/TalkBack, camera denial, offline recovery, interrupted forms, and content deep links.
- Check small phone, large phone, tablet, and narrow web layouts and capture the planned before/after product screenshots.
- Add a selector for users with multiple active business memberships while preserving the current protected routes and RLS boundary.

### 6. Finish business profile quality

- Add special opening hours and holiday closures.
- Add multiple business locations.
- Add social links and amenities.
- Add address/map selection and coordinate validation.
- Add media replacement cleanup.
- Define required completion rules before publishing.
- Add customer preview before publication.
- Add accessibility, offline, retry, and device-size QA.

### 7. Deploy and accept rewards and loyalty

- Apply Drizzle `0007`, then Supabase `010`, and run the transactional `010` verification script.
- Verify programme creation/versioning, publishing, scheduling, pausing, ending, and outstanding-balance archive protection.
- Verify customer joining, live balances, tier progress, earning QR, redemption QR, meal-deal validation, and replay rejection.
- Verify owner/admin/manager management, manager/barista issuing, timed undo, denied roles, camera denial, and offline fail-closed behavior.
- Verify event-linked public menu badges, windows, cancellation, and event-only hiding.

Definition of done: the SQL test passes and a physical-device acceptance run confirms staff-verified earning and redemption cannot be forged or replayed by customers.

### 8. UK legal profile acceptance

- Run the transactional `008` verification script against the applied migrations.
- Complete finance-draft, owner/admin change-request and approval, denied-role, conflict, and approval-invalidation acceptance.
- Keep KYC, identity documents, bank data, and provider secrets outside the Expo application and public tables.

### 9. Payments and terminals — postponed

Priority: deferred until provider and commercial research is complete.

- Define separate provider contracts for in-person terminals and online checkout.
- Select the first UK terminal integration based on API completeness, merchant onboarding, commercial terms, certification, supported hardware, refunds, and reconciliation. Evaluate Dojo explicitly.
- Redesign the existing Stripe-specific terminal layer behind a provider-neutral adapter; retain Stripe only as an optional provider.
- Let each business connect a supported provider using an owner/admin-only hosted or backend-mediated flow.
- Keep provider credentials in trusted backend secret storage and expose only normalized connection/capability state to the app.
- Use one provider-neutral till workflow for terminal selection, payment creation, cancellation, uncertain-result recovery, and refunds.
- Keep online card, Apple Pay, Google Pay, and PayPal capabilities independent from the selected till provider.
- Add new Drizzle and Supabase migrations rather than editing applied `0006` or `009`.
- Verify each adapter in its provider sandbox before physical-device and certified-terminal acceptance.

Definition of done: a business can select and securely connect at least one supported terminal provider without being required to use Stripe, the till receives provider-verified final payment state, retries cannot create duplicate charges, and unsupported/manual terminals are never presented as automatically verified.

### 10. Launch readiness

- Automated unit, integration, RLS, and payment-invariant tests.
- Analytics and crash reporting.
- Account deletion and data export.
- Moderation, reporting, privacy policy, and terms.
- Accessibility and performance audits.
- EAS preview and production builds.
- App Store and Play Store materials.

## Working rule

Complete and verify one vertical slice before beginning the next. Update this file whenever a slice is deployed, tested, deferred, or materially redesigned.
