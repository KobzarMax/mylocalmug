# Local Mug

An Expo + Supabase mobile app for connecting independent coffee shops with local customers.

## What exists now

- A runnable Expo SDK 57 TypeScript app
- Role selection for customer and business experiences
- Live customer discovery, coffee-shop detail, published menus, news/events, reward wallet, and profile screens
- Business dashboard with menu, post, reward, and event entry points
- A Supabase client configured for React Native session persistence
- Native email confirmation with a persisted pending state, resend cooldown, copied OTP entry, and `localmug://auth/confirm` callback handling
- An initial SQL migration with profiles, businesses, menus, posts/events, memberships, reviews, and flexible loyalty rewards
- Drizzle schema and CLI scripts for typed table migrations
- Trusted backend operations through Supabase database functions and Edge Functions
- Row Level Security policies and media buckets
- iOS profile editing with avatar upload, a 200-character description, confirmed email changes, password changes, and favourite coffee spots
- Business access applications with draft, review, approval, rejection, and resubmission states
- Approved-owner workspaces with permission-aware navigation and editable public business details, location, and opening hours
- Staff membership roles and database permission helpers for owner, admin, manager, finance, barista, and viewer access
- Employee invitation, acceptance, revocation, role changes, suspension, removal, and team audit foundations
- Permission-aware Team screens with a hashed, manually shared, single-use invitation code
- Business menu management with ordered categories, item CRUD, prices, photos, and availability
- Business news/event authoring with rich text, drafts, scheduling, publication, pinning, cancellation, and content-scoped media
- Live customer story feeds, shop following preferences, event push-delivery Edge Functions, notification deep links, and native calendar export
- A 24-hour, read-only customer cache with offline shop, menu, story, event, and disk-cached image access
- A private UK legal-profile workflow where finance staff prepare drafts and owners/admins approve them

## Run locally

```bash
cp .env.example .env
pnpm start
```

Then scan the QR code with Expo Go, or press `i`, `a`, or `w` for another target. The current UI works without filling in `.env`. Expo Go supports the ordinary app flow, but the business **Till** tab displays an unavailable state because Stripe Terminal requires a custom native development build.

To connect Supabase:

1. Create a Supabase project.
2. Set `DATABASE_URL` and run `pnpm run db:migrate` to create tables from Drizzle.
3. Run `supabase/migrations/001_supabase_security.sql` in the SQL Editor to add auth triggers, RLS policies, and storage buckets.
4. Run `supabase/migrations/002_business_profiles.sql` to add application, staff-permission, and business-profile policies.
5. Run `pnpm run db:migrate` again when needed to apply `drizzle/0003_employee_invitations.sql`, then run `supabase/migrations/003_employee_invitations.sql`.
6. Run `supabase/tests/003_employee_invitations_rls.sql` in the SQL Editor. It is transactional and rolls back its test records.
7. Run `supabase/migrations/004_menu_management.sql` to secure draft menus and menu media.
8. Run `supabase/tests/004_menu_management_rls.sql`; it is transactional and rolls back its test records.
9. Run `pnpm run db:migrate` to apply `drizzle/0004_sticky_the_twelve.sql`, then apply `supabase/migrations/005_news_events.sql`.
10. Run `supabase/tests/005_news_events_rls.sql`; it is transactional and rolls back its test records.
11. Apply `supabase/migrations/007_public_marketplace.sql`, then run `supabase/tests/007_public_marketplace_rls.sql`.
12. Run `pnpm run db:migrate` to apply `drizzle/0005_uk_legal_profiles.sql`, then apply `supabase/migrations/008_uk_legal_profiles.sql`.
13. Run `supabase/tests/008_uk_legal_profiles_rls.sql`; it is transactional and rolls back its fixtures.
14. Put the project URL and publishable/anon key in `.env`.
15. Restart Expo so the public environment variables are bundled.

### Menu management deployment

1. Apply `supabase/migrations/004_menu_management.sql` in the Supabase SQL Editor.
2. Run `supabase/tests/004_menu_management_rls.sql`. Success returns without an assertion error and the transaction rolls back all test data.
3. Restart or reload the app, then open **Profile → Business portal → Menu** as an owner, administrator, or manager.
4. Create and reorder categories; create an item with a price and photo; edit availability; replace/remove the photo; then delete the item.
5. Confirm viewer, barista, and finance accounts do not receive the Menu management action.
6. Keep the business unpublished and confirm customer/anonymous database reads return no menu rows; publish it and confirm those rows become readable.

### Supabase email confirmation

Configure **Authentication → URL Configuration**:

- Site URL: `localmug://auth/confirm`
- Redirect URL: `localmug://**`

