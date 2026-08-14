import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  integer,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['client', 'business']);
export const rewardType = pgEnum('reward_type', ['stamp_card', 'bonus', 'combo']);
export const reviewTarget = pgEnum('review_target', ['business', 'menu_item']);
export const businessApplicationStatus = pgEnum('business_application_status', [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'withdrawn',
]);
export const businessStatus = pgEnum('business_status', ['onboarding', 'active', 'suspended', 'closed']);
export const businessMemberRole = pgEnum('business_member_role', [
  'owner',
  'admin',
  'manager',
  'finance',
  'barista',
  'viewer',
]);
export const businessMembershipStatus = pgEnum('business_membership_status', [
  'invited',
  'active',
  'suspended',
  'removed',
]);
export const ukLegalEntityType = pgEnum('uk_legal_entity_type', [
  'sole_trader',
  'limited_company',
  'limited_liability_partnership',
  'partnership',
  'charity',
  'other_organisation',
]);
export const legalProfileStatus = pgEnum('legal_profile_status', [
  'draft',
  'pending_approval',
  'approved',
]);
export const businessInvitationStatus = pgEnum('business_invitation_status', [
  'pending',
  'accepted',
  'revoked',
  'expired',
]);
export const postKind = pgEnum('post_kind', ['news', 'event']);
export const eventNotificationJobType = pgEnum('event_notification_job_type', [
  'reminder',
  'updated',
  'cancelled',
]);
export const notificationJobStatus = pgEnum('notification_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);
export const pushDeliveryStatus = pgEnum('push_delivery_status', [
  'pending',
  'ticketed',
  'delivered',
  'failed',
]);
export const paymentProvider = pgEnum('payment_provider', ['stripe', 'paypal']);
export const paymentConnectionStatus = pgEnum('payment_connection_status', ['not_started', 'onboarding', 'restricted', 'ready', 'disabled', 'revoked']);
export const paymentJobType = pgEnum('payment_job_type', ['expire_order', 'refund', 'reconcile']);
export const paymentJobStatus = pgEnum('payment_job_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
export const orderChannel = pgEnum('order_channel', ['customer', 'till']);
export const orderStatus = pgEnum('order_status', ['awaiting_payment', 'needs_confirmation', 'accepted', 'preparing', 'ready', 'completed', 'cancelled', 'refund_pending', 'refunded']);
export const orderPaymentStatus = pgEnum('order_payment_status', ['unpaid', 'processing', 'paid', 'refund_pending', 'partially_refunded', 'refunded', 'failed']);
export const paymentMethod = pgEnum('payment_method', ['card', 'apple_pay', 'google_pay', 'paypal', 'terminal_card']);
export const paymentStatus = pgEnum('payment_status', ['created', 'requires_action', 'processing', 'succeeded', 'failed', 'cancelled', 'partially_refunded', 'refunded']);
export const refundStatus = pgEnum('refund_status', ['pending', 'processing', 'succeeded', 'failed', 'cancelled']);

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    role: userRole('role').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description').default('').notNull(),
    avatarPath: text('avatar_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    displayNameCheck: check(
      'profiles_display_name_check',
      sql`char_length(btrim(${table.displayName})) between 1 and 80`,
    ),
    descriptionCheck: check(
      'profiles_description_check',
      sql`char_length(${table.description}) <= 200`,
    ),
    avatarPathCheck: check(
      'profiles_avatar_path_check',
      sql`${table.avatarPath} is null or (
        split_part(${table.avatarPath}, '/', 1) = ${table.id}::text
        and ${table.avatarPath} ~ '^[0-9a-f-]{36}/avatar-[0-9]+\\.(jpg|png|webp)$'
      )`,
    ),
  }),
);

export const businessApplications = pgTable(
  'business_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicantId: uuid('applicant_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    status: businessApplicationStatus('status').default('draft').notNull(),
    tradingName: text('trading_name').notNull(),
    legalName: text('legal_name').default('').notNull(),
    description: text('description').default('').notNull(),
    category: text('category').default('Independent coffee shop').notNull(),
    contactEmail: text('contact_email').notNull(),
    contactPhone: text('contact_phone').default('').notNull(),
    websiteUrl: text('website_url').default('').notNull(),
    address: text('address').notNull(),
    companyNumber: text('company_number').default('').notNull(),
    vatNumber: text('vat_number').default('').notNull(),
    rejectionReason: text('rejection_reason'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    applicantIdx: uniqueIndex('business_applications_applicant_id_unique').on(table.applicantId),
    tradingNameCheck: check(
      'business_applications_trading_name_check',
      sql`char_length(btrim(${table.tradingName})) between 2 and 120`,
    ),
    descriptionCheck: check(
      'business_applications_description_check',
      sql`char_length(${table.description}) <= 1000`,
    ),
  }),
);

