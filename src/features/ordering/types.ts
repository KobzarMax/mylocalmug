export type OrderChannel = 'customer' | 'till';
export type OrderStatus =
  | 'awaiting_payment'
  | 'needs_confirmation'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded';
export type OrderPaymentStatus =
  'unpaid' | 'processing' | 'paid' | 'refund_pending' | 'partially_refunded' | 'refunded' | 'failed';
export type BasketLine = { menuItemId: string; name: string; unitPricePence: number; quantity: number };
export type OrderItemSnapshot = {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
};
export type Order = {
  id: string;
  businessId: string;
  locationId: string;
  customerId: string | null;
  createdBy: string;
  channel: OrderChannel;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  currency: 'GBP';
  subtotalPence: number;
  totalPence: number;
  refundedPence: number;
  confirmationDeadline: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemSnapshot[];
};
export type TillBasket = { businessId: string; items: BasketLine[]; totalPence: number };