Configure **Authentication → Email Templates → Confirm signup** with a copied code. Omitting a directly consumable confirmation link prevents email security scanners from spending the token before the user:

```html
<h2>Confirm your Local Mug account</h2>
<p>Your confirmation code is: <strong>{{ .Token }}</strong></p>
<p>Return to Local Mug and enter this code to finish creating your account.</p>
```

Supabase requires **Authentication → SMTP Settings** to be configured before this project can edit email templates. Without custom SMTP, keep the default link template; the app processes it through the configured native callback. With custom SMTP enabled, replace the template with the code-only HTML above.

The app also passes and handles `localmug://auth/confirm` if a link-based template is used for other Auth flows. The custom scheme is stable in development and production builds. Expo Go uses changing `exp://` URLs and is not the acceptance environment for this callback. See the [Expo SDK 57 Linking reference](https://docs.expo.dev/versions/v57.0.0/sdk/linking/), [Supabase native deep-link guide](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), and [Supabase email prefetching guidance](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching).

#### Manual email confirmation acceptance

1. In Supabase, confirm **Authentication → URL Configuration** shows Site URL `localmug://auth/confirm` and Redirect URL `localmug://**`.
2. For scanner-resistant numeric codes, connect your SMTP provider, open **Email Templates → Confirm signup**, paste the code-only template above, and save it.
3. Run a native development build with `pnpm exec expo run:ios` or your normal physical-device development-build workflow. Do not use Expo Go for this callback test.
4. Register with a new email address you control. The app must stay on **Check your email** and must not treat registration as authenticated.
5. Confirm using the newest email: enter its numeric code when the code-only template is active, or open its link when using Supabase's default template.
6. Confirm the app opens the signed-in customer experience and that signing out and back in works.
7. Register another new address, enter an incorrect code, then request a resend. Confirm the error is visible, resend is rate-limited for 60 seconds, the newest message works, and an expired older message gives a recoverable error.
8. If a step fails, record the exact app message and the matching entry under **Supabase → Logs → Auth**; that evidence is sufficient to diagnose a configuration or service failure.

Bootstrap the first platform reviewer in the Supabase SQL Editor:

```sql
insert into public.platform_admins (profile_id) values ('REVIEWER_PROFILE_UUID');
```

That user can then open **Business portal → Application reviews** in the app to inspect, approve, or reject submitted applications. The SQL functions remain available for operational recovery:

```sql
select public.review_business_application('APPLICATION_UUID', true, null);
select public.review_business_application('APPLICATION_UUID', false, 'Please verify the business address.');
```

Approval atomically creates the private business workspace, owner membership, and primary location.

Never put a Supabase service-role key in an Expo app.

### News, events, push, and calendar deployment

1. Apply Drizzle migration `0004_sticky_the_twelve.sql`, then Supabase migration `005_news_events.sql`.
2. Run `supabase/tests/005_news_events_rls.sql`. Success returns without an assertion error and rolls back every fixture.
3. Link the Expo project with EAS so `extra.eas.projectId` is available to `expo-notifications`, then configure APNs and FCM credentials.
4. Deploy both functions with JWT verification enabled:

```bash
supabase functions deploy dispatch-event-notifications
supabase functions deploy check-push-receipts
```

5. Create an unpredictable notification cron secret and set it on both Edge Functions:

```bash
supabase secrets set EVENT_NOTIFICATION_CRON_SECRET=YOUR_LONG_RANDOM_VALUE
```

6. Add these values to Supabase Vault using **Database → Vault**:
   - `project_url`: the project URL, such as `https://PROJECT_REF.supabase.co`
   - `anon_key`: the project publishable/anon JWT used only to pass Edge Function JWT verification
   - `event_notification_cron_secret`: the exact value set as `EVENT_NOTIFICATION_CRON_SECRET`
7. Apply `supabase/migrations/006_event_notification_cron.sql` only after the functions and Vault secrets exist.
8. Build a native development client. Calendar and remote push behavior are not accepted through Expo Go:

```bash
pnpm exec expo run:ios
# or
pnpm exec expo run:android
```

9. As an owner/admin/manager, open **Business portal → News & events**, create a draft, schedule or publish it, edit a published event, then cancel it.
10. With a separate customer account, browse the News tab, follow the shop, allow notifications, toggle shop alerts, open a notification, and add the event through the native calendar form.
11. Verify finance, barista, viewer, suspended, applicant, platform-admin-only, and anonymous scenarios cannot mutate content.

The app never contains the service-role key. Edge Functions receive it from the Supabase runtime. Cron requests also require the separate `x-cron-secret`, while delivery functions use idempotent database jobs and Expo receipt processing.

### Customer marketplace and offline reading

1. Apply `supabase/migrations/007_public_marketplace.sql` after migration `006`.
2. Run `supabase/tests/007_public_marketplace_rls.sql`; it rolls back its fixtures and should finish without an assertion error.
3. Browse the Discover catalog, open a shop, menu, news post, and event while online.
4. Close the app, enable airplane mode, and reopen it within 24 hours. Previously viewed customer data and downloaded images remain readable with an offline notice.
5. Confirm uncached screens show an offline empty state and follow/alert mutations ask the customer to reconnect.
6. Reconnect and confirm visible stale queries refresh. Sign out and confirm account-scoped followed data is removed.

TanStack Query persists only explicitly marked customer-reading queries to AsyncStorage. Business management, team, applications, profile data, errors, and mutations are never persisted. Infinite feeds retain at most two pages, cache entries expire after 24 hours, and Expo Image uses stable disk-cache keys for previously viewed media. Offline writes are intentionally outside this release.

### UK legal-profile deployment

1. Apply Drizzle migration `0005_uk_legal_profiles.sql` before Supabase migration `008_uk_legal_profiles.sql`.
2. Run `supabase/tests/008_uk_legal_profiles_rls.sql`. It must finish without an assertion error and rolls back every fixture.
3. Open **Business portal → Payments** as a finance member, complete a draft, and submit it.
4. Confirm manager, barista, viewer, suspended-member, applicant, platform-admin-only, and anonymous accounts cannot open or read the legal profile.
5. Open the submission as an owner/admin, return it with a note, then resubmit and approve it using the authority-and-accuracy attestation.
6. Edit the approved profile as finance and confirm approval is removed and the profile returns to draft.
7. Use two authorised sessions to confirm a stale revision produces a refresh message rather than overwriting newer information.

Local Mug stores ordinary UK business identity details only. It does not store UTRs, bank details, personal identity documents, directors, beneficial owners, dates of birth, National Insurance numbers, or future provider-onboarding answers. The current checks validate format and owner approval; they do not claim Companies House, HMRC, Stripe, or PayPal verification.

### Payments deployment

1. Apply Drizzle migration `0006_open_joystick.sql`, then Supabase migration `009_payments_orders.sql`.
2. Run `supabase/tests/009_payments_orders_rls.sql` in the SQL editor; it is transactional and rolls back its fixtures.
3. Deploy `payments-api` with JWT verification enabled. Deploy `stripe-webhook`, `paypal-webhook`, `payment-return`, and `process-payment-jobs` without Supabase JWT verification; those endpoints perform their own signature/state/cron authentication.
4. Configure Edge Function secrets: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PARTNER_MERCHANT_ID`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENVIRONMENT`, `PAYMENT_RETURN_URL`, `PAYMENT_CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. Set `PAYMENT_RETURN_URL` to the public HTTPS URL of `payment-return`. Register the Stripe Connect webhook and PayPal webhook against their respective functions.
6. Schedule `process-payment-jobs` every minute using Supabase Cron/Vault and send `x-cron-secret` with the configured secret.
7. Create a new development build. Stripe Terminal, Apple Pay, and Google Pay cannot be accepted in Expo Go.

The Stripe Terminal package is loaded only after an eligible native build opens the **Till** tab. It is not initialized in Expo Go, so the rest of the app can start and remain usable there.

Provider secrets never enter Expo or application tables. Stripe uses connected-account direct charges with no Local Mug application fee. PayPal is shown only for ready sellers. Customer payments are captured immediately, shops receive ten minutes to confirm, and rejection/expiry creates an idempotent full-refund job.

Pending external gates are PayPal multiparty approval/live credentials, Apple Developer Merchant ID and Apple Pay certificate, Google Pay production acceptance, Stripe Connect live review, and physical WisePad 3 acceptance.

### Rewards and loyalty deployment

1. Apply Drizzle migration `0007_configurable_loyalty.sql`.
2. Apply Supabase migration `010_configurable_loyalty.sql` after Drizzle `0007` and Supabase `009`.
3. Run `supabase/tests/010_configurable_loyalty_rls.sql` in the SQL editor. It is transactional and rolls back all fixtures.
4. Create a new development build after installing the updated dependencies; staff QR scanning uses the SDK 57 `expo-camera` plugin and camera permission.
5. As an owner, create and publish a stamp programme, points-per-pound programme, points-per-item programme, tier perk, balance reward, and meal deal.
6. With a customer account, explicitly join programmes and generate an earning code. Scan it as a barista, enter the verified external-till basket, and confirm progress.
7. Generate and consume a reward code, then confirm the same screenshot/code cannot be reused and that the immutable ledger reflects the redemption.
8. Link a menu item to a published event and verify the badge/window and cancellation behavior in the public shop menu.

Loyalty mutations are online-only. QR values are opaque, hashed at rest, single-use, business/purpose bound, and contain no customer ID or balance. Customers cannot submit spend or alter balances. Until payment development resumes, staff confirmation records a verified external-till purchase but Local Mug does not claim independent payment verification.

## Database workflow

Drizzle is the source of truth for application table shape and TypeScript row types:

```bash
pnpm run db:generate
pnpm run db:migrate
```

Set `DATABASE_URL` in `.env.local` before running Drizzle commands. Use a server-only Supabase Postgres connection string. Do not use `DATABASE_URL` inside React Native screens or commit real database passwords.

When you change `src/db/schema.ts`, run `pnpm run db:generate` to create a new SQL migration under `drizzle/`, then `pnpm run db:migrate` to apply it to the database.

Supabase-specific security still lives in SQL:

- Auth trigger that creates `profiles`
- RLS policies
- Storage buckets and storage policies
- Database functions such as secure stamp issuing/redemption

Profile images use the `profile-images` bucket. The bucket only accepts JPEG, PNG, and WebP files up to 5 MB. Object policies require the first path segment to match the authenticated user ID, and the app verifies both file metadata and image signatures before upload. SVG is intentionally unsupported.

That split keeps normal tables typed through Drizzle while preserving Supabase features that Drizzle does not model cleanly.

## Application API boundaries

Mobile features call Supabase through their feature-scoped `api.ts` modules. Authentication and media use Supabase Auth and Storage, tenant mutations use RLS-protected database functions, and operations requiring service credentials run in Supabase Edge Functions. The mobile app never connects directly to Postgres or receives service-role credentials.

## Product architecture

### Mobile

- Expo + React Native + TypeScript
- Supabase Auth for email/password first; add Apple and Google after the core flow
- Supabase Postgres with generated TypeScript database types
- Supabase Storage for business covers, logos, news images, and menu photos
- Expo Notifications for followed-shop event reminders, changes, and cancellations
- Expo Location for nearby shops; PostGIS is a later optimization

### Key model choices

- `profiles.role` controls the primary app experience; business access is granted independently through active `business_memberships`.
- A business has one protected owner in the MVP and can add staff with permission-based roles.
- Posts explicitly distinguish news and events, store constrained rich-text JSON, derive draft/scheduled/published state from publication timestamps, and retain cancelled events until archived.
- Rewards support independent stamp and points programmes, versioned rules, programme tiers, balance rewards, reusable perks, promotions, and meal deals.
- Loyalty balances are derived from an immutable ledger. Staff-verified earning, redemption, and reversal use trusted RPCs and short-lived single-use QR challenges; customers cannot write balances directly.
- Reviews target either a whole business or one menu item and enforce one review per author/target.

## Delivery plan

### Phase 1 — Foundation and validation

- Finalize name, visual identity, target launch area, and loyalty rules.
- Connect Supabase, implement signup/sign-in, role onboarding, and session routing.
- Add business creation/editing and client discovery backed by real data.
- Validate reward fraud controls and local privacy/consumer requirements.

### Phase 2 — Marketplace MVP

- Business profile, logo/header uploads, links, opening hours, location, and menu CRUD.
- Customer joins/follows a shop, reads news/events, and rates shops/menu items.
- Stamp card wallet with a business-side QR scan or short-code issuing flow.
- Search, filters, distance sorting, loading/error/empty states, and basic moderation/reporting.

### Phase 3 — Rich loyalty and engagement

- Complete physical-device acceptance for QR earning/redemption and production monitoring of loyalty fraud signals.
- Pinned events, push notifications, saved shops, and personalized feed.
- Business insights: members, stamp issuance, redemptions, ratings, and popular items.
- Staff roles and audit history.

### Phase 4 — Launch quality

- Accessibility and device-size QA, offline behavior, analytics, crash reporting, and performance.
- Account deletion, data export, moderation workflow, terms, privacy policy, and App Store materials.
- Automated tests for auth/RLS and loyalty invariants; EAS preview and production builds.

## Recommended next implementation slice

Deploy and accept the news/events slice:

1. Apply Drizzle `0004`, Supabase `005`, and the transactional `005` RLS test.
2. Deploy the notification functions, configure EAS/APNs/FCM and Vault, then apply Supabase `006`.
3. Complete owner/admin/manager and denied-role acceptance with separate accounts.
4. Complete physical-device notification, deep-link, opt-out, and calendar acceptance.
5. Record the results in `PLANS.md`, then continue with customer menu integration or routing/workspace selection.
