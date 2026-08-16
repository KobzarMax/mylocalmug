export type PaymentProvider = 'stripe' | 'paypal';
export type PaymentConnectionStatus =
  'not_started' | 'onboarding' | 'restricted' | 'ready' | 'disabled' | 'revoked';
export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'terminal_card';
export type PaymentStatus =
  | 'created'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export type PaymentConnection = {
  id: string;
  businessId: string;
  provider: PaymentProvider;
  providerAccountId: string | null;
  status: PaymentConnectionStatus;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: Record<string, unknown>;
  lastSyncedAt: string | null;
};
export type PaymentAttempt = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  amountPence: number;
  status: PaymentStatus;
  failureMessage: string | null;
  createdAt: string;
};
export type PaymentRefund = {
  id: string;
  orderId: string;
  amountPence: number;
  reason: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  completedAt: string | null;
  createdAt: string;
};
export type CustomerPaymentSetup = {
  attemptId: string;
  clientSecret: string;
  connectedAccountId: string;
  publishableKey: string;
};
export type PayPalPaymentSetup = { attemptId: string; approvalUrl: string };
