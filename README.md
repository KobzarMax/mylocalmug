# Local Mug

An Expo + Supabase mobile app for connecting independent coffee shops with local customers.

## What exists now

- A runnable Expo SDK 57 TypeScript app
- Role selection for customer and business experiences
- Customer discovery, coffee-shop detail, menu ratings, reward wallet, news, and profile screens
- Business dashboard with menu, post, reward, and event entry points
- A Supabase client configured for React Native session persistence
- Native email confirmation with a persisted pending state, resend cooldown, copied OTP entry, and `localmug://auth/confirm` callback handling
- An initial SQL migration with profiles, businesses, menus, posts/events, memberships, reviews, and flexible loyalty rewards
- Drizzle schema and CLI scripts for typed table migrations
- A starter tRPC router for typed server/API operations
- Row Level Security policies and media buckets
- iOS profile editing with avatar upload, a 200-character description, confirmed email changes, password changes, and favourite coffee spots
- Business access applications with draft, review, approval, rejection, and resubmission states
- Approved-owner workspaces with permission-aware navigation and editable public business details, location, and opening hours
- Staff membership roles and database permission helpers for owner, admin, manager, finance, barista, and viewer access
- Employee invitation, acceptance, revocation, role changes, suspension, removal, and team audit foundations
- Permission-aware Team screens with a hashed, manually shared, single-use invitation code
- Mock data so the product can be previewed before Supabase is connected

## Run locally

```bash
cp .env.example .env
pnpm start
```

Then scan the QR code with Expo Go, or press `i`, `a`, or `w` for another target. The current UI works without filling in `.env`.

To connect Supabase:

1. Create a Supabase project.
2. Set `DATABASE_URL` and run `pnpm run db:migrate` to create tables from Drizzle.
3. Run `supabase/migrations/001_supabase_security.sql` in the SQL Editor to add auth triggers, RLS policies, and storage buckets.
4. Run `supabase/migrations/002_business_profiles.sql` to add application, staff-permission, and business-profile policies.
5. Run `pnpm run db:migrate` again when needed to apply `drizzle/0003_employee_invitations.sql`, then run `supabase/migrations/003_employee_invitations.sql`.
6. Run `supabase/tests/003_employee_invitations_rls.sql` in the SQL Editor. It is transactional and rolls back its test records.
7. Put the project URL and publishable/anon key in `.env`.
8. Restart Expo so the public environment variables are bundled.

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

## Typed API plan

tRPC files live under `src/server`. The mobile app should call tRPC once an API host exists, but it should not connect directly to Postgres. Good first tRPC endpoints:

- `publishedBusinesses` for customer discovery
- `joinBusiness` for following a coffee shop
- Business menu/news/reward mutations
- Secure loyalty stamp issuing through server-side checks

Profile data and favourites have typed tRPC procedures under `profile.*`. Email and password changes intentionally go straight through Supabase Auth so credentials never pass through the application API. The tRPC context validates the Supabase bearer token before exposing a user ID.

## Product architecture

### Mobile

- Expo + React Native + TypeScript
- Supabase Auth for email/password first; add Apple and Google after the core flow
- Supabase Postgres with generated TypeScript database types
- Supabase Storage for business covers, logos, news images, and menu photos
- Expo Notifications for news, pinned events, and reward milestones
- Expo Location for nearby shops; PostGIS is a later optimization

### Key model choices

- `profiles.role` controls the primary app experience; business access is granted independently through active `business_memberships`.
- A business has one protected owner in the MVP and can add staff with permission-based roles.
- Posts support ordinary news and events; event dates and `is_pinned` distinguish event posts.
- Rewards support stamp cards, bonuses, and combos. `reward_items` links a reward to one or more menu items.
- Stamp changes are stored as immutable transactions. In production, issuing/redeeming stamps should happen through a secure database function or Edge Function, not direct client updates.
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

- Bonus rewards, meal deals, combos, redemption history, and expiry.
- Pinned events, push notifications, saved shops, and personalized feed.
- Business insights: members, stamp issuance, redemptions, ratings, and popular items.
- Staff roles and audit history.

### Phase 4 — Launch quality

- Accessibility and device-size QA, offline behavior, analytics, crash reporting, and performance.
- Account deletion, data export, moderation workflow, terms, privacy policy, and App Store materials.
- Automated tests for auth/RLS and loyalty invariants; EAS preview and production builds.

## Recommended next implementation slice

Continue with the employee invitation lifecycle:

1. Apply Drizzle `0003`, then Supabase `003`.
2. Run the transactional invitation/RLS test script.
3. Test the owner-to-employee invitation lifecycle with separate accounts on a physical device.
4. Record and fix any permission failures.
5. Add workspace selection and protected Expo Router route groups using SDK 57 patterns.
