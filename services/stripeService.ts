
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

// STRIPE SERVICE (PRODUCTION READY)
export const stripeService = {
  
  // Utility: Calculate Taxes locally for UI display
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

  // 1. CREATE CUSTOMER
  // Calls Supabase Edge Function: 'stripe-create-customer'
  createCustomer: async (email: string, name: string, paymentMethod: PaymentMethod): Promise<{ customerId: string, last4: string, brand: string }> => {
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
        const { data, error } = await supabase.functions.invoke('stripe-create-customer', {
            body: { email, name, paymentMethod }
        });

        if (error) throw new Error(error.message || "Error creating Stripe customer");
        if (!data || !data.customerId) throw new Error("Invalid response from payment server");

        return {
            customerId: data.customerId,
            last4: data.last4 || 'xxxx',
            brand: data.brand || 'Unknown'
        };
    } catch (err: any) {
        console.error("Stripe Create Customer Error:", err);
        throw new Error("No se pudo crear el cliente de pago. Verifique los datos de la tarjeta.");
    }
  },

  // 2. PROCESS ONE-TIME PAYMENT
  // Calls Supabase Edge Function: 'stripe-payment'
  processPayment: async (
    customerId: string | undefined, 
    amount: number, 
    description: string
  ): Promise<{ success: boolean; transactionId: string; invoiceId: string }> => {
    if (!supabase) throw new Error("Supabase client not initialized");
    if (!customerId) throw new Error("Customer ID is required for payment");

    try {
        const { data, error } = await supabase.functions.invoke('stripe-payment', {
            body: { 
                customerId, 
                amount: Math.round(amount * 100), // Stripe expects cents
                description,
                currency: 'eur' 
            }
        });

        if (error) throw new Error(error.message);
        
        return {
            success: true,
            transactionId: data.paymentIntentId,
            invoiceId: data.invoiceId || `INV-${Date.now()}` // Fallback ID if not provided by backend logic
        };
    } catch (err: any) {
        console.error("Payment Processing Error:", err);
        throw new Error("El pago ha sido rechazado o ha fallado la conexión.");
    }
  },

  // 3. CREATE SUBSCRIPTION
  // Calls Supabase Edge Function: 'stripe-subscription'
  createSubscription: async (customerId: string, priceId: string): Promise<{ subscriptionId: string; status: string; nextBilling: string }> => {
    if (!supabase) throw new Error("Supabase client not initialized");

    try {
        const { data, error } = await supabase.functions.invoke('stripe-subscription', {
            body: { customerId, priceId }
        });

        if (error) throw new Error(error.message);

        return {
            subscriptionId: data.subscriptionId,
            status: data.status,
            nextBilling: data.currentPeriodEnd // Should be ISO String from backend
        };
    } catch (err: any) {
        console.error("Subscription Error:", err);
        throw new Error("No se pudo activar la suscripción recurrente.");
    }
  },

  // 4. SERVER-SIDE BILLING TRIGGER
  // In a real scenario, this is just a helper to trigger a backend job manually from the Admin Dashboard
  processRecurringBilling: async (
      businesses: Business[], 
      subscriptionPacks: SubscriptionPack[]
  ): Promise<any> => {
      if (!supabase) return { logs: ["Offline mode"] };

      // Trigger the billing cron job manually via Edge Function
      const { data, error } = await supabase.functions.invoke('trigger-billing-cycle', {});
      
      if (error) return { logs: ["Error triggering billing cycle: " + error.message] };
      return { 
          logs: ["[SERVER] Ciclo de facturación iniciado en segundo plano.", `Job ID: ${data?.jobId}`],
          updatedBusinesses: businesses, // In reality, data would be refreshed via websocket/subscription
          newInvoices: [] 
      };
  }
};