export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description').default('').notNull(),
    address: text('address').default('').notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    logoUrl: text('logo_url'),
    headerUrl: text('header_url'),
    socialLinks: jsonb('social_links').default({}).notNull(),
    category: text('category').default('Independent coffee shop').notNull(),
    contactEmail: text('contact_email').default('').notNull(),
    contactPhone: text('contact_phone').default('').notNull(),
    websiteUrl: text('website_url').default('').notNull(),
    status: businessStatus('status').default('onboarding').notNull(),
    isPublished: boolean('is_published').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('businesses_slug_unique').on(table.slug),
  }),
);

export const businessLegalProfiles = pgTable(
  'business_legal_profiles',
  {
    businessId: uuid('business_id')
      .primaryKey()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    country: text('country').default('GB').notNull(),
    entityType: ukLegalEntityType('entity_type').default('other_organisation').notNull(),
    legalName: text('legal_name').default('').notNull(),
    tradingName: text('trading_name').default('').notNull(),
    registeredAddressLine1: text('registered_address_line1').default('').notNull(),
    registeredAddressLine2: text('registered_address_line2').default('').notNull(),
    registeredTownCity: text('registered_town_city').default('').notNull(),
    registeredCounty: text('registered_county').default('').notNull(),
    registeredPostcode: text('registered_postcode').default('').notNull(),
    contactEmail: text('contact_email').default('').notNull(),
    contactPhone: text('contact_phone').default('').notNull(),
    companyNumber: text('company_number').default('').notNull(),
    charityNumber: text('charity_number').default('').notNull(),
    vatRegistered: boolean('vat_registered').default(false).notNull(),
    vatNumber: text('vat_number').default('').notNull(),
    status: legalProfileStatus('status').default('draft').notNull(),
    revision: integer('revision').default(1).notNull(),
    changeRequestNote: text('change_request_note').default('').notNull(),
    lastEditedBy: uuid('last_edited_by').references(() => profiles.id, { onDelete: 'set null' }),
    submittedBy: uuid('submitted_by').references(() => profiles.id, { onDelete: 'set null' }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    approvedBy: uuid('approved_by').references(() => profiles.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    countryCheck: check('business_legal_profiles_country_check', sql`${table.country} = 'GB'`),
    revisionCheck: check('business_legal_profiles_revision_check', sql`${table.revision} > 0`),
    vatCheck: check('business_legal_profiles_vat_check', sql`${table.vatRegistered} or ${table.vatNumber} = ''`),
    legalNameCheck: check('business_legal_profiles_legal_name_check', sql`char_length(${table.legalName}) <= 160`),
    tradingNameCheck: check('business_legal_profiles_trading_name_check', sql`char_length(${table.tradingName}) <= 120`),
    addressCheck: check('business_legal_profiles_address_check', sql`
      char_length(${table.registeredAddressLine1}) <= 160
      and char_length(${table.registeredAddressLine2}) <= 160
      and char_length(${table.registeredTownCity}) <= 100
      and char_length(${table.registeredCounty}) <= 100
    `),
    postcodeCheck: check('business_legal_profiles_postcode_check', sql`
      ${table.registeredPostcode} = '' or ${table.registeredPostcode} ~ '^(GIR 0AA|[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2})$'
    `),
    emailCheck: check('business_legal_profiles_email_check', sql`
      ${table.contactEmail} = '' or (${table.contactEmail} = lower(${table.contactEmail}) and ${table.contactEmail} ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')
    `),
    phoneCheck: check('business_legal_profiles_phone_check', sql`
      ${table.contactPhone} = '' or (${table.contactPhone} ~ '^[+]?[0-9 ()-]{7,25}$' and char_length(${table.contactPhone}) <= 30)
    `),
    companyNumberCheck: check('business_legal_profiles_company_number_check', sql`
      (${table.entityType} in ('limited_company', 'limited_liability_partnership') and (${table.companyNumber} = '' or ${table.companyNumber} ~ '^([0-9]{8}|[A-Z]{2}[0-9]{6})$'))
      or (${table.entityType} not in ('limited_company', 'limited_liability_partnership') and ${table.companyNumber} = '')
    `),
    charityNumberCheck: check('business_legal_profiles_charity_number_check', sql`
      (${table.entityType} = 'charity' and (${table.charityNumber} = '' or ${table.charityNumber} ~ '^([0-9]{6,8}(-[0-9]{1,2})?|[A-Z]{2}[0-9]{6})$'))
      or (${table.entityType} <> 'charity' and ${table.charityNumber} = '')
    `),
    vatNumberCheck: check('business_legal_profiles_vat_number_check', sql`
      ${table.vatNumber} = '' or ${table.vatNumber} ~ '^GB[0-9]{9}([0-9]{3})?$'
    `),
    noteCheck: check('business_legal_profiles_note_check', sql`char_length(${table.changeRequestNote}) <= 1000`),
  }),
);

export const businessFollowers = pgTable(
  'business_followers',
  {
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    eventNotificationsEnabled: boolean('event_notifications_enabled').default(true).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.businessId, table.clientId] }),
  }),
);

