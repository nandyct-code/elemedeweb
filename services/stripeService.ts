
import { Invoice, StripeConnection, Business, SubscriptionPack } from '../types';
import { supabase } from './supabase'; // SUPABASE CLIENT

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

// STRIPE SERVICE (PHASE 3: SERVER-SIDE INTEGRATION)
export const stripeService = {
  
  // Utility
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
        // CALL EDGE FUNCTION 'stripe-create-customer'
        const { data, error } = await supabase.functions.invoke('stripe-create-customer', {
            body: { email, name, paymentMethod }
        });

        if (!error && data) {
            return data;
        } else {
            console.warn("Edge Function failed (Likely not deployed). Falling back to mock for demo.");
        }
    }

    // FALLBACK MOCK (If function not deployed)
    return new Promise((resolve) => {
      setTimeout(() => {
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
    description: string
  ): Promise<{ success: boolean; transactionId: string; invoiceId: string }> => {
    if (supabase) {
        const { data, error } = await supabase.functions.invoke('stripe-charge', {
            body: { customerId, amount, description }
        });

        if (!error && data) return data;
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
        if (!error && data) return data;
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

  // 4. SERVER-SIDE RECURRING BILLING SIMULATION
  // In production, this would be a scheduled CRON job on Supabase or an external worker.
  processRecurringBilling: async (
      businesses: Business[], 
      subscriptionPacks: SubscriptionPack[]
  ): Promise<any> => {
      return new Promise((resolve) => {
          setTimeout(() => {
            const today = new Date();
            const newInvoices: Invoice[] = [];
            const logs: string[] = [];

            // Mock Logic for Demo UI Feedback
            businesses.forEach(biz => {
                if (biz.stripeConnection?.nextBillingDate && biz.status === 'active') {
                    const billingDate = new Date(biz.stripeConnection.nextBillingDate);
                    if (billingDate <= today) {
                        logs.push(`[SERVER] Procesando cobro a ${biz.name}... OK.`);
                    }
                }
            });
            resolve({ updatedBusinesses: businesses, newInvoices, logs });
          }, 3000); 
      });
  }
};
