
import { Invoice, StripeConnection, Business, SubscriptionPack } from '../types';
import { supabase } from './supabase'; // IMPORT SUPABASE CLIENT

interface PaymentMethod {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

interface FinancialResult {
  base: number;
  taxAmount: number;
  total: number;
  taxRate: number;
}

interface BillingResult {
    updatedBusinesses: Business[];
    newInvoices: Invoice[];
    logs: string[];
}

// STRIPE SERVICE (PHASE 3: SERVER-SIDE INTEGRATION)
export const stripeService = {
  
  // Calculate Base + Tax (Utility)
  calculateFinancials: (baseAmount: number, taxRate: number = 21): FinancialResult => {
    const taxAmount = baseAmount * (taxRate / 100);
    const total = baseAmount + taxAmount;
    return {
      base: parseFloat(baseAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      taxRate
    };
  },

  // 1. CREATE CUSTOMER (Calls Edge Function)
  createCustomer: async (email: string, name: string, paymentMethod: PaymentMethod): Promise<{ customerId: string, last4: string, brand: string }> => {
    if (supabase) {
        // CALL EDGE FUNCTION
        const { data, error } = await supabase.functions.invoke('stripe-create-customer', {
            body: { email, name, paymentMethod }
        });

        if (error) {
            console.warn("Edge Function failed (Likely not deployed). Falling back to mock.");
        } else {
            return data;
        }
    }

    // FALLBACK MOCK (If function not deployed)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!paymentMethod.number || paymentMethod.number.length < 12) {
          reject(new Error("Número de tarjeta inválido."));
          return;
        }
        resolve({
          customerId: `cus_mock_${Math.random().toString(36).substr(2, 9)}`,
          last4: paymentMethod.number.slice(-4),
          brand: paymentMethod.number.startsWith('4') ? 'Visa' : 'MasterCard'
        });
      }, 1500);
    });
  },

  // 2. PROCESS PAYMENT (Calls Edge Function)
  processPayment: async (
    customerId: string | undefined, 
    amount: number, 
    description: string,
    paymentMethod?: PaymentMethod
  ): Promise<{ success: boolean; transactionId: string; invoiceId: string }> => {
    if (supabase) {
        const { data, error } = await supabase.functions.invoke('stripe-charge', {
            body: { customerId, amount, description }
        });

        if (!error) return data;
    }

    // FALLBACK MOCK
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: `ch_${Math.random().toString(36).substr(2, 18)}`,
          invoiceId: `in_${Math.random().toString(36).substr(2, 18)}`
        });
      }, 2000);
    });
  },

  // 3. CREATE SUBSCRIPTION (Calls Edge Function)
  createSubscription: async (customerId: string, priceId: string): Promise<{ subscriptionId: string; status: string; nextBilling: string }> => {
    if (supabase) {
        const { data, error } = await supabase.functions.invoke('stripe-subscription', {
            body: { customerId, priceId }
        });
        if (!error) return data;
    }

    // FALLBACK MOCK
    return new Promise((resolve) => {
      setTimeout(() => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        resolve({
          subscriptionId: `sub_${Math.random().toString(36).substr(2, 14)}`,
          status: 'active',
          nextBilling: nextMonth.toISOString().split('T')[0]
        });
      }, 1000);
    });
  },

  // 4. CONNECT ACCOUNT (OAuth Flow Simulation)
  connectAccount: async (email: string): Promise<StripeConnection> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'connected',
          accountId: `acct_${Math.random().toString(36).substr(2, 14)}`,
          lastSync: new Date().toISOString(),
          webhookStatus: 'active'
        });
      }, 2500);
    });
  },

  getInvoiceUrl: (invoiceId: string) => {
    return `https://pay.stripe.com/invoice/${invoiceId}/pdf`;
  },

  // --- SERVER-SIDE CRON JOB SIMULATION ---
  processRecurringBilling: async (
      businesses: Business[], 
      subscriptionPacks: SubscriptionPack[]
  ): Promise<BillingResult> => {
      return new Promise((resolve) => {
          setTimeout(() => {
            const today = new Date();
            const updatedBusinesses: Business[] = [];
            const newInvoices: Invoice[] = [];
            const logs: string[] = [];

            businesses.forEach(biz => {
                let updatedBiz = { ...biz };
                
                if (biz.stripeConnection?.nextBillingDate && biz.status === 'active') {
                    const billingDate = new Date(biz.stripeConnection.nextBillingDate);
                    
                    if (billingDate <= today) {
                        const pack = subscriptionPacks.find(p => p.id === biz.packId);
                        
                        if (pack) {
                            const amount = biz.billingCycle === 'annual' ? pack.annualPriceYear1 : pack.monthlyPrice;
                            const financials = stripeService.calculateFinancials(amount);

                            const newInvoice: Invoice = {
                                id: `INV-AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                business_id: biz.id,
                                business_name: 'ELEMEDE SL',
                                business_nif: 'B12345678',
                                client_name: biz.name,
                                client_nif: biz.nif,
                                date: today.toISOString().split('T')[0],
                                due_date: today.toISOString().split('T')[0],
                                base_amount: financials.base,
                                iva_rate: financials.taxRate,
                                iva_amount: financials.taxAmount,
                                irpf_rate: 0,
                                irpf_amount: 0,
                                total_amount: financials.total,
                                status: 'paid',
                                concept: `Renovación Automática ${pack.label} (${biz.billingCycle})`,
                                quarter: Math.floor(today.getMonth() / 3) + 1,
                                stripe_fee: financials.total * 0.029 + 0.25
                            };

                            newInvoices.push(newInvoice);

                            const nextDate = new Date(billingDate);
                            if (biz.billingCycle === 'annual') {
                                nextDate.setFullYear(nextDate.getFullYear() + 1);
                            } else {
                                nextDate.setMonth(nextDate.getMonth() + 1);
                            }

                            updatedBiz = {
                                ...updatedBiz,
                                stripeConnection: {
                                    ...updatedBiz.stripeConnection!,
                                    nextBillingDate: nextDate.toISOString().split('T')[0]
                                }
                            };

                            logs.push(`[SERVER] Cobro exitoso a ${biz.name}: ${financials.total}€`);
                        }
                    }
                }
                updatedBusinesses.push(updatedBiz);
            });

            resolve({ updatedBusinesses, newInvoices, logs });
          }, 3000); 
      });
  }
};