export const businessMemberships = pgTable(
  'business_memberships',
  {
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: businessMemberRole('role').notNull(),
    status: businessMembershipStatus('status').default('active').notNull(),
    invitedBy: uuid('invited_by').references(() => profiles.id, { onDelete: 'set null' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.businessId, table.profileId] }),
  }),
);

export const businessInvitations = pgTable(
  'business_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: businessMemberRole('role').notNull(),
    tokenHash: text('token_hash').notNull(),
    status: businessInvitationStatus('status').default('pending').notNull(),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'restrict' }),
    acceptedBy: uuid('accepted_by').references(() => profiles.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('business_invitations_token_hash_unique').on(table.tokenHash),
    pendingEmailIdx: uniqueIndex('business_invitations_pending_email_unique')
      .on(table.businessId, table.email)
      .where(sql`${table.status} = 'pending'`),
    emailCheck: check('business_invitations_email_check', sql`${table.email} = lower(btrim(${table.email}))`),
    roleCheck: check('business_invitations_role_check', sql`${table.role} <> 'owner'`),
  }),
);

export const businessAuditLogs = pgTable('business_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => profiles.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetProfileId: uuid('target_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const businessLocations = pgTable('business_locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').default('Main location').notNull(),
  address: text('address').default('').notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  phone: text('phone').default('').notNull(),
  timezone: text('timezone').default('Europe/London').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const businessHours = pgTable(
  'business_hours',
  {
    locationId: uuid('location_id')
      .notNull()
      .references(() => businessLocations.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    opensAt: text('opens_at'),
    closesAt: text('closes_at'),
    isClosed: boolean('is_closed').default(false).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.locationId, table.dayOfWeek] }),
    dayCheck: check('business_hours_day_of_week_check', sql`${table.dayOfWeek} between 0 and 6`),
    timeCheck: check(
      'business_hours_time_check',
      sql`${table.isClosed} or (${table.opensAt} ~ '^[0-2][0-9]:[0-5][0-9]$' and ${table.closesAt} ~ '^[0-2][0-9]:[0-5][0-9]$')`,
    ),
  }),
);

export const platformAdmins = pgTable('platform_admins', {
  profileId: uuid('profile_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const favoriteBusinesses = pgTable(
  'favorite_businesses',
  {
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.profileId, table.businessId] }),
  }),
);

export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => menuCategories.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description').default('').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    photoUrl: text('photo_url'),
    isAvailable: boolean('is_available').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    priceCheck: check('menu_items_price_check', sql`${table.price} >= 0`),
  }),
);

export const paymentConnections = pgTable('payment_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  provider: paymentProvider('provider').notNull(),
  providerAccountId: text('provider_account_id'),
  status: paymentConnectionStatus('status').default('not_started').notNull(),
  chargesEnabled: boolean('charges_enabled').default(false).notNull(),
  payoutsEnabled: boolean('payouts_enabled').default(false).notNull(),
  requirements: jsonb('requirements').default({}).notNull(),
  disabledAt: timestamp('disabled_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ providerUnique: uniqueIndex('payment_connections_business_provider_unique').on(table.businessId, table.provider) }));

export const paymentWebhookEvents = pgTable('payment_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: paymentProvider('provider').notNull(),
  providerEventId: text('provider_event_id').notNull(),
  providerAccountId: text('provider_account_id'),
  eventType: text('event_type').notNull(),
  state: text('state').default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  lastError: text('last_error'),
  payload: jsonb('payload').default({}).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ providerEventUnique: uniqueIndex('payment_webhook_events_provider_event_unique').on(table.provider, table.providerEventId) }));

