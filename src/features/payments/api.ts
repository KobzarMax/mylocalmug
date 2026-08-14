import { supabase } from '../../lib/supabase';
import { CustomerPaymentSetup, PayPalPaymentSetup, PaymentConnection } from './types';

async function invoke<T>(body:Record<string,unknown>){const result=await supabase.functions.invoke('payments-api',{body});if(result.error)throw result.error;if(result.data?.error)throw new Error(String(result.data.error));return result.data as T;}
export async function listPaymentConnections(businessId:string){const rows=await invoke<Record<string,unknown>[]>({action:'list-connections',businessId});return rows.map(mapConnection);}
export const getAvailablePaymentMethods=(businessId:string)=>invoke<{stripe:boolean;paypal:boolean}>({action:'available-methods',businessId});
export const startStripeOnboarding=(businessId:string)=>invoke<{url:string;expiresAt:string}>({action:'start-stripe-onboarding',businessId});
export const startPayPalOnboarding=(businessId:string)=>invoke<{url:string}>({action:'start-paypal-onboarding',businessId});
export const refreshPaymentConnection=(businessId:string,provider:'stripe'|'paypal')=>invoke<Record<string,unknown>>({action:'refresh-connection',businessId,method:provider}).then(mapConnection);
export const disablePaymentConnection=(businessId:string,provider:'stripe'|'paypal')=>invoke<Record<string,unknown>>({action:'disable-connection',businessId,method:provider}).then(mapConnection);
export const createStripePayment=(orderId:string,method:string,idempotencyKey:string)=>invoke<CustomerPaymentSetup>({action:'create-stripe-payment',orderId,method,idempotencyKey});
export const createPayPalPayment=(orderId:string,idempotencyKey:string)=>invoke<PayPalPaymentSetup>({action:'create-paypal-payment',orderId,idempotencyKey});
export const createTerminalPayment=(orderId:string,idempotencyKey:string)=>invoke<CustomerPaymentSetup>({action:'create-terminal-payment',orderId,idempotencyKey});
export const getTerminalToken=(businessId:string)=>invoke<{secret:string}>({action:'terminal-token',businessId});
export const setupTerminalLocation=(businessId:string)=>invoke<Record<string,unknown>>({action:'setup-terminal-location',businessId});
export const syncTerminalReaders=(businessId:string)=>invoke<{count:number}>({action:'sync-terminal-readers',businessId});
export const recoverPaymentOrder=(orderId:string)=>invoke<Record<string,unknown>>({action:'recover-order',orderId});
export const requestRefund=(orderId:string,amountPence:number,reason:string,idempotencyKey:string)=>invoke<Record<string,unknown>>({action:'refund',orderId,amountPence,method:reason,idempotencyKey});
function mapConnection(row:Record<string,unknown>):PaymentConnection{return{id:String(row.id),businessId:String(row.business_id),provider:row.provider as PaymentConnection['provider'],providerAccountId:row.provider_account_id?String(row.provider_account_id):null,status:row.status as PaymentConnection['status'],chargesEnabled:Boolean(row.charges_enabled),payoutsEnabled:Boolean(row.payouts_enabled),requirements:(row.requirements??{}) as Record<string,unknown>,lastSyncedAt:row.last_synced_at?String(row.last_synced_at):null};}
