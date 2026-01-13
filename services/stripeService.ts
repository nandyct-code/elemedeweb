
import { Invoice, StripeConnection, Business, SubscriptionPack } from '../types';

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

// STRIPE SERVICE (PHASE 2: PREPARED FOR BACKEND INTEGRATION)
// These functions simulate calls to a secure backend (e.g., Node.js/Edge Functions)
// Real Stripe processing MUST happen on the server to handle secrets securely.

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

  // 1. CREATE CUSTOMER (Simulates POST /api/stripe/create-customer)
  createCustomer: async (email: string, name: string, paymentMethod: PaymentMethod): Promise<{ customerId: string, last4: string, brand: string }> => {
    return new Promise((resolve, reject) => {
      // Simulate API Latency
      setTimeout(() => {
        if (!paymentMethod.number || paymentMethod.number.length < 12) {
          reject(new Error("Número de tarjeta inválido."));
          return;
        }
        
        // Mock Response
        const last4 = paymentMethod.number.slice(-4);
        const brand = paymentMethod.number.startsWith('4') ? 'Visa' : 'MasterCard';
        
        console.log(`[SERVER-SIDE] Customer Created: ${email}`);
        resolve({
          customerId: `cus_${Math.random().toString(36).substr(2, 14)}`,
          last4,
          brand
        });
      }, 1500);
    });
  },

  // 2. PROCESS PAYMENT (Simulates POST /api/stripe/charge)
  processPayment: async (
    customerId: string | undefined, 
    amount: number, 
    description: string,
    paymentMethod?: PaymentMethod
  ): Promise<{ success: boolean; transactionId: string; invoiceId: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95% success rate
        
        if (success) {
          console.log(`[SERVER-SIDE] Payment Processed: ${amount}€ - ${description}`);
          resolve({
            success: true,
            transactionId: `ch_${Math.random().toString(36).substr(2, 18)}`,
            invoiceId: `in_${Math.random().toString(36).substr(2, 18)}`
          });
        } else {
          throw new Error("El banco ha rechazado la operación (Simulación).");
        }
      }, 2000);
    });
  },

  // 3. CREATE SUBSCRIPTION (Simulates POST /api/stripe/create-subscription)
  createSubscription: async (customerId: string, priceId: string): Promise<{ subscriptionId: string; status: string; nextBilling: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        console.log(`[SERVER-SIDE] Subscription Active: ${priceId}`);
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
  // NOTE: This function should NOT run on the client on mount. 
  // It is exposed here only for the "Admin Dashboard" manual trigger.
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

            console.log(`[SERVER-JOB] Iniciando Batch de Facturación...`);

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
          }, 3000); // Server processing time
      });
  }
};