export const paymentReturnStates = pgTable('payment_return_states', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  provider: paymentProvider('provider').notNull(),
  purpose: text('purpose').notNull(),
  tokenHash: text('token_hash').notNull(),
  orderId: uuid('order_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ tokenUnique: uniqueIndex('payment_return_states_token_unique').on(table.tokenHash) }));

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'restrict' }),
  locationId: uuid('location_id').notNull().references(() => businessLocations.id, { onDelete: 'restrict' }),
  customerId: uuid('customer_id').references(() => profiles.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'restrict' }),
  channel: orderChannel('channel').notNull(),
  status: orderStatus('status').default('awaiting_payment').notNull(),
  paymentStatus: orderPaymentStatus('payment_status').default('unpaid').notNull(),
  currency: text('currency').default('GBP').notNull(),
  subtotalPence: integer('subtotal_pence').notNull(),
  totalPence: integer('total_pence').notNull(),
  refundedPence: integer('refunded_pence').default(0).notNull(),
  confirmationDeadline: timestamp('confirmation_deadline', { withTimezone: true }),
  cancellationReason: text('cancellation_reason'),
  idempotencyKey: text('idempotency_key').notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  creatorIdempotencyUnique: uniqueIndex('orders_creator_idempotency_unique').on(table.createdBy, table.idempotencyKey),
  businessStateIdx: index('orders_business_state_idx').on(table.businessId, table.status, table.createdAt),
  totalsCheck: check('orders_totals_check', sql`${table.currency} = 'GBP' and ${table.subtotalPence} >= 0 and ${table.totalPence} = ${table.subtotalPence} and ${table.refundedPence} between 0 and ${table.totalPence}`),
  channelOwnerCheck: check('orders_channel_owner_check', sql`(${table.channel} = 'customer' and ${table.customerId} = ${table.createdBy}) or (${table.channel} = 'till' and ${table.customerId} is null)`),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPricePence: integer('unit_price_pence').notNull(),
  lineTotalPence: integer('line_total_pence').notNull(),
}, (table) => ({ quantityCheck: check('order_items_quantity_check', sql`${table.quantity} between 1 and 99`), amountCheck: check('order_items_amount_check', sql`${table.unitPricePence} >= 0 and ${table.lineTotalPence} = ${table.unitPricePence} * ${table.quantity}`) }));

export const paymentAttempts = pgTable('payment_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  provider: paymentProvider('provider').notNull(),
  method: paymentMethod('method').notNull(),
  amountPence: integer('amount_pence').notNull(),
  currency: text('currency').default('GBP').notNull(),
  status: paymentStatus('status').default('created').notNull(),
  providerIntentId: text('provider_intent_id'),
  providerOrderId: text('provider_order_id'),
  providerCaptureId: text('provider_capture_id'),
  failureCode: text('failure_code'),
  failureMessage: text('failure_message'),
  idempotencyKey: text('idempotency_key').notNull(),
  succeededAt: timestamp('succeeded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ idempotencyUnique: uniqueIndex('payment_attempts_idempotency_unique').on(table.orderId, table.idempotencyKey), providerIntentUnique: uniqueIndex('payment_attempts_provider_intent_unique').on(table.provider, table.providerIntentId), amountCheck: check('payment_attempts_amount_check', sql`${table.currency} = 'GBP' and ${table.amountPence} > 0`) }));

export const paymentRefunds = pgTable('payment_refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  paymentAttemptId: uuid('payment_attempt_id').notNull().references(() => paymentAttempts.id, { onDelete: 'restrict' }),
  amountPence: integer('amount_pence').notNull(),
  reason: text('reason').notNull(),
  requestedBy: uuid('requested_by').references(() => profiles.id, { onDelete: 'set null' }),
  providerRefundId: text('provider_refund_id'),
  status: refundStatus('status').default('pending').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  failureMessage: text('failure_message'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ idempotencyUnique: uniqueIndex('payment_refunds_attempt_idempotency_unique').on(table.paymentAttemptId, table.idempotencyKey), amountCheck: check('payment_refunds_amount_check', sql`${table.amountPence} > 0`), reasonCheck: check('payment_refunds_reason_check', sql`char_length(btrim(${table.reason})) between 3 and 500`) }));

export const paymentJobs = pgTable('payment_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: paymentJobType('type').notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  refundId: uuid('refund_id').references(() => paymentRefunds.id, { onDelete: 'cascade' }),
  status: paymentJobStatus('status').default('pending').notNull(),
  runAt: timestamp('run_at', { withTimezone: true }).notNull(),
  leaseUntil: timestamp('lease_until', { withTimezone: true }),
  attempts: integer('attempts').default(0).notNull(),
  lastError: text('last_error'),
  idempotencyKey: text('idempotency_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ idempotencyUnique: uniqueIndex('payment_jobs_idempotency_unique').on(table.idempotencyKey), dueIdx: index('payment_jobs_due_idx').on(table.status, table.runAt) }));

export const terminalLocations = pgTable('terminal_locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  businessLocationId: uuid('business_location_id').notNull().references(() => businessLocations.id, { onDelete: 'cascade' }),
  providerLocationId: text('provider_location_id').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ locationUnique: uniqueIndex('terminal_locations_business_location_unique').on(table.businessId, table.businessLocationId), providerUnique: uniqueIndex('terminal_locations_provider_unique').on(table.providerLocationId) }));

export const terminalReaders = pgTable('terminal_readers', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  terminalLocationId: uuid('terminal_location_id').notNull().references(() => terminalLocations.id, { onDelete: 'cascade' }),
  providerReaderId: text('provider_reader_id').notNull(),
  label: text('label').notNull(),
  deviceType: text('device_type').notNull(),
  registrationCodeLast4: text('registration_code_last4'),
  status: text('status').default('offline').notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ readerUnique: uniqueIndex('terminal_readers_provider_unique').on(table.providerReaderId) }));

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    kind: postKind('kind').default('news').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt').default('').notNull(),
    bodyDocument: jsonb('body_document').default({ type: 'doc', content: [] }).notNull(),
    bodyText: text('body_text').default('').notNull(),
    coverPath: text('cover_path'),
    authorDisplayName: text('author_display_name').default('Coffee shop team').notNull(),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => profiles.id, { onDelete: 'set null' }),
    eventStartsAt: timestamp('event_starts_at', { withTimezone: true }),
    eventEndsAt: timestamp('event_ends_at', { withTimezone: true }),
    eventAllDay: boolean('event_all_day').default(false).notNull(),
    eventTimezone: text('event_timezone'),
    eventVenueName: text('event_venue_name'),
    eventVenueAddress: text('event_venue_address'),
    eventCancelledAt: timestamp('event_cancelled_at', { withTimezone: true }),
    eventCancellationReason: text('event_cancellation_reason'),
    eventNotificationVersion: integer('event_notification_version').default(1).notNull(),
    isPinned: boolean('is_pinned').default(false).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    titleCheck: check('posts_title_check', sql`char_length(btrim(${table.title})) between 3 and 140`),
    excerptCheck: check('posts_excerpt_check', sql`char_length(${table.excerpt}) <= 300`),
    bodyTextCheck: check('posts_body_text_check', sql`char_length(${table.bodyText}) <= 50000`),
    eventVersionCheck: check('posts_event_notification_version_check', sql`${table.eventNotificationVersion} > 0`),
    eventDatesCheck: check(
      'posts_event_dates_check',
      sql`(
        ${table.kind} = 'news'
        and ${table.eventStartsAt} is null
        and ${table.eventEndsAt} is null
        and ${table.eventTimezone} is null
        and ${table.eventVenueName} is null
        and ${table.eventVenueAddress} is null
        and ${table.eventCancelledAt} is null
      ) or (
        ${table.kind} = 'event'
        and ${table.eventStartsAt} is not null
        and ${table.eventTimezone} is not null
        and (${table.eventEndsAt} is null or ${table.eventEndsAt} > ${table.eventStartsAt})
      )`,
    ),
  }),
);

export const postEventReminders = pgTable(
  'post_event_reminders',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    minutesBefore: integer('minutes_before').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.minutesBefore] }),
    allowedOffsetCheck: check(
      'post_event_reminders_allowed_offset_check',
      sql`${table.minutesBefore} in (60, 1440, 10080)`,
    ),
  }),
);

export const pushDevices = pgTable(
  'push_devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    expoPushToken: text('expo_push_token').notNull(),
    platform: text('platform').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex('push_devices_expo_push_token_unique').on(table.expoPushToken),
    platformCheck: check('push_devices_platform_check', sql`${table.platform} in ('ios', 'android')`),
  }),
);

export const eventNotificationJobs = pgTable(
  'event_notification_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    jobType: eventNotificationJobType('job_type').notNull(),
    reminderMinutes: integer('reminder_minutes').default(0).notNull(),
    eventVersion: integer('event_version').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    status: notificationJobStatus('status').default('pending').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => ({
    jobIdx: uniqueIndex('event_notification_jobs_unique').on(
      table.postId,
      table.jobType,
      table.eventVersion,
      table.reminderMinutes,
    ),
    reminderCheck: check(
      'event_notification_jobs_reminder_check',
      sql`(${table.jobType} = 'reminder' and ${table.reminderMinutes} in (60, 1440, 10080))
        or (${table.jobType} <> 'reminder' and ${table.reminderMinutes} = 0)`,
    ),
    attemptsCheck: check('event_notification_jobs_attempts_check', sql`${table.attempts} >= 0`),
  }),
);

export const pushDeliveries = pgTable(
  'push_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => eventNotificationJobs.id, { onDelete: 'cascade' }),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => pushDevices.id, { onDelete: 'cascade' }),
    expoTicketId: text('expo_ticket_id'),
    status: pushDeliveryStatus('status').default('pending').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    jobDeviceIdx: uniqueIndex('push_deliveries_job_device_unique').on(table.jobId, table.deviceId),
    attemptsCheck: check('push_deliveries_attempts_check', sql`${table.attempts} >= 0`),
  }),
);

export const rewards = pgTable(
  'rewards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    type: rewardType('type').notNull(),
    title: text('title').notNull(),
    description: text('description').default('').notNull(),
    stampsRequired: integer('stamps_required'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    stampsRequiredCheck: check('rewards_stamps_required_check', sql`${table.stampsRequired} > 0`),
  }),
);

export const rewardItems = pgTable(
  'reward_items',
  {
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').default(1).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.rewardId, table.menuItemId] }),
    quantityCheck: check('reward_items_quantity_check', sql`${table.quantity} > 0`),
  }),
);

export const loyaltyWallets = pgTable(
  'loyalty_wallets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    stampCount: integer('stamp_count').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    rewardClientIdx: uniqueIndex('loyalty_wallets_reward_id_client_id_unique').on(table.rewardId, table.clientId),
    stampCountCheck: check('loyalty_wallets_stamp_count_check', sql`${table.stampCount} >= 0`),
  }),
);

export const stampTransactions = pgTable(
  'stamp_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => loyaltyWallets.id, { onDelete: 'cascade' }),
    issuedBy: uuid('issued_by')
      .notNull()
      .references(() => profiles.id),
    amount: integer('amount').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    amountCheck: check('stamp_transactions_amount_check', sql`${table.amount} <> 0`),
  }),
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'cascade' }),
    target: reviewTarget('target').notNull(),
    rating: integer('rating').notNull(),
    body: text('body').default('').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    businessReviewIdx: uniqueIndex('reviews_one_business_review')
      .on(table.authorId, table.businessId)
      .where(sql`${table.menuItemId} is null`),
    menuItemReviewIdx: uniqueIndex('reviews_one_menu_item_review')
      .on(table.authorId, table.menuItemId)
      .where(sql`${table.menuItemId} is not null`),
    ratingCheck: check('reviews_rating_check', sql`${table.rating} between 1 and 5`),
    targetCheck: check(
      'reviews_target_check',
      sql`(${table.target} = 'business' and ${table.menuItemId} is null) or (${table.target} = 'menu_item' and ${table.menuItemId} is not null)`,
    ),
  }),
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type FavoriteBusiness = typeof favoriteBusinesses.$inferSelect;
export type NewFavoriteBusiness = typeof favoriteBusinesses.$inferInsert;
export type BusinessApplication = typeof businessApplications.$inferSelect;
export type NewBusinessApplication = typeof businessApplications.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type BusinessMembership = typeof businessMemberships.$inferSelect;
export type BusinessInvitation = typeof businessInvitations.$inferSelect;
export type BusinessAuditLog = typeof businessAuditLogs.$inferSelect;
export type BusinessLocation = typeof businessLocations.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type PaymentConnection = typeof paymentConnections.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type PaymentAttempt = typeof paymentAttempts.$inferSelect;
export type PaymentRefund = typeof paymentRefunds.$inferSelect;
export type TerminalLocation = typeof terminalLocations.$inferSelect;
export type TerminalReader = typeof terminalReaders.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostEventReminder = typeof postEventReminders.$inferSelect;
export type PushDevice = typeof pushDevices.$inferSelect;
export type EventNotificationJob = typeof eventNotificationJobs.$inferSelect;
export type PushDelivery = typeof pushDeliveries.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
